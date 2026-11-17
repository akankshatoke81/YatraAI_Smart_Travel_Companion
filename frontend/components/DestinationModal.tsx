"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Destination, api } from "@/services/api";
import TravelEstimator from "@/components/TravelEstimator";
import {
  X,
  MapPin,
  Clock,
  IndianRupee,
  Compass,
  Navigation,
  Sparkles,
  BookOpen,
  Landmark,
  Share2,
  Heart,
  Info,
  Calendar
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DestinationModalProps {
  destination: Destination | null;
  onClose: () => void;
}

export default function DestinationModal({ destination, onClose }: DestinationModalProps) {
  const router = useRouter();
  const { favouriteIds, toggleFavourite, isAuthenticated } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<any | null>(null);

  if (!destination) return null;

  const isFav = favouriteIds.includes(destination.id);

  const handleToggleFav = async () => {
    if (!isAuthenticated) {
      alert("Please log in to add to favourites.");
      return;
    }
    await toggleFavourite(destination.id);
  };

  const handleGetAiExplanation = async () => {
    try {
      setAiLoading(true);
      const data = await api.explainDestination(destination.id, "all");
      setAiExplanation(data);
    } catch (err) {
      alert("AI insights are temporarily unavailable. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGoTo2DMap = () => {
    router.push(`/map?destination_id=${destination.id}&dest_lat=${destination.latitude}&dest_lng=${destination.longitude}&name=${encodeURIComponent(destination.name)}`);
  };

  const handleGoToARNav = () => {
    router.push(`/ar-navigation?destination_id=${destination.id}&dest_lat=${destination.latitude}&dest_lng=${destination.longitude}&name=${encodeURIComponent(destination.name)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-cyan-800/40 rounded-3xl shadow-2xl shadow-cyan-900/20 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar with Close */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#0b1329]/95 backdrop-blur-md border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {destination.category}
            </span>
            <div className="flex items-center text-xs text-slate-400 space-x-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{destination.district_name}, {destination.region_name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleFav}
              className={`p-2 rounded-full border transition-colors ${isFav
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                }`}
              title={isFav ? "Favorited" : "Add to favourites"}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {destination.name}
            </h2>
            <p className="text-sm text-cyan-400/90 mt-0.5">
              Verified Heritage Site of Maharashtra, India
            </p>
          </div>

          {/* Hero Image Container with Attribution Overlay */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 h-64 sm:h-80 w-full group">
            <img
              src={destination.image_path || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"}
              alt={destination.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1329] via-transparent to-transparent opacity-80" />

            {/* Attribution Badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="truncate">Attribution: {destination.image_attribution || "Verified Wikimedia Public Domain Archive"}</span>
              <span className="text-cyan-400 font-medium ml-2 shrink-0">{destination.image_source || "ASI / MTDC Archive"}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Distance from You</span>
              <div className="flex items-center space-x-1 mt-1 text-teal-300 font-bold text-sm">
                <Navigation className="w-4 h-4 text-teal-400" />
                <span>{destination.distance_km !== null && destination.distance_km !== undefined ? `${destination.distance_km} km` : "Select Location"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Travel Duration</span>
              <div className="flex items-center space-x-1 mt-1 text-cyan-300 font-bold text-sm">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{destination.estimated_travel_time || "45 km/h avg"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Entry Fee</span>
              <div className="flex items-center space-x-0.5 mt-1 text-emerald-400 font-bold text-sm">
                <IndianRupee className="w-4 h-4" />
                <span>{destination.entry_fee === 0 ? "Free Entry" : `₹${destination.entry_fee}`}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Visit Duration</span>
              <div className="flex items-center space-x-1 mt-1 text-indigo-300 font-bold text-sm">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>{destination.visit_duration || "2 hours"}</span>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-2">
            <h4 className="text-base font-semibold text-slate-200 flex items-center space-x-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>About Destination</span>
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
              {destination.description}
            </p>
          </div>

          {/* Historical Significance */}
          {destination.history && (
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-slate-200 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Historical Significance</span>
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
                {destination.history}
              </p>
            </div>
          )}

          {/* Architecture Details */}
          {destination.architecture && (
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-slate-200 flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-teal-400" />
                <span>Architecture Information</span>
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
                {destination.architecture}
              </p>
            </div>
          )}

          {/* Opening Hours & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Opening Hours:</span>
              <p className="text-cyan-300 font-semibold">{destination.opening_hours || "09:00 AM - 06:00 PM"}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Geo Coordinates:</span>
              <p className="text-slate-200 font-mono">{destination.latitude.toFixed(4)}° N, {destination.longitude.toFixed(4)}° E</p>
            </div>
          </div>

          {/* AI Historical Explanations Container (Groq) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900/80 border border-indigo-700/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h4 className="text-sm font-bold text-white">AI Cultural Deep-Dive</h4>
              </div>
              <button
                onClick={handleGetAiExplanation}
                disabled={aiLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold btn-gradient flex items-center space-x-1.5 disabled:opacity-60"
              >
                {aiLoading ? (
                  <>
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Deep Insights</span>
                  </>
                )}
              </button>
            </div>

            {aiExplanation ? (
              <div className="space-y-3 mt-4 text-xs text-slate-200 border-t border-indigo-900/60 pt-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-900/40">
                  <span className="text-indigo-400 font-bold block mb-1">Cultural Significance:</span>
                  <p className="text-slate-300 leading-relaxed">{aiExplanation.cultural_significance}</p>
                </div>
                {aiExplanation.interesting_facts && aiExplanation.interesting_facts.length > 0 && (
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-900/40">
                    <span className="text-purple-400 font-bold block mb-1">Historical Facts:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {aiExplanation.interesting_facts.map((fact: string, idx: number) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 text-right">
                  Source: {aiExplanation.source}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Click &quot;Generate Deep Insights&quot; to receive grounded historical explanations, cultural significance, and architectural analysis powered by Groq LLaMA-3.3.
              </p>
            )}
          </div>

          {/* How do you want to travel? Transit Estimator */}
          <TravelEstimator
            destinationId={destination.id}
            destLat={destination.latitude}
            destLng={destination.longitude}
            destinationName={destination.name}
          />
        </div>

        {/* Footer Action Navigation Buttons (Primary Requirement) */}
        <div className="sticky bottom-0 z-20 p-4 bg-[#0b1329]/95 backdrop-blur-md border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={handleGoTo2DMap}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900/60 hover:shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all"
          >
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>2D Map Navigation</span>
          </button>

          <button
            onClick={handleGoToARNav}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold btn-gradient flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Compass className="w-4 h-4 text-purple-200" />
            <span>AR Navigation</span>
          </button>
        </div>
      </div>
    </div>
  );
}

