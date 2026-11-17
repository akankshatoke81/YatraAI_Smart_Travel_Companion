"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Search,
  MapPin,
  Camera,
  Sparkles,
  WifiOff,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  Filter
} from "lucide-react";
import { Destination, api } from "@/services/api";
import DestinationCard from "@/components/DestinationCard";
import DestinationModal from "@/components/DestinationModal";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalDest, setActiveModalDest] = useState<Destination | null>(null);

  // Region options
  const regions = [
    "All",
    "Pune Region",
    "Mumbai Region",
    "Satara Region",
    "Kolhapur Region",
    "Sangli Region",
    "Konkan Region",
    "Nashik Region",
  ];

  useEffect(() => {
    fetchInitialData();
  }, [selectedCategory, selectedRegion]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [dests, cats] = await Promise.all([
        api.getDestinations({
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          region: selectedRegion !== "All" ? selectedRegion : undefined,
          search: searchQuery || undefined,
          limit: 16,
        }),
        api.getCategories(),
      ]);
      setDestinations(dests);
      setCategories(["All", ...cats]);
    } catch (err) {
      console.error("Failed to load homepage destinations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/places?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/20 to-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 shadow-lg shadow-cyan-950/40">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">
              Smart AI/ML Travel Companion
            </span>
          </div>

          {/* Large Centered Hero Heading (Exact Specification) */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Your Personal AI Travel Guide with{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Camera AR
            </span>
          </h1>

          {/* Subtitle (Exact Specification) */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Discover Maharashtra&apos;s heritage, identify monuments through your camera, receive budget-aware itineraries, and navigate with intelligent route guidance.
          </p>

          {/* Center Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-slate-900/90 border border-cyan-800/60 rounded-2xl p-2 shadow-2xl shadow-cyan-950/50 backdrop-blur-md focus-within:border-cyan-400 transition-colors"
            >
              <Search className="w-5 h-5 text-cyan-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Shaniwar Wada, Gateway of India, Forts, Temples, Beaches..."
                className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="btn-cyan px-6 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-transform active:scale-95 shadow-md shadow-cyan-600/30"
              >
                Search
              </button>
            </form>
          </div>

          {/* 4 Prominent Hero Action Buttons (Exact Specification) */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <Link
              href="/nearby"
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-teal-500/60 hover:bg-slate-900 transition-all text-center flex flex-col items-center group shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-950/70 border border-teal-800/60 flex items-center justify-center text-teal-400 mb-2 group-hover:scale-110 transition-transform">
                <Navigation className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-300">
                Explore Nearby Places
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">GPS Proximity Discovery</span>
            </Link>

            <Link
              href="/scanner"
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-900 transition-all text-center flex flex-col items-center group shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300">
                Launch AI Camera Scanner
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">YOLO Landmark Vision</span>
            </Link>

            <Link
              href="/recommender"
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/60 hover:bg-slate-900 transition-all text-center flex flex-col items-center group shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-950/70 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300">
                Personalized Recommendations
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">Groq LLaMA Itineraries</span>
            </Link>

            <Link
              href="/offline"
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/60 hover:bg-slate-900 transition-all text-center flex flex-col items-center group shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                <WifiOff className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300">
                Offline Mode
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">Cached Local Storage</span>
            </Link>
          </div>
        </div>
      </section>

      {/* REGION & CATEGORY PILLS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-4">
        {/* Regions Horizontal Scroller */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1 shrink-0 mr-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Regions:</span>
          </span>
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                selectedRegion === reg
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                  : "bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-cyan-500/40"
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Categories Horizontal Scroller */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1 shrink-0 mr-2">
              <Filter className="w-3.5 h-3.5 text-teal-400" />
              <span>Category:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* DESTINATIONS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Maharashtra Heritage & Attractions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified historical monuments, hill fortresses, ancient temples, and coastal destinations
            </p>
          </div>

          <Link
            href="/places"
            className="flex items-center space-x-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 group"
          >
            <span>View All ({destinations.length})</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800/60" />
            ))}
          </div>
        ) : destinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onSelect={(d) => setActiveModalDest(d)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-2">
            <Compass className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">
              {selectedRegion !== "All"
                ? `No destinations found in this region (${selectedRegion}).`
                : "No destinations found."}
            </h3>
            <p className="text-sm text-slate-400">
              Try adjusting your region or category filter above.
            </p>
          </div>
        )}
      </section>

      {/* AIML ACADEMIC ARCHITECTURE HIGHLIGHT */}
      <section className="border-t border-slate-800/80 bg-slate-950/60 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              AIML Technology Architecture
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Engineered for Modern Travel Intelligence
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-900/40">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center mb-3">
                <Camera className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">YOLO Computer Vision</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lightweight YOLO monument recognition pipeline trained on Maharashtra architectural landmarks with confidence scoring.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-teal-900/40">
              <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center mb-3">
                <Navigation className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">A* Pathfinding Algorithm</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Heuristic graph search algorithm using Haversine distance over Maharashtra road network intersections.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-indigo-900/40">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Groq LLaMA Planner</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Budget-aware, time-constrained itinerary synthesizer strictly grounded on verified MySQL destination data.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-purple-900/40">
              <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mb-3">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Camera AR Guidance</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time browser camera HUD calculating Great-Circle azimuth bearings and distance vectors to destination waypoints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Destination Details Modal */}
      {activeModalDest && (
        <DestinationModal
          destination={activeModalDest}
          onClose={() => setActiveModalDest(null)}
        />
      )}
    </div>
  );
}

