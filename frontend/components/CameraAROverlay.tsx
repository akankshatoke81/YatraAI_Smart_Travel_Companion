"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, Navigation, AlertCircle, Compass as CompassIcon, VideoOff, RefreshCw, ArrowUp, CheckCircle2 } from "lucide-react";

interface CameraAROverlayProps {
  destinationName: string;
  targetLat: number;
  targetLng: number;
  userLat?: number | null;
  userLng?: number | null;
}

export default function CameraAROverlay({
  destinationName,
  targetLat,
  targetLng,
  userLat,
  userLng,
}: CameraAROverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [targetBearing, setTargetBearing] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [orientationAvailable, setOrientationAvailable] = useState<boolean>(false);

  // Calculate Great-Circle Bearing (Azimuth) and Haversine Distance
  useEffect(() => {
    if (userLat === undefined || userLat === null || userLng === undefined || userLng === null) {
      return;
    }

    const lat1 = (userLat * Math.PI) / 180;
    const lon1 = (userLng * Math.PI) / 180;
    const lat2 = (targetLat * Math.PI) / 180;
    const lon2 = (targetLng * Math.PI) / 180;

    const dLon = lon2 - lon1;

    // Bearing formula
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    brng = (brng + 360) % 360;
    setTargetBearing(brng);

    // Haversine distance
    const R = 6371; // Earth radius in km
    const dLat = lat2 - lat1;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistanceKm(parseFloat((R * c).toFixed(2)));
  }, [userLat, userLng, targetLat, targetLng]);

  // Request Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported on this device/browser.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || "Unable to access device camera. Please check camera permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Listen to Compass / Device Orientation sensors
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading for iOS, alpha for Android
      let heading = (e as any).webkitCompassHeading;
      if (heading === undefined || heading === null) {
        if (e.alpha !== null) {
          heading = 360 - e.alpha;
        }
      }

      if (heading !== undefined && heading !== null) {
        setDeviceHeading(heading);
        setOrientationAvailable(true);
      }
    };

    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
      stopCamera();
    };
  }, []);

  // Relative heading difference (-180 to +180)
  const relativeAngle = ((targetBearing - deviceHeading + 540) % 360) - 180;

  // Direction guidance text
  const getGuidanceText = () => {
    if (Math.abs(relativeAngle) < 15) return "Target Directly Ahead";
    if (relativeAngle > 0) return `Turn Right ${Math.round(relativeAngle)}°`;
    return `Turn Left ${Math.round(Math.abs(relativeAngle))}°`;
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden bg-slate-950 border border-cyan-800/50 shadow-2xl flex flex-col justify-between">
      {/* Background: Camera Stream OR Non-Camera Fallback */}
      {cameraActive ? (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 bg-gradient-to-b from-slate-900 via-navy-950 to-slate-950">
          <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-800 flex items-center justify-center mb-4">
            <VideoOff className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">AR Camera Live Preview</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {cameraError || "Launch camera mode to view directional AR vectors overlaid in real time against your surroundings."}
          </p>
          <button
            onClick={startCamera}
            className="px-6 py-3 rounded-xl btn-gradient font-bold text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
          >
            <Camera className="w-4 h-4" />
            <span>Enable Camera Guidance</span>
          </button>
        </div>
      )}

      {/* AR HUD OVERLAYS (Z-index 20) */}
      <div className="relative z-20 p-4 sm:p-6 flex items-start justify-between bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block mb-1">
            AR Target Waypoint
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
            {destinationName}
          </h2>
          <div className="flex items-center space-x-2 mt-1 text-xs text-slate-300">
            <span className="font-bold text-teal-300">{distanceKm} km away</span>
            <span>•</span>
            <span className="text-cyan-300 font-mono">Bearing: {Math.round(targetBearing)}° N</span>
          </div>
        </div>

        {/* Live Camera Toggle Switch */}
        {cameraActive && (
          <button
            onClick={stopCamera}
            className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-red-400 backdrop-blur-md"
            title="Stop Camera Stream"
          >
            <VideoOff className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Center 3D AR Waypoint Reticle and Compass Indicator */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto px-4 py-8 pointer-events-none">
        {/* Animated Directional Reticle */}
        <div className="relative w-44 h-44 rounded-full border-2 border-cyan-500/30 flex items-center justify-center backdrop-blur-[2px]">
          {/* Outer Compass Degree Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/20 animate-spin-slow" />

          {/* Target Azimuth Direction Arrow */}
          <div
            className="transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${relativeAngle}deg)` }}
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-t from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <ArrowUp className="w-7 h-7 text-white animate-bounce" />
              </div>
              <div className="w-1 h-10 bg-cyan-400/80 mt-1 rounded-full" />
            </div>
          </div>

          {/* Center Target Core */}
          <div className="absolute w-6 h-6 rounded-full bg-slate-950/80 border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
        </div>

        {/* Dynamic Guidance Pill */}
        <div className="mt-6 px-5 py-2 rounded-full bg-slate-950/80 border border-cyan-500/50 backdrop-blur-md shadow-xl flex items-center space-x-2">
          {Math.abs(relativeAngle) < 15 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
          )}
          <span className="text-sm font-bold text-white tracking-wide">
            {getGuidanceText()}
          </span>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="relative z-20 p-4 sm:p-6 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Device Heading</span>
            <span className="font-mono font-bold text-cyan-300">{Math.round(deviceHeading)}°</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Waypoint Bearing</span>
            <span className="font-mono font-bold text-teal-300">{Math.round(targetBearing)}°</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Orientation Sensor</span>
            <span className={`font-semibold ${orientationAvailable ? "text-emerald-400" : "text-amber-400"}`}>
              {orientationAvailable ? "Active" : "Simulated"}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          <strong>Note:</strong> Browser AR uses camera overlays with real-time compass & GPS azimuth bearing guidance. On mobile devices, enable compass sensor access for optimal precision.
        </p>
      </div>
    </div>
  );
}

