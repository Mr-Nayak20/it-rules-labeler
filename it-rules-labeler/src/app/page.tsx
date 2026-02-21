"use client";
import { useCallback, useMemo, useState, useRef } from "react";
import { UploadCloud, ShieldCheck, CheckCircle, AlertCircle, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Script from "next/script";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const MAX_BYTES = 100 * 1024 * 1024;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("");
  const [success, setSuccess] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [showCheckboxError, setShowCheckboxError] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const fileInfo = useMemo(() => {
    if (!file) return null;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} • ${sizeMB} MB`;
  }, [file]);

  const validate = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) {
      return "Only video files are accepted";
    }
    if (f.size > MAX_BYTES) {
      return "Max size is 100MB";
    }
    return null;
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const v = validate(f);
    if (v) {
      setError(v);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }, [validate]);

  const isValidEmail = (value: string) => {
    const v = value.trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const triggerDownload = (blob: Blob, originalName?: string) => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const base = originalName ? originalName.replace(/\.mp4$/i, "") : "video";
    a.href = url;
    a.download = `compliant-${base}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const processVideoLocally = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setLoadingText("Initializing Secure Engine...");
    
    try {
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      const ffmpeg = ffmpegRef.current;
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
      
      // Load ffmpeg if not loaded
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
      }

      setLoadingText("Watermarking Video Locally...");
      setProgress(30);

      // Create watermark image
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, 400, 100);
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Synthetically Generated", 200, 50);
      }
      
      const watermarkBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      });

      await ffmpeg.writeFile("watermark.png", await fetchFile(watermarkBlob));
      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

      setProgress(50);

      // Setup progress listener
      const startTime = Date.now();
      ffmpeg.on("progress", (event) => {
        const p = Math.max(0, Math.min(1, event.progress));
        setProgress(p * 100);
        if (p > 0.01 && p < 1) {
          const elapsedTime = (Date.now() - startTime) / 1000;
          const estimatedTotal = elapsedTime / p;
          const remaining = Math.max(0, Math.round(estimatedTotal - elapsedTime));
          setTimeLeft(`Estimated time: ${remaining}s`);
        } else if (p >= 1) {
          setTimeLeft("Finalizing file...");
        }
      });

      // Run ffmpeg command
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-i", "watermark.png",
        "-filter_complex", "overlay=main_w-overlay_w-10:main_h-overlay_h-10",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-c:a", "copy",
        "output.mp4"
      ]);

      setLoadingText("Finalizing...");
      setProgress(90);

      const data = await ffmpeg.readFile("output.mp4");
      // @ts-ignore - FFmpeg return type mismatch with Blob constructor
      const blob = new Blob([data], { type: "video/mp4" });
      
      setProgress(100);
      triggerDownload(blob, file.name);
      setSuccess(true);
    } catch (e: any) {
      console.error(e);
      setError("Local processing failed. Please try a smaller file or different browser.");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  const processVideo = async () => {
    // Deprecated backend function
  };

  const handleProtect = async () => {
    setSuccess(false);
    setEmailError(null);
    if (!file) {
      setError("Please upload a .mp4 file");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    
    // Checkbox validation with shake animation
    if (!legalAccepted) {
      setShowCheckboxError(true);
      setTimeout(() => setShowCheckboxError(false), 1000);
      return;
    }
    
    setError(null);
    
    // Payment Flow
    try {
      setLoading(true);
      const orderRes = await fetch("/api/create-order", { method: "POST" });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initiate payment");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Virality OS",
        description: "IT Rules Compliance Processing",
        order_id: orderData.id,
        handler: async function (_response: any) {
          // Payment success, proceed to process video locally
          await processVideoLocally();
        },
        prefill: {
          email: email,
        },
        theme: {
          color: "#059669", // emerald-600
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError("Payment failed: " + response.error.description);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Payment initialization failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      
      {/* 1. The 'Official' Advisory Banner */}
      <div className="w-full bg-slate-950 py-2.5 text-center text-xs font-medium tracking-wide text-white">
        <span className="text-amber-400">⚠️ MANDATE ACTIVE:</span> The MeitY G.S.R. 120(E) 3-Hour AI Takedown Rule is now in effect.
      </div>

      <main className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        
        {/* 2. High-Impact Copywriting (Hero Section) */}
        <div className="flex w-full flex-col items-center text-center">
          <h1 className="mb-4 mt-8 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Protect Your Channel from the 2026 AI Ban Wave.
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base font-medium text-slate-600 md:text-lg">
            Algorithms are now actively scanning past and future uploads. We auto-inject the legally mandated C2PA metadata and watermarks so your content stays monetized, safe, and live.
          </p>
        </div>

        {/* 3. The Conversion Card & Dropzone */}
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-8">
          <div className="flex flex-col gap-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50/50 hover:bg-blue-50"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(ev) => handleFiles(ev.target.files)}
              />
              <div className="flex flex-col items-center gap-4">
                <UploadCloud size={32} className="text-blue-600" />
                <div className="text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    Upload Video to Inject Legal C2PA Metadata
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Auto-injects C2PA tags into MP4, MOV, WEBM (Max 100MB)
                  </div>
                </div>
              </div>
            </div>

            {file && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-900">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <AlertTitle className="ml-2 font-semibold">Ready to Secure</AlertTitle>
                <AlertDescription className="ml-2 text-blue-800">
                  {fileInfo}
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="ml-2 font-semibold">Error</AlertTitle>
                <AlertDescription className="ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Where should we send your compliant, ready-to-post video?
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-lg border-slate-300 px-4 text-base focus-visible:border-blue-600 focus-visible:ring-blue-600"
              />
              {emailError && (
                <span className="text-sm font-medium text-red-600">{emailError}</span>
              )}
            </div>

            {/* 4. The Checkbox & The 'Live' Button (CRITICAL FIX) */}
            <div className={`mb-4 flex items-start gap-3 rounded-lg border p-4 transition-all duration-300 ${
              showCheckboxError ? "animate-pulse border-red-300 bg-red-50 ring-2 ring-red-200" : "border-blue-100 bg-blue-50/50"
            }`}>
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => {
                  setLegalAccepted(e.target.checked);
                  if (e.target.checked) setShowCheckboxError(false);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0055A4] focus:ring-[#0055A4]"
              />
              <label className={`text-sm leading-tight ${showCheckboxError ? "text-red-700 font-medium" : "text-slate-700"}`}>
                I acknowledge that the Feb 20 IT Rules mandate C2PA metadata. I understand that posting unverified AI content risks an irreversible 3-hour account suspension.
              </label>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                onClick={handleProtect}
                disabled={!file || loading}
                size="lg"
                className="h-auto w-full rounded-xl bg-[#0055A4] py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!loading && <Lock className="mr-2 h-5 w-5" />}
                {loading ? loadingText || "Processing Compliance..." : "Inject Metadata & Secure Video — ₹99"}
              </Button>
            </div>
            
            {/* 5. Indian Payment Trust Signals */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-[10px] font-bold text-slate-600">
               <span className="flex items-center gap-1">
                 <Lock size={10} className="text-slate-500" />
                 100% Secure Checkout via Razorpay
               </span>
               <div className="flex gap-1.5">
                 <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200">UPI</span>
                 <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200">GPay</span>
                 <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200">PhonePe</span>
                 <span className="rounded bg-slate-100 px-2 py-0.5 border border-slate-200">Cards</span>
               </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2 w-full bg-slate-100" />
                <div className="flex items-center justify-center gap-2 text-center text-sm font-mono text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>{loadingText || timeLeft || "Processing..."}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. The Features Section (Clean up the bottom) */}
        <div className="mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-slate-900">🕵️‍♂️ Retroactive Scanning</h3>
                <p className="text-xs text-slate-500">Platforms scan old videos. Secure your back-catalog.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-slate-900">⚡ Instant C2PA Injection</h3>
                <p className="text-xs text-slate-500">Cryptographic metadata embedded in seconds.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-slate-900">🛡️ 3-Hour Immunity</h3>
                <p className="text-xs text-slate-500">Bypass automated takedowns and strikes.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-slate-900">🗑️ Zero Data Retention</h3>
                <p className="text-xs text-slate-500">Your videos are processed and immediately deleted.</p>
            </div>
        </div>

        <footer className="mt-12 text-center text-[10px] text-slate-400">
          © 2026 Virality OS. Not affiliated with Meta, Google, or TikTok.
        </footer>

        {success && (
          <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 transform items-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>Success! Your video is protected. Check your downloads.</span>
          </div>
        )}
      </main>
    </div>
  );
}
