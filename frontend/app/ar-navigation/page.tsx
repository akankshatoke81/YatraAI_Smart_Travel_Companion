"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Compass, MapPin, Navigation, Info, ArrowLeft } from "lucide-react";
import { Destination, api } from "@/services/api";
import CameraAROverlay from "@/components/CameraAROverlay";

function ARNavigationContent() {
  const searchParams = useSearchParams();
  const paramDestId = searchParams.get("destination_id");
  const paramLat = searchParams.get("dest_lat");
  const paramLng = searchParams.get("dest_lng");
  const paramName = searchParams.get("name");

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestId, setSelectedDestId] = useState<number | null>(
    paramDestId ? Number(paramDestId) : null
  );

  // User current location: Default to Pune center coordinates
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 18.5204,
    lng: 73.8567,
  });

  useEffect(() => {
    // Load destination catalog
    api.getDestinations({ limit: 50 })
      .then((dests) => {
        setDestinations(dests);
        if (!selectedDestId && dests.length > 0) {
          // Default to Gateway of India or Shaniwar Wada
          const defDest = dests.find((d) => d.name.includes("Shaniwar")) || dests[0];
          setSelectedDestId(defDest.id);
        }
      })
      .catch((err) => console.error(err));

    // Detect GPS location
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const activeDestination = destinations.find((d) => d.id === selectedDestId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800 text-xs font-semibold text-purple-300 mb-2">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Camera AR Directional Guidance</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Browser Augmented Reality (AR) HUD
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual HUD calculating azimuth bearings and distance vectors toward heritage monuments.
          </p>
        </div>

        {/* Destination Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-semibold shrink-0">Target:</label>
          <select
            value={selectedDestId || ""}
            onChange={(e) => setSelectedDestId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 max-w-[220px]"
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AR Viewport Component */}
      <div className="w-full h-[580px] rounded-3xl overflow-hidden shadow-2xl">
        <CameraAROverlay
          destinationName={activeDestination ? activeDestination.name : paramName || "Maharashtra Monument"}
          targetLat={activeDestination ? activeDestination.latitude : paramLat ? Number(paramLat) : 18.5196}
          targetLng={activeDestination ? activeDestination.longitude : paramLng ? Number(paramLng) : 73.8553}
          userLat={userLocation.lat}
          userLng={userLocation.lng}
        />
      </div>

      {/* Educational & Architecture Note */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold">
          <Info className="w-4 h-4 shrink-0" />
          <span>System Capability & Architecture Disclosure</span>
        </div>
        <p className="leading-relaxed">
          This system provides lightweight browser-based sensor navigation: it uses WebRTC camera streams and Great-Circle mathematical azimuth vectors combined with mobile orientation sensors. For spatial point-cloud SLAM, specialized native frameworks (ARCore / ARKit) are required.
        </p>
      </div>
    </div>
  );
}

export default function ARNavigationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading AR HUD...</div>}>
      <ARNavigationContent />
    </Suspense>
  );
}

