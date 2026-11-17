"use client";

import React from "react";
import Image from "next/image";
import { Destination } from "@/services/api";
import { MapPin, Clock, IndianRupee, Heart, Eye, Navigation } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface DestinationCardProps {
  destination: Destination;
  onSelect?: (dest: Destination) => void;
}

export default function DestinationCard({ destination, onSelect }: DestinationCardProps) {
  const { favouriteIds, toggleFavourite, isAuthenticated } = useAuth();
  const isFav = favouriteIds.includes(destination.id);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      alert("Please log in to save destinations to your favourites.");
      return;
    }
    await toggleFavourite(destination.id);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(destination)}
      className="group relative rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={destination.image_path || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3">
          <button
            onClick={handleHeartClick}
            className={`p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
              isFav
                ? "bg-red-500/90 text-white shadow-md shadow-red-500/30"
                : "bg-slate-900/70 text-slate-300 hover:text-red-400 hover:bg-slate-900/90"
            }`}
            title={isFav ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 backdrop-blur-md">
            {destination.category}
          </span>
        </div>

        {/* Distance Badge if available */}
        {destination.distance_km !== null && destination.distance_km !== undefined && (
          <div className="absolute bottom-3 left-3 flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-900/80 text-teal-300 border border-teal-800/50 backdrop-blur-sm">
            <Navigation className="w-3 h-3 text-teal-400" />
            <span>{destination.distance_km} km away</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center text-xs text-slate-400 mb-1 space-x-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{destination.district_name}, {destination.region_name}</span>
          </div>

          <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
            {destination.name}
          </h3>

          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {destination.description}
          </p>
        </div>

        {/* Specs & Action */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-slate-300">
            <div className="flex items-center space-x-0.5" title="Entry Fee">
              <IndianRupee className="w-3 h-3 text-emerald-400" />
              <span>{destination.entry_fee === 0 ? "Free" : `₹${destination.entry_fee}`}</span>
            </div>
            <div className="flex items-center space-x-1" title="Visiting Duration">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>{destination.visit_duration || "2 hrs"}</span>
            </div>
          </div>

          <button
            onClick={() => onSelect && onSelect(destination)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-800/60 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}

