"use client";

import React, { useState, useEffect } from "react";
import {
  WifiOff,
  DownloadCloud,
  CheckCircle2,
  Trash2,
  MapPin,
  Clock,
  IndianRupee,
  Compass,
  Database,
  Eye,
  Info
} from "lucide-react";
import { api } from "@/services/api";
import {
  saveDestinationsOffline,
  getOfflineDestinations,
  clearOfflineStorage,
  OfflineDestination
} from "@/utils/offlineStorage";
import DestinationModal from "@/components/DestinationModal";

export default function OfflinePage() {
  const [offlineDestinations, setOfflineDestinations] = useState<OfflineDestination[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("All Maharashtra");
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeModalDest, setActiveModalDest] = useState<any | null>(null);

  const regions = [
    "All Maharashtra",
    "Pune Region",
    "Mumbai Region",
    "Satara Region",
    "Kolhapur Region",
    "Konkan Region",
    "Nashik Region",
  ];

  useEffect(() => {
    loadCachedOfflineData();
  }, []);

  const loadCachedOfflineData = async () => {
    try {
      const cached = await getOfflineDestinations();
      setOfflineDestinations(cached);
    } catch (err) {
      console.warn("Could not load IndexedDB:", err);
    }
  };

  const handleDownloadOfflinePackage = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const regionParam = selectedRegion === "All Maharashtra" ? undefined : selectedRegion;
      const bundle = await api.getOfflineBundle(regionParam);

      await saveDestinationsOffline(bundle.destinations);
      const updated = await getOfflineDestinations();
      setOfflineDestinations(updated);
      setStatusMessage(`Successfully cached ${bundle.total_destinations} destinations and ${bundle.road_network_nodes.length} road nodes locally in IndexedDB.`);
    } catch (err: any) {
      setStatusMessage("Failed to download offline pack: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm("Are you sure you want to clear all locally cached offline travel data?")) {
      await clearOfflineStorage();
      setOfflineDestinations([]);
      setStatusMessage("Offline storage cleared.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300 mb-2">
          <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
          <span>Browser IndexedDB Local Storage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Offline Mode & Field Travel Storage
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Prepare for remote areas in the Western Ghats or coastal Maharashtra with spotty connectivity. Download offline packages to view monument archives and coordinates without internet.
        </p>
      </div>

      {/* Sync Control Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-900/40 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <DownloadCloud className="w-5 h-5 text-emerald-400" />
              <span>Download Regional Offline Travel Package</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your destination region to store detailed monument guides, geo coordinates, and road graph vertices.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <button
              onClick={handleDownloadOfflinePackage}
              disabled={syncing}
              className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0 shadow-lg shadow-indigo-600/30 disabled:opacity-60"
            >
              {syncing ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Syncing Pack...</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" />
                  <span>Download Package</span>
                </>
              )}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Storage Telemetry Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block">Cached Monuments</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{offlineDestinations.length} Places</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block">Storage Engine</span>
            <p className="text-xl font-bold text-cyan-400 mt-0.5">IndexedDB</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Clear Cache</span>
              <span className="text-xs text-slate-500">Free local storage</span>
            </div>
            <button
              onClick={handleClearCache}
              disabled={offlineDestinations.length === 0}
              className="p-2 rounded-xl bg-red-950/50 text-red-400 hover:bg-red-900/60 border border-red-800/60 disabled:opacity-40"
              title="Clear Cached Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* OFFLINE DESTINATION VIEWER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-400" />
            <span>Available Offline in Browser ({offlineDestinations.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Available even when disconnected</span>
        </div>

        {offlineDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offlineDestinations.map((dest) => (
              <div
                key={dest.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                      {dest.category}
                    </span>
                    <span className="text-slate-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      <span>{dest.district_name}</span>
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white">{dest.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {dest.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center space-x-1">
                      <IndianRupee className="w-3 h-3 text-emerald-400" />
                      <span>{dest.entry_fee === 0 ? "Free" : `₹${dest.entry_fee}`}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>{dest.visit_duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{dest.latitude.toFixed(4)}°N, {dest.longitude.toFixed(4)}°E</span>
                    <button
                      onClick={() => setActiveModalDest(dest)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-700 font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <WifiOff className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No offline packages stored yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Download Package&quot; above to save Maharashtra destinations to your browser&apos;s IndexedDB for offline access.
            </p>
          </div>
        )}
      </div>

      {/* Compliance & Tile Usage Policy Note (Exact Specification from Section 12) */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold">
          <Info className="w-4 h-4 shrink-0" />
          <span>Tile Server Compliance Policy</span>
        </div>
        <p className="leading-relaxed">
          In strict compliance with OpenStreetMap tile server fair-use terms, bulk image tile downloads are prevented. Offline mode provides local IndexedDB storage of verified monument coordinates, descriptions, entry fees, and pre-computed road network vertices.
        </p>
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

