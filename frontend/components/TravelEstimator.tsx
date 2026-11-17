"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  Train,
  Car,
  Footprints,
  LocateFixed,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Fuel,
  Navigation
} from "lucide-react";
import { api, TravelModeEstimate, TravelEstimateResponse } from "@/services/api";

interface TravelEstimatorProps {
  destinationId: number;
  destLat: number;
  destLng: number;
  destinationName: string;
}

export default function TravelEstimator({
  destinationId,
  destLat,
  destLng,
  destinationName,
}: TravelEstimatorProps) {
  const hubs: Record<string, { lat: number; lng: number }> = {
    "Pune Central Station": { lat: 18.5284, lng: 73.8739 },
    "Mumbai CSMT / Gateway": { lat: 18.922, lng: 72.8347 },
    "Satara City Hub": { lat: 17.6805, lng: 73.9997 },
    "Kolhapur Center": { lat: 16.705, lng: 74.2433 },
    "Nashik Central Hub": { lat: 19.9975, lng: 73.7898 },
    "Chhatrapati Sambhaji Nagar": { lat: 19.8762, lng: 75.3433 },
  };

  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number }>({
    lat: 18.5284,
    lng: 73.8739,
  });
  const [selectedHub, setSelectedHub] = useState<string>("Pune Central Station");
  const [isGps, setIsGps] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);
  const [estimateData, setEstimateData] = useState<TravelEstimateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch estimates whenever startPoint or destination changes
  useEffect(() => {
    fetchEstimates(startPoint.lat, startPoint.lng);
  }, [destinationId, destLat, destLng, startPoint]);

  const fetchEstimates = async (startLat: number, startLng: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTravelEstimate({
        start_lat: startLat,
        start_lng: startLng,
        dest_lat: destLat,
        dest_lng: destLng,
        destination_id: destinationId,
      });
      setEstimateData(res);
    } catch (err: any) {
      console.error("Travel estimate error:", err);
      setError("Unable to compute travel estimates.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseGps = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setIsGps(true);
        setSelectedHub("Live GPS");
        setStartPoint({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setLocating(false);
        alert("GPS access failed: " + err.message + ". Please pick a starting transit hub.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "bus":
        return <Bus className="w-5 h-5 text-amber-400" />;
      case "metro":
        return <Train className="w-5 h-5 text-indigo-400" />;
      case "auto":
        return <Car className="w-5 h-5 text-emerald-400" />;
      case "personal_vehicle":
        return <Fuel className="w-5 h-5 text-cyan-400" />;
      case "walking":
        return <Footprints className="w-5 h-5 text-teal-400" />;
      default:
        return <Navigation className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-800">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>How do you want to travel?</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare time, distance, and realistic fares across 5 travel modes for Maharashtra.
          </p>
        </div>

        {/* Starting Location Picker */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={locating}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              isGps
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>{locating ? "Locating..." : isGps ? "Using Live GPS" : "Use GPS"}</span>
          </button>

          <select
            value={isGps ? "Live GPS" : selectedHub}
            onChange={(e) => {
              const name = e.target.value;
              setSelectedHub(name);
              setIsGps(false);
              if (hubs[name]) {
                setStartPoint(hubs[name]);
              }
            }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            {isGps && <option value="Live GPS">Live GPS Location</option>}
            {Object.keys(hubs).map((h) => (
              <option key={h} value={h} className="bg-slate-900 text-white">
                From: {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full mr-2" />
          <span>Calculating transit schedules & Maharashtra RTO fare matrices...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Cards Grid (5 Modes) */}
      {estimateData && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Route Distance: <strong className="text-cyan-400">{estimateData.distance_km} km</strong>
            </span>
            <span className="text-[11px] text-slate-500">
              To: {estimateData.destination_name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {estimateData.estimates.map((est) => (
              <div
                key={est.mode}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  est.available
                    ? "bg-slate-900/80 border-slate-800 hover:border-cyan-600/60"
                    : "bg-slate-950/60 border-slate-800/50 opacity-60"
                }`}
              >
                <div>
                  {/* Card Header: Mode & Availability */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        {getModeIcon(est.mode)}
                      </div>
                      <span className="text-sm font-bold text-white">{est.mode_name}</span>
                    </div>

                    {est.available ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        Unavailable
                      </span>
                    )}
                  </div>

                  {/* Metrics: Time & Cost */}
                  {est.available ? (
                    <div className="grid grid-cols-2 gap-2 my-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Est. Time</span>
                        <div className="flex items-center space-x-1 font-bold text-cyan-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{est.travel_time_formatted}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Est. Cost / Fare</span>
                        <div className="flex items-center space-x-0.5 font-bold text-emerald-400">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{est.cost_formatted}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="my-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 text-xs text-amber-300/80">
                      <p className="text-[11px] leading-relaxed">
                        {est.unavailable_reason || "Not available for this route."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Details Footer */}
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed border-t border-slate-800/60 pt-2">
                  {est.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

