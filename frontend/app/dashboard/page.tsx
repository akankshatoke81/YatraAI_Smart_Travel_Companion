"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Heart,
  Compass,
  MapPin,
  Calendar,
  Sparkles,
  Camera,
  Navigation,
  ArrowRight,
  Clock,
  IndianRupee,
  Shield
} from "lucide-react";
import { Destination, api } from "@/services/api";
import DestinationCard from "@/components/DestinationCard";
import DestinationModal from "@/components/DestinationModal";

export default function UserDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [favourites, setFavourites] = useState<Destination[]>([]);
  const [savedItineraries, setSavedItineraries] = useState<any[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalDest, setActiveModalDest] = useState<Destination | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [favs, itineraries, nearby] = await Promise.all([
        api.getFavourites(),
        api.getSavedItineraries(),
        api.getDestinations({ limit: 4, user_lat: 18.5204, user_lng: 73.8567 }),
      ]);
      setFavourites(favs);
      setSavedItineraries(itineraries);
      setNearbyPlaces(nearby);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading your travel dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-cyan-800/40 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-semibold">
            <span>Namaste, Traveler</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome back, {user?.name || "Traveler"}!
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Ready to explore Maharashtra? Use camera AR navigation to spot Sahyadri landmarks, plan budget itineraries with Groq AI, and save your favourite monuments offline.
          </p>

          {/* Quick Shortcuts */}
          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/recommender"
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create AI Itinerary</span>
            </Link>
            <Link
              href="/scanner"
              className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Landmark</span>
            </Link>
            <Link
              href="/map"
              className="bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2"
            >
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>2D Road Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Favourites</span>
            <Heart className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-black text-white">{favourites.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Monuments pinned</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Itineraries</span>
            <Calendar className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{savedItineraries.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Custom tours generated</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offline Status</span>
            <Compass className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">Ready</p>
          <span className="text-xs text-slate-400 mt-1 block">IndexedDB Sync Supported</span>
        </div>
      </div>

      {/* SAVED FAVOURITES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-400 fill-current" />
            <span>My Favourites ({favourites.length})</span>
          </h2>
          <Link href="/places" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            Explore more places →
          </Link>
        </div>

        {favourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favourites.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onSelect={(d) => setActiveModalDest(d)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <Heart className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No favourite destinations saved yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click the heart icon on any destination card to bookmark monuments for quick access.
            </p>
            <Link href="/places" className="inline-block mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300">
              Browse Maharashtra Places →
            </Link>
          </div>
        )}
      </div>

      {/* SAVED ITINERARIES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Saved Custom Itineraries ({savedItineraries.length})</span>
          </h2>
          <Link href="/recommender" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            Generate new trip →
          </Link>
        </div>

        {savedItineraries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedItineraries.map((it) => (
              <div
                key={it.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{it.title}</h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span>Start: {it.starting_location}</span>
                      <span>•</span>
                      <span>Budget: ₹{it.budget}</span>
                      <span>•</span>
                      <span>{it.available_time}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block">
                    Stops in Sequence:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {it.destinations.map((dItem: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        {dItem.visit_order}. {dItem.destination.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-white">No custom itineraries saved</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Use our AI Recommender to design budget-aware itineraries and save them directly to your profile.
            </p>
            <Link
              href="/recommender"
              className="inline-block mt-2 btn-gradient px-4 py-2 rounded-xl text-xs font-bold"
            >
              Launch AI Planner
            </Link>
          </div>
        )}
      </div>

      {/* NEARBY PLACES PREVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-teal-400" />
            <span>Recommended Near Pune / Maharashtra Hub</span>
          </h2>
          <Link href="/nearby" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            View all nearby →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {nearbyPlaces.map((dest) => (
            <DestinationCard
              key={dest.id}
              destination={dest}
              onSelect={(d) => setActiveModalDest(d)}
            />
          ))}
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

