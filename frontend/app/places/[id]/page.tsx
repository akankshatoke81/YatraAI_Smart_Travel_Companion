"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  IndianRupee,
  Navigation,
  Compass,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Landmark,
  Heart,
  Share2
} from "lucide-react";
import { Destination, api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import TravelEstimator from "@/components/TravelEstimator";

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const { favouriteIds, toggleFavourite, isAuthenticated } = useAuth();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<any | null>(null);

  useEffect(() => {
    if (id) {
      loadDestination();
    }
  }, [id]);

  const loadDestination = async () => {
    try {
      setLoading(true);
      const dest = await api.getDestinationById(id);
      setDestination(dest);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading destination profile...</p>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Destination Not Found</h2>
        <p className="text-sm text-slate-400">The requested monument record does not exist.</p>
        <Link href="/places" className="inline-block btn-gradient px-4 py-2 rounded-xl text-xs font-bold">
          Back to Places Catalog
        </Link>
      </div>
    );
  }

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
    } catch (_) {
      alert("AI insights are temporarily unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back link */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to previous page</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-[#0b1329] border border-cyan-900/40 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Title */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {destination.category}
              </span>
              <div className="flex items-center text-xs text-slate-400 space-x-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{destination.district_name}, {destination.region_name}</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {destination.name}
            </h1>
          </div>

          <button
            onClick={handleToggleFav}
            className={`p-3 rounded-full border transition-colors ${
              isFav
                ? "bg-red-500/20 border-red-500/50 text-red-400"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Hero Photograph with Attribution */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-80 sm:h-96 w-full">
          <img
            src={destination.image_path || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1329] via-transparent to-transparent opacity-80" />

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="truncate">Attribution: {destination.image_attribution || "Verified Public Domain Photo"}</span>
            <span className="text-cyan-400 font-semibold ml-2 shrink-0">{destination.image_source || "ASI / MTDC Archive"}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 block">Entry Fee</span>
            <div className="flex items-center space-x-1 mt-1 text-emerald-400 font-bold text-base">
              <IndianRupee className="w-4 h-4" />
              <span>{destination.entry_fee === 0 ? "Free" : `₹${destination.entry_fee}`}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 block">Visit Duration</span>
            <div className="flex items-center space-x-1 mt-1 text-cyan-300 font-bold text-base">
              <Clock className="w-4 h-4" />
              <span>{destination.visit_duration || "2 hours"}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 block">Opening Hours</span>
            <span className="text-slate-200 font-bold text-xs mt-1 block">
              {destination.opening_hours || "09:00 AM - 06:00 PM"}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 block">Coordinates</span>
            <span className="text-cyan-400 font-mono text-xs mt-1 block">
              {destination.latitude.toFixed(3)}°N, {destination.longitude.toFixed(3)}°E
            </span>
          </div>
        </div>

        {/* About */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">About Destination</h3>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {destination.description}
          </p>
        </div>

        {/* History */}
        {destination.history && (
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Historical Significance</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              {destination.history}
            </p>
          </div>
        )}

        {/* Architecture */}
        {destination.architecture && (
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-teal-400" />
              <span>Architecture & Design</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              {destination.architecture}
            </p>
          </div>
        )}

        {/* Groq AI Cultural Insights Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900/80 border border-indigo-700/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Groq AI Cultural Deep-Dive</h4>
            </div>
            <button
              onClick={handleGetAiExplanation}
              disabled={aiLoading}
              className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold"
            >
              {aiLoading ? "Consulting AI..." : "Generate AI Insights"}
            </button>
          </div>

          {aiExplanation ? (
            <div className="space-y-3 pt-3 border-t border-indigo-900/60 text-xs">
              <p className="text-slate-300 leading-relaxed"><strong className="text-indigo-300">Significance: </strong>{aiExplanation.cultural_significance}</p>
              {aiExplanation.interesting_facts && (
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {aiExplanation.interesting_facts.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Generate AI-grounded historical facts and architectural analysis strictly verified against state archives.
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

        {/* Action Buttons: 2D Map & AR Navigation */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            href={`/map?destination_id=${destination.id}&dest_lat=${destination.latitude}&dest_lng=${destination.longitude}&name=${encodeURIComponent(destination.name)}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900 flex items-center justify-center space-x-2 transition-all"
          >
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>2D Map Navigation</span>
          </Link>
          <Link
            href={`/ar-navigation?destination_id=${destination.id}&dest_lat=${destination.latitude}&dest_lng=${destination.longitude}&name=${encodeURIComponent(destination.name)}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold btn-gradient flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30"
          >
            <Compass className="w-4 h-4 text-purple-200" />
            <span>AR Navigation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

