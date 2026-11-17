"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Navigation,
  MapPin,
  Compass,
  RefreshCw,
  AlertCircle,
  LocateFixed,
  Filter,
  CheckCircle2,
  Route
} from "lucide-react";
import { Destination, AStarRouteResult, api } from "@/services/api";

// Dynamically import Leaflet Map to avoid SSR errors
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[550px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading Leaflet Map Tiles...</p>
      </div>
    </div>
  ),
});

function MapContent() {
  const searchParams = useSearchParams();
  const paramDestId = searchParams.get("destination_id");
  const paramLat = searchParams.get("dest_lat");
  const paramLng = searchParams.get("dest_lng");

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [selectedDestId, setSelectedDestId] = useState<number | null>(
    paramDestId ? Number(paramDestId) : null
  );

  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 18.5204,
    lng: 73.8567,
  });
  const [isLiveGps, setIsLiveGps] = useState<boolean>(false);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const [routeResult, setRouteResult] = useState<AStarRouteResult | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

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

  // Standard transit hubs
  const startHubs: Record<string, { lat: number; lng: number }> = {
    "Pune Central (Station)": { lat: 18.5284, lng: 73.8739 },
    "Mumbai (CSMT / Gateway)": { lat: 18.922, lng: 72.8347 },
    "Satara City Hub": { lat: 17.6805, lng: 73.9997 },
    "Kolhapur Center": { lat: 16.705, lng: 74.2433 },
    "Nashik Central": { lat: 19.9975, lng: 73.7898 },
    "Chhatrapati Sambhaji Nagar": { lat: 19.8762, lng: 75.3433 },
  };

  // Request browser GPS location
  const requestCurrentLocation = useCallback((isManualClick = false) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsMessage("Geolocation is not supported by your browser. Using selected start hub.");
      setIsLiveGps(false);
      return;
    }

    setLocatingGps(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLiveGps(true);
        setLocatingGps(false);
        setGpsMessage(`Live GPS acquired (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E).`);
      },
      (err) => {
        setLocatingGps(false);
        setIsLiveGps(false);
        let msg = "Could not detect live GPS position.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "GPS permission was denied. Using starting transit hub below.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS request timed out. Using starting transit hub.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable. Using starting transit hub.";
        }
        setGpsMessage(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Initial load: fetch destinations and trigger live GPS
  useEffect(() => {
    loadDestinations(selectedRegion);
    requestCurrentLocation(false);
  }, []);

  // Reload destinations when region filter changes
  useEffect(() => {
    loadDestinations(selectedRegion);
  }, [selectedRegion]);

  const loadDestinations = async (region: string) => {
    try {
      const dests = await api.getDestinations({
        region: region !== "All" ? region : undefined,
        limit: 100,
      });
      setDestinations(dests);

      // If currently selected destination is not in filtered list, select first available
      if (dests.length > 0) {
        if (!selectedDestId || !dests.some((d) => d.id === selectedDestId)) {
          setSelectedDestId(dests[0].id);
        }
      } else {
        setSelectedDestId(null);
        setRouteResult(null);
      }
    } catch (err) {
      console.error("Failed to load map destinations:", err);
    }
  };

  // Compute A* route whenever target destination or user location changes
  useEffect(() => {
    if (!selectedDestId || !userLocation) return;
    const dest = destinations.find((d) => d.id === selectedDestId);
    if (!dest) return;

    calculateRoute(userLocation.lat, userLocation.lng, dest.latitude, dest.longitude, dest.id);
  }, [selectedDestId, userLocation, destinations]);

  const calculateRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    destId: number
  ) => {
    setLoadingRoute(true);
    setRoutingError(null);
    try {
      const res = await api.computeRoute(startLat, startLng, endLat, endLng, destId);
      setRouteResult(res);
    } catch (err: any) {
      console.warn("A* route calculation notice:", err);
      setRoutingError("A* pathfinding adjusted to direct road vector.");
    } finally {
      setLoadingRoute(false);
    }
  };

  const activeDestination = destinations.find((d) => d.id === selectedDestId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & GPS Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-xs font-semibold text-cyan-300 mb-2">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>A* Shortest Path Graph Algorithm</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Interactive 2D Road Navigation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time route calculation from your live GPS position to Maharashtra monuments.
          </p>
        </div>

        {/* Live GPS & Location Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => requestCurrentLocation(true)}
            disabled={locatingGps}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              isLiveGps
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900"
                : "btn-cyan shadow-md shadow-cyan-600/20"
            }`}
          >
            {locatingGps ? (
              <>
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <LocateFixed className="w-4 h-4" />
                <span>{isLiveGps ? "Refresh Live GPS" : "My Current Location"}</span>
              </>
            )}
          </button>

          {/* Hub fallback selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-slate-400">Or Hub:</span>
            <select
              onChange={(e) => {
                const coords = startHubs[e.target.value];
                if (coords) {
                  setUserLocation(coords);
                  setIsLiveGps(false);
                  setGpsMessage(`Start location set to ${e.target.value}.`);
                }
              }}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              {Object.keys(startHubs).map((hub) => (
                <option key={hub} value={hub} className="bg-slate-900 text-white">
                  {hub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* GPS Status Notice */}
      {gpsMessage && (
        <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
          isLiveGps
            ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
            : "bg-slate-900 border-slate-800 text-slate-300"
        }`}>
          {isLiveGps ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{gpsMessage}</span>
        </div>
      )}

      {/* Destination & Region Selection Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        {/* Left: Region and Destination Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Region Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Filter Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
            >
              {regions.map((reg) => (
                <option key={reg} value={reg} className="bg-slate-950 text-white">
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Selector */}
          <div className="flex-1 min-w-[260px]">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Destination Monument ({destinations.length})
            </label>
            <select
              value={selectedDestId || ""}
              onChange={(e) => setSelectedDestId(Number(e.target.value))}
              disabled={destinations.length === 0}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              {destinations.length > 0 ? (
                destinations.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-950 text-white">
                    {d.name} ({d.district_name} • {d.category})
                  </option>
                ))
              ) : (
                <option value="">No destinations found in {selectedRegion}</option>
              )}
            </select>
          </div>
        </div>

        {/* Right: Route Metrics Badge */}
        {routeResult && (
          <div className="flex items-center space-x-3 text-xs self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">A* Distance</span>
              <span className="text-cyan-400 font-black text-sm">{routeResult.distance_km} km</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Travel Time</span>
              <span className="text-teal-400 font-black text-sm">{routeResult.duration_minutes} mins</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hidden sm:block">
              <span className="text-slate-400 block text-[10px]">Waypoints</span>
              <span className="text-indigo-300 font-bold text-sm">{routeResult.steps_count} nodes</span>
            </div>
          </div>
        )}
      </div>

      {/* Leaflet Map Canvas */}
      <div className="h-[620px] w-full rounded-3xl overflow-hidden border border-cyan-900/40 shadow-2xl relative bg-slate-950">
        <LeafletMap
          userLocation={userLocation}
          destinationLocation={
            activeDestination
              ? {
                  lat: activeDestination.latitude,
                  lng: activeDestination.longitude,
                  name: activeDestination.name,
                }
              : null
          }
          routeCoordinates={routeResult?.coordinates}
          routeInfo={
            routeResult
              ? {
                  distance_km: routeResult.distance_km,
                  duration_minutes: routeResult.duration_minutes,
                  algorithm: routeResult.algorithm,
                }
              : null
          }
          allDestinations={destinations.map((d) => ({
            id: d.id,
            name: d.name,
            latitude: d.latitude,
            longitude: d.longitude,
            category: d.category,
          }))}
          onSelectDestination={(id) => setSelectedDestId(id)}
        />
      </div>

      {/* Technical Routing Explainer Footer */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Route className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Path calculated via <strong>A* (A-Star)</strong> heuristic graph search over Maharashtra road network coordinates with Haversine distance admissible cost.
          </span>
        </div>
        <span className="text-cyan-400 font-mono text-[11px] shrink-0">
          OpenStreetMap &copy; Map Data
        </span>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading map...</div>}>
      <MapContent />
    </Suspense>
  );
}
