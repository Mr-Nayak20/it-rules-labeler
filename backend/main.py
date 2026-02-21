from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List
import os
import json
import uuid
import shutil
import tempfile
import logging
from logging.handlers import RotatingFileHandler

from processing import watermark_video, inject_c2pa, WatermarkError, C2PAError

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"],
  expose_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "The Compliance Engine is Awake and Live."}

def _setup_logging():
  os.makedirs(os.path.join(os.path.dirname(__file__), "logs"), exist_ok=True)
  logger = logging.getLogger("backend")
  logger.setLevel(logging.INFO)
  log_path = os.path.join(os.path.dirname(__file__), "logs", "app.log")
  handler = RotatingFileHandler(log_path, maxBytes=2_000_000, backupCount=3)
  formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
  handler.setFormatter(formatter)
  logger.addHandler(handler)
  logging.getLogger("backend.processing").addHandler(handler)
  logging.getLogger("backend.processing").setLevel(logging.INFO)
  return logger

logger = _setup_logging()

@app.post("/process-video")
@app.post("/process-video/")
async def process_video(file: UploadFile = File(...)):
  # Allow any video type but still enforce size
  if not file.content_type.startswith("video/"):
    raise HTTPException(status_code=400, detail="Only video files are accepted")

  max_bytes = 100 * 1024 * 1024

  with tempfile.TemporaryDirectory() as tmpdir:
    # Save input with original extension if possible, or default to bin
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    if not ext:
      ext = ".bin"
    src_path = os.path.join(tmpdir, f"input-{uuid.uuid4().hex}{ext}")
    
    size = 0
    with open(src_path, "wb") as f_out:
      while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
          break
        size += len(chunk)
        if size > max_bytes:
          raise HTTPException(status_code=413, detail="Max size is 100MB")
        f_out.write(chunk)

    # Force output to .mp4 for compatibility
    wm_path = os.path.join(tmpdir, f"wm-{uuid.uuid4().hex}.mp4")
    final_tmp_path = os.path.join(tmpdir, f"final-{uuid.uuid4().hex}.mp4")

    try:
      logger.info("pipeline.watermarking file=%s size=%s", file.filename, size)
      # Watermark function handles transcoding to mp4
      watermark_video(src_path, wm_path)
    except WatermarkError as e:
      logger.exception("pipeline.watermarking_failed %s", str(e))
      raise HTTPException(status_code=500, detail=f"Watermarking failed: {str(e)}")
    except Exception as e:
      logger.exception("pipeline.watermarking_unexpected %s", str(e))
      raise HTTPException(status_code=500, detail="Watermarking failed (unexpected)")

    manifest_path = os.path.join(tmpdir, "manifest.json")
    manifest = {
      "title": "Dummy C2PA Manifest",
      "assertions": [
        {"label": "generator", "data": {"name": "AI Video Watermarker"}},
        {"label": "watermark", "data": {"text": "AI-Generated"}},
      ],
    }
    with open(manifest_path, "w", encoding="utf-8") as mf:
      json.dump(manifest, mf)

    try:
      logger.info("pipeline.c2pa_injection file=%s", file.filename)
      inject_c2pa(wm_path, final_tmp_path, manifest_path)
    except C2PAError as e:
      logger.exception("pipeline.c2pa_failed %s", str(e))
      # Fall back to watermarked video if injection fails
      shutil.copyfile(wm_path, final_tmp_path)
    except Exception as e:
      logger.exception("pipeline.c2pa_unexpected %s", str(e))
      # Fall back to watermarked video
      shutil.copyfile(wm_path, final_tmp_path)

    persistent_final = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    persistent_final.close()
    shutil.copyfile(final_tmp_path, persistent_final.name)

    headers = {"X-C2PA-Injected": "true"} if os.path.getsize(final_tmp_path) != os.path.getsize(wm_path) else {"X-C2PA-Injected": "false"}
    
    # Ensure download filename is always .mp4
    original_base = os.path.splitext(file.filename or "video")[0]
    download_filename = f"compliant-{original_base}.mp4"
    
    return FileResponse(
      path=persistent_final.name,
      media_type="video/mp4",
      filename=download_filename,
      headers=headers,
    )
