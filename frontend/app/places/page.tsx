"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, MapPin, Compass, RefreshCw, X } from "lucide-react";
import { Destination, api } from "@/services/api";
import DestinationCard from "@/components/DestinationCard";
import DestinationModal from "@/components/DestinationModal";

function PlacesContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialRegion = searchParams.get("region") || "All";
  const initialCategory = searchParams.get("category") || "All";

  const [search, setSearch] = useState(initialSearch);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModalDest, setActiveModalDest] = useState<Destination | null>(null);

  const regions = [
    "All",
    "Pune Region",
    "Mumbai Region",
    "Satara Region",
    "Kolhapur Region",
    "Sangli Region",
    "Konkan Region",
    "Nashik Region",
    "Other Maharashtra Regions"
  ];

  useEffect(() => {
    loadDestinations();
  }, [selectedRegion, selectedCategory]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const [dests, cats] = await Promise.all([
        api.getDestinations({
          search: search || undefined,
          region: selectedRegion !== "All" ? selectedRegion : undefined,
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          limit: 100,
        }),
        api.getCategories(),
      ]);
      setDestinations(dests);
      setCategories(["All", ...cats]);
    } catch (err) {
      console.error("Failed to load places:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDestinations();
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedRegion("All");
    setSelectedCategory("All");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Explore Maharashtra Heritage & Sights
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Search across ancient Sahyadri fortresses, sacred shrines, coastal beaches, and UNESCO monuments.
        </p>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-5 h-5 text-cyan-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by monument name, district, or description..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-12 pr-28 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder-slate-500"
          />
          <button
            type="submit"
            className="btn-cyan absolute right-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30"
          >
            Search
          </button>
        </form>

        {/* Region & Category Selector Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Region Dropdown / Pills */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Filter by Region
            </label>
            <div className="flex flex-wrap gap-1.5">
              {regions.map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedRegion === reg
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {(selectedRegion !== "All" || selectedCategory !== "All" || search) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center space-x-2 text-slate-400">
              <span>Active filters:</span>
              {selectedRegion !== "All" && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedRegion}
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {selectedCategory}
                </span>
              )}
              {search && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200">
                  &quot;{search}&quot;
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Found {destinations.length} verified destination(s)</span>
      </div>

      {/* Destinations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
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
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <Compass className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            {selectedRegion !== "All"
              ? `No destinations found in this region (${selectedRegion}).`
              : "No destinations found."}
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            {search
              ? `No destinations match "${search}" within ${selectedRegion !== "All" ? selectedRegion : "the selected criteria"}.`
              : "Try switching to another region or selecting \"All\" to see all Maharashtra monuments."}
          </p>
          <div>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-cyan-400 hover:bg-slate-700"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* Destination Modal */}
      {activeModalDest && (
        <DestinationModal
          destination={activeModalDest}
          onClose={() => setActiveModalDest(null)}
        />
      )}
    </div>
  );
}

export default function PlacesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading catalog...</div>}>
      <PlacesContent />
    </Suspense>
  );
}

