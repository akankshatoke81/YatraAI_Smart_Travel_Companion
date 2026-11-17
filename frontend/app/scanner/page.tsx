"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Eye,
  VideoOff,
  Compass,
  Square,
  Clock,
  IndianRupee,
  MapPin,
  BookOpen,
  Landmark,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { api, LandmarkScanResult } from "@/services/api";
import DestinationModal from "@/components/DestinationModal";

export default function ScannerPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<LandmarkScanResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeModalDest, setActiveModalDest] = useState<any | null>(null);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Ensure stream is bound to video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((e) => {
          console.warn("Video playback autostart error:", e);
        });
      };
    }
  }, [stream]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCameraError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate format: JPG, JPEG, PNG, WEBP
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      const ext = file.name.split(".").pop()?.toLowerCase();
      const validExts = ["jpg", "jpeg", "png", "webp"];

      if (!validTypes.includes(file.type) && (!ext || !validExts.includes(ext))) {
        alert("Invalid file type. Please upload an image in JPG, JPEG, PNG, or WEBP format.");
        return;
      }

      // Validate file size: 10MB limit
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        alert(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
        return;
      }

      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setScanResult(null);
      stopCamera();
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    setScanResult(null);
    setSelectedFile(null);
    setImagePreview(null);

    // Check browser support
    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported by your current browser.");
      setCameraLoading(false);
      return;
    }

    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      let mediaStream: MediaStream | null = null;

      // 1. First try: Front-facing user webcam suitable for laptops
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (e) {
        console.warn("facingMode: 'user' failed, falling back to default camera:", e);
        // 2. Fallback: Request any available camera device without strict constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (mediaStream) {
        setStream(mediaStream);
        setCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.warn("Video play error on metadata load:", err);
            });
          };
        }
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errMsg = "Unable to access camera.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "Camera permission was denied. Please allow camera permissions in your browser address bar.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "No camera found on this device. Please connect a webcam or upload an image file.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errMsg = "Camera is currently in use by another application or browser tab.";
      } else if (err.name === "SecurityError") {
        errMsg = "Camera access requires a secure HTTPS context or localhost.";
      } else if (err.message) {
        errMsg = err.message;
      }

      setCameraError(errMsg);
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `monument_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(blob));
            setScanResult(null);
            stopCamera();
          }
        },
        "image/jpeg",
        0.95
      );
    }
  };

  const handleRunScan = async () => {
    if (!selectedFile) {
      alert("Please upload a photo or capture one using your camera first.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.scanMonument(selectedFile);
      setScanResult(res);
    } catch (err: any) {
      alert("Scanner request failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-xs font-semibold text-cyan-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>YOLO Landmark Computer Vision</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          AI Monument & Landmark Scanner
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Identify Maharashtra heritage monuments with our integrated YOLO model. Upload a photo or capture live video from your laptop camera.
        </p>
      </div>

      {/* Main Scanner Container */}
      <div className="bg-slate-900/90 border border-cyan-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Upload & Camera Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image (JPG, PNG, WEBP)</span>
          </button>

          {!cameraActive ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={cameraLoading}
              className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {cameraLoading ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-cyan-300 border-t-transparent rounded-full" />
                  <span>Connecting Webcam...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Start Camera</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={capturePhotoFromCamera}
                className="btn-cyan px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-cyan-600/30"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Image</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="bg-red-950/80 text-red-300 border border-red-800/80 hover:bg-red-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <VideoOff className="w-4 h-4" />
                <span>Stop Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Permission / Device Error Banner */}
        {cameraError && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/70 text-red-200 flex items-start space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Camera Error</span>
              <p className="text-red-300/90 leading-relaxed">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Viewport: Live Camera Video OR Image Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[340px] flex items-center justify-center">
          {/* Always-mounted video element to avoid React ref lifecycle unmounting */}
          <div className={`relative w-full h-[420px] ${cameraActive ? "block" : "hidden"}`}>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 rounded-2xl m-6 pointer-events-none flex items-center justify-center">
              <span className="text-xs font-bold text-cyan-300 bg-slate-950/90 px-4 py-1.5 rounded-full border border-cyan-800/60 shadow-lg">
                Center Monument inside Frame & Click &quot;Capture Image&quot;
              </span>
            </div>
          </div>

          {!cameraActive && imagePreview && (
            <div className="relative w-full max-h-[420px] flex items-center justify-center p-4">
              <img
                src={imagePreview}
                alt="Selected Landmark"
                className="max-h-[380px] rounded-xl object-contain shadow-2xl"
              />
            </div>
          )}

          {!cameraActive && !imagePreview && (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-300">No Image Loaded</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Upload a photo of any Maharashtra landmark (JPG, PNG, WEBP) or click &quot;Start Camera&quot; to use your laptop webcam.
                </p>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Run Scan Button Bar */}
        {selectedFile && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Selected: <strong className="text-white">{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={handleRunScan}
              disabled={loading}
              className="btn-gradient px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Processing YOLO Computer Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run YOLO Landmark Detection</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* SCAN RESULTS */}
        {scanResult && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            {/* Case 1: Model weights not configured */}
            {scanResult.status === "not_configured" && (
              <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-700/60 space-y-3">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-amber-200">
                      Landmark detection model is not configured
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scanResult.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      To activate automated vision identification, place trained Maharashtra landmark weights at <code className="text-cyan-300 bg-slate-900 px-2 py-0.5 rounded">backend/models/best.pt</code>.
                    </p>
                  </div>
                </div>
                <div className="pt-2 flex items-center space-x-3">
                  <Link
                    href="/places"
                    className="btn-cyan px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Browse Destination Catalog</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Case 2: Landmark not recognized */}
            {scanResult.status === "not_recognized" && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">Landmark Not Recognized</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scanResult.message}
                    </p>
                    <p className="text-xs text-slate-400">
                      Try capturing from a clearer angle with proper lighting or search the destination archive manually.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/places"
                    className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Destinations Manually</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Case 3: Error */}
            {scanResult.status === "error" && (
              <div className="p-6 rounded-2xl bg-red-950/30 border border-red-800/60 space-y-2">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Processing Error</span>
                </div>
                <p className="text-xs text-slate-300">{scanResult.message}</p>
              </div>
            )}

            {/* Case 4: Successfully Identified */}
            {scanResult.recognized && scanResult.destination && (
              <div className="p-6 rounded-3xl bg-cyan-950/30 border border-cyan-800/80 space-y-6 shadow-xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/60 pb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                        Identified Landmark ({Math.round(scanResult.confidence * 100)}% Confidence)
                      </span>
                      <h3 className="text-2xl font-black text-white">{scanResult.landmark_name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    {scanResult.bounding_box && (
                      <span className="text-[11px] font-mono text-cyan-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-cyan-900/60">
                        Box: [{scanResult.bounding_box.map((n) => Math.round(n)).join(", ")}]
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {scanResult.model_used}
                    </span>
                  </div>
                </div>

                {/* Destination Content Preview */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-full md:w-56 h-48 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                    <img
                      src={scanResult.destination.image_path || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"}
                      alt={scanResult.destination.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                        {scanResult.destination.category}
                      </span>
                      <div className="flex items-center text-slate-400 space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{scanResult.destination.district_name}, {scanResult.destination.region_name}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scanResult.destination.description}
                    </p>

                    {/* Historical & Architectural Summary */}
                    {scanResult.destination.history && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                        <span className="font-bold text-indigo-300 flex items-center space-x-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Historical Overview</span>
                        </span>
                        <p className="text-slate-300 line-clamp-2 leading-relaxed">
                          {scanResult.destination.history}
                        </p>
                      </div>
                    )}

                    {/* Meta info: Fee and Hours */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Entry Fee</span>
                        <span className="text-emerald-400 font-bold">
                          {scanResult.destination.entry_fee === 0 ? "Free Entry" : `₹${scanResult.destination.entry_fee}`}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Opening Hours</span>
                        <span className="text-slate-200 font-semibold truncate block">
                          {scanResult.destination.opening_hours || "09:00 AM - 06:00 PM"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Est. Visit Time</span>
                        <span className="text-cyan-300 font-semibold">
                          {scanResult.destination.visit_duration || "2 hours"}
                        </span>
                      </div>
                    </div>

                    {/* Navigation and View Details Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/places/${scanResult.destination.id}`}
                        className="btn-cyan px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-600/30"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Link>
                      <button
                        onClick={() => setActiveModalDest(scanResult.destination)}
                        className="bg-slate-800 text-slate-200 hover:bg-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <span>Quick Modal View</span>
                      </button>
                      <Link
                        href={`/map?destination_id=${scanResult.destination.id}&dest_lat=${scanResult.destination.latitude}&dest_lng=${scanResult.destination.longitude}&name=${encodeURIComponent(scanResult.destination.name)}`}
                        className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
                      >
                        <Compass className="w-4 h-4" />
                        <span>2D Map Navigation (A*)</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {activeModalDest && (
        <DestinationModal
          destination={activeModalDest}
          onClose={() => setActiveModalDest(null)}
        />
      )}
    </div>
  );
}
