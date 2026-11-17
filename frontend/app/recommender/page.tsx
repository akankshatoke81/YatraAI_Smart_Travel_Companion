"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MapPin,
  IndianRupee,
  Clock,
  Users,
  Compass,
  CheckCircle2,
  Bookmark,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { api, RecommendationResult } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import DestinationModal from "@/components/DestinationModal";

export default function RecommenderPage() {
  const { isAuthenticated } = useAuth();
  const [startingLocation, setStartingLocation] = useState("Pune Station");
  const [preferredRegion, setPreferredRegion] = useState("Pune Region");
  const [totalBudget, setTotalBudget] = useState(2500);
  const [availableTime, setAvailableTime] = useState("1 day");
  const [numTravellers, setNumTravellers] = useState(2);
  const [travelType, setTravelType] = useState("Heritage");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Forts", "Heritage"]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeModalDest, setActiveModalDest] = useState<any | null>(null);

  const interestOptions = [
    "Heritage",
    "Forts",
    "Architecture",
    "Temples",
    "Nature",
    "Beaches",
    "Food",
    "Culture",
    "Museums",
  ];

  const regions = [
    "All Maharashtra",
    "Pune Region",
    "Mumbai Region",
    "Satara Region",
    "Kolhapur Region",
    "Sangli Region",
    "Konkan Region",
    "Nashik Region",
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      const data = await api.generateRecommendations({
        starting_location: startingLocation,
        preferred_region: preferredRegion !== "All Maharashtra" ? preferredRegion : undefined,
        total_budget: Number(totalBudget),
        available_time: availableTime,
        interests: selectedInterests,
        num_travellers: Number(numTravellers),
        travel_type: travelType,
        user_lat: 18.5204,
        user_lng: 73.8567,
      });
      setResult(data);
    } catch (err) {
      alert("Failed to generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!isAuthenticated) {
      alert("Please log in to save itineraries to your profile.");
      return;
    }

    if (!result) return;

    try {
      await api.saveItinerary({
        title: result.title,
        starting_location: startingLocation,
        total_estimated_budget: result.total_estimated_budget,
        total_visiting_duration: result.total_visiting_duration,
        destinations: result.destinations,
      });
      setSaveSuccess(true);
    } catch (err) {
      alert("Failed to save itinerary.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-xs font-semibold text-indigo-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Groq LLaMA-3.3 Powered Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          AI Personalized Trip Recommender
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Enter your travel budget, duration, and preferences. Our system queries verified Maharashtra databases and arranges a realistic, distance-aware itinerary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* INPUT FORM (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <span>Trip Parameters</span>
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Starting Location */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Starting Point</label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-cyan-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  placeholder="e.g. Pune Station, Dadar, Mumbai Airport"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Region</label>
              <select
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget & Time Duration in Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Total Budget (₹)</label>
                <div className="relative flex items-center">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400 absolute left-3" />
                  <input
                    type="number"
                    min="200"
                    step="100"
                    required
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Available Time</label>
                <select
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Half day">Half day (4-5 hrs)</option>
                  <option value="1 day">1 day</option>
                  <option value="2 days">2 days (Weekend)</option>
                  <option value="3 days">3 days (Tour)</option>
                </select>
              </div>
            </div>

            {/* Travellers & Travel Style */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Travellers Count</label>
                <div className="relative flex items-center">
                  <Users className="w-3.5 h-3.5 text-blue-400 absolute left-3" />
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={numTravellers}
                    onChange={(e) => setNumTravellers(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Travel Style</label>
                <select
                  value={travelType}
                  onChange={(e) => setTravelType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Heritage">Historical Heritage</option>
                  <option value="Budget Friendly">Budget Friendly</option>
                  <option value="Family">Family Friendly</option>
                  <option value="Adventure">Adventure & Trekking</option>
                </select>
              </div>
            </div>

            {/* Interests Multi-Select Pills */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Target Interests ({selectedInterests.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {interestOptions.map((intr) => {
                  const active = selectedInterests.includes(intr);
                  return (
                    <button
                      key={intr}
                      type="button"
                      onClick={() => toggleInterest(intr)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${active
                          ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                        }`}
                    >
                      {intr}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-gradient font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 mt-4"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Synthesizing Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Itinerary</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* OUTPUT ITINERARY (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="bg-slate-900/90 border border-indigo-900/40 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
              {/* Output Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {result.ai_provider}
                    </span>
                    <span className="text-xs text-slate-400">Strictly Grounded on MySQL Records</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{result.title}</h2>
                  <p className="text-xs text-slate-300 mt-1">{result.summary}</p>
                </div>

                {/* Save Itinerary Button */}
                <button
                  onClick={handleSaveItinerary}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors ${saveSuccess
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Saved to Profile</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-cyan-400" />
                      <span>Save Itinerary</span>
                    </>
                  )}
                </button>
              </div>

              {/* Total Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Estimated Budget</span>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">₹{result.total_estimated_budget}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Duration</span>
                  <p className="text-base font-bold text-cyan-400 mt-0.5">{result.total_visiting_duration}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 block">Total Attractions</span>
                  <p className="text-base font-bold text-indigo-400 mt-0.5">{result.destinations.length} Stops</p>
                </div>
              </div>

              {/* Sequential Destination Stops */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                  Sequential Travel Schedule
                </h3>

                {result.destinations.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex flex-col sm:flex-row gap-4"
                  >
                    {/* Thumbnail */}
                    <div className="w-full sm:w-32 h-28 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={item.destination.image_path || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"}
                        alt={item.destination.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-cyan-400">
                            Stop {item.visit_order}: {item.suggested_time_slot}
                          </span>
                          <span className="font-semibold text-emerald-400">₹{item.estimated_cost}</span>
                        </div>
                        <h4 className="text-base font-bold text-white">{item.destination.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.reason}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {item.destination.district_name} • {item.destination.category}
                        </span>
                        <button
                          onClick={() => setActiveModalDest(item.destination)}
                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                        >
                          <span>Explore Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Your Itinerary will appear here</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Adjust starting point, budget, and desired Maharashtra regions on the left and click &quot;Generate AI Itinerary&quot; to begin.
              </p>
            </div>
          )}
        </div>
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

