"use client";

import React, { useState, useEffect } from "react";
import { Navigation, MapPin, RefreshCw, AlertCircle, Compass, Search, Filter } from "lucide-react";
import { Destination, api } from "@/services/api";
import DestinationCard from "@/components/DestinationCard";
import DestinationModal from "@/components/DestinationModal";

export default function NearbyPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHub, setSelectedHub] = useState<string>("Pune");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [activeModalDest, setActiveModalDest] = useState<Destination | null>(null);

  // Manual fallback hub options if GPS is disabled or for testing
  const manualHubs: Record<string, { lat: number; lng: number }> = {
    Pune: { lat: 18.5204, lng: 73.8567 },
    Mumbai: { lat: 18.922, lng: 72.8347 },
    Satara: { lat: 17.6805, lng: 73.9997 },
    Kolhapur: { lat: 16.705, lng: 74.2433 },
    Nashik: { lat: 19.9975, lng: 73.7898 },
    Ratnagiri: { lat: 16.9902, lng: 73.312 },
  };

  useEffect(() => {
    // Attempt automatic GPS location request
    requestGeolocation();
    api.getCategories().then((cats) => setCategories(["All", ...cats])).catch(() => { });
  }, []);

  const requestGeolocation = () => {
    setLoading(true);
    setGpsError(null);

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          fetchNearby(lat, lng);
        },
        (error) => {
          console.warn("Geolocation denied or unavailable:", error.message);
          setGpsError("GPS permission denied or timed out. Defaulting to Pune central hub; you can select another district below.");
          const defaultLoc = manualHubs["Pune"];
          setUserLocation(defaultLoc);
          fetchNearby(defaultLoc.lat, defaultLoc.lng);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsError("Browser geolocation not supported. Using selected Maharashtra hub.");
      const defaultLoc = manualHubs["Pune"];
      setUserLocation(defaultLoc);
      fetchNearby(defaultLoc.lat, defaultLoc.lng);
    }
  };

  const fetchNearby = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const dests = await api.getNearbyDestinations(lat, lng, 300);
      setDestinations(dests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualHubChange = (hubName: string) => {
    setSelectedHub(hubName);
    const coords = manualHubs[hubName];
    if (coords) {
      setUserLocation(coords);
      fetchNearby(coords.lat, coords.lng);
    }
  };

  // Filter list by search & category
  const filteredDestinations = destinations.filter((d) => {
    const matchesSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.district_name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center space-x-3">
          <Navigation className="w-8 h-8 text-teal-400" />
          <span>Nearby Tourist Destinations</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time distance calculations to cultural landmarks, fortresses, and sights across Maharashtra.
        </p>
      </div>

      {/* GPS Location & Hub Selector Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-teal-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Current Location Anchor:</span>
              <p className="text-sm font-bold text-white">
                {userLocation
                  ? `${userLocation.lat.toFixed(4)}° N, ${userLocation.lng.toFixed(4)}° E (${selectedHub})`
                  : "Detecting Coordinates..."}
              </p>
            </div>
          </div>

          <button
            onClick={requestGeolocation}
            className="btn-cyan px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 shadow-md shadow-cyan-600/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh My GPS</span>
          </button>
        </div>

        {gpsError && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Manual District Selection */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Or choose district hub:</span>
          {Object.keys(manualHubs).map((hub) => (
            <button
              key={hub}
              onClick={() => handleManualHubChange(hub)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${selectedHub === hub
                  ? "bg-teal-500 text-slate-950 font-bold"
                  : "bg-slate-950 text-slate-300 border border-slate-800 hover:border-teal-500/50"
                }`}
            >
              {hub}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nearby places..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${selectedCategory === cat
                  ? "bg-cyan-600 text-white font-bold"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Destinations Grid sorted by distance */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredDestinations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDestinations.map((dest) => (
            <DestinationCard
              key={dest.id}
              destination={dest}
              onSelect={(d) => setActiveModalDest(d)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No nearby places found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try choosing a different district anchor above or resetting your filters.
          </p>
        </div>
      )}

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

