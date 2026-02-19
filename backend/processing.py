import logging
import ffmpeg
import shutil
import subprocess
import os
import uuid
import sys
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger("backend.processing")


class WatermarkError(Exception):
  pass


class C2PAError(Exception):
  pass


def create_watermark_image(output_path: str, text: str = "Synthetically Generated") -> None:
  """
  Generates a transparent PNG image with the given text.
  """
  # Create a transparent image
  width, height = 400, 100
  img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
  draw = ImageDraw.Draw(img)
  
  # Load a font (try default, fallback to simple)
  try:
    font = ImageFont.truetype("Arial", 36)
  except IOError:
    font = ImageFont.load_default()
    
  # Calculate text size using getbbox if possible, else estimate
  try:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_w, text_h = right - left, bottom - top
  except AttributeError:
    # Fallback for older Pillow versions
    text_w, text_h = draw.textsize(text, font=font)
    
  # Draw semi-transparent white text
  # Using a semi-transparent white color (255, 255, 255, 200)
  # Position: centered in the image for simplicity, or just draw at 0,0
  # Let's make the image size fit the text + padding
  padding = 20
  img_w = text_w + padding * 2
  img_h = text_h + padding * 2
  img = Image.new("RGBA", (int(img_w), int(img_h)), (0, 0, 0, 0))
  draw = ImageDraw.Draw(img)
  
  # Optional: Draw a semi-transparent black background box
  draw.rectangle([(0, 0), (img_w, img_h)], fill=(0, 0, 0, 90))
  
  # Draw text
  draw.text((padding, padding), text, font=font, fill=(255, 255, 255, 200))
  
  img.save(output_path, "PNG")


def watermark_video(input_path: str, output_path: str) -> None:
  if shutil.which("ffmpeg") is None:
    raise WatermarkError("ffmpeg binary not found on PATH")
  
  logger.info("watermark.start input=%s output=%s", input_path, output_path)
  
  # Generate watermark image
  wm_image_path = os.path.join(os.path.dirname(output_path), f"wm_img_{uuid.uuid4().hex}.png")
  create_watermark_image(wm_image_path, "Synthetically Generated")
  
  try:
    stream = ffmpeg.input(input_path)
    overlay_img = ffmpeg.input(wm_image_path)
    
    # Apply overlay filter
    # x=main_w-overlay_w-10:y=main_h-overlay_h-10
    video = ffmpeg.overlay(
      stream,
      overlay_img,
      x="main_w-overlay_w-10",
      y="main_h-overlay_h-10"
    )
    
    audio = stream.audio
    out = ffmpeg.output(
      video,
      audio,
      output_path,
      vcodec="libx264",
      acodec="aac",
      movflags="faststart",
      pix_fmt="yuv420p",
      format="mp4",
    ).overwrite_output()

    # We use .overwrite_output() on the stream above, so we don't strictly need it in run(),
    # but keeping capture_stdout/stderr is crucial for error reporting.
    ffmpeg.run(out, capture_stdout=True, capture_stderr=True)
  except ffmpeg.Error as e:
    stderr = getattr(e, "stderr", b"") or b""
    msg = stderr.decode("utf-8", "ignore")
    # Extract the last 5 lines for a concise error message
    last_lines = "\n".join(msg.strip().splitlines()[-5:])
    logger.exception("watermark.ffmpeg_error %s", msg)
    raise WatermarkError(f"ffmpeg failed: {last_lines}")
  finally:
    # Cleanup the generated watermark image
    if os.path.exists(wm_image_path):
      os.remove(wm_image_path)
  
  logger.info("watermark.done output=%s size=%s", output_path, os.path.exists(output_path) and os.path.getsize(output_path))


def inject_c2pa(input_path: str, output_path: str, manifest_path: str) -> None:
  logger.info("c2pa.start input=%s output=%s manifest=%s", input_path, output_path, manifest_path)
  if shutil.which("c2patool") is None:
    logger.warning("c2pa.skip tool_not_found")
    # Fallback: copy input to output to avoid hard failure
    shutil.copyfile(input_path, output_path)
    return
  cmd = ["c2patool", input_path, "-m", manifest_path, "-o", output_path]
  try:
    subprocess.run(cmd, check=True, capture_output=True, text=True)
  except subprocess.CalledProcessError as e:
    logger.exception("c2pa.error returncode=%s stdout=%s stderr=%s", e.returncode, e.stdout, e.stderr)
    raise C2PAError(f"c2patool failed: {str(e)[:500]}")
  logger.info("c2pa.done output=%s size=%s", output_path, os.path.exists(output_path) and os.path.getsize(output_path))
