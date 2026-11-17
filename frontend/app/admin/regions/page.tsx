"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  X
} from "lucide-react";
import { Region, api } from "@/services/api";

export default function AdminRegionsPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  // Region modal
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [regionName, setRegionName] = useState("");
  const [regionDesc, setRegionDesc] = useState("");
  const [editingRegionId, setEditingRegionId] = useState<number | null>(null);

  // District modal
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [districtName, setDistrictName] = useState("");

  const [feedback, setFeedback] = useState<{ error?: string; success?: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push("/login");
        return;
      }
      loadRegions();
    }
  }, [authLoading, isAdmin]);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const data = await api.getRegions();
      setRegions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddRegion = () => {
    setEditingRegionId(null);
    setRegionName("");
    setRegionDesc("");
    setFeedback(null);
    setIsRegionModalOpen(true);
  };

  const handleSaveRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await api.createRegion({ region_name: regionName.trim(), description: regionDesc.trim() });
      setFeedback({ success: `Region '${regionName}' created successfully.` });
      loadRegions();
      setTimeout(() => setIsRegionModalOpen(false), 800);
    } catch (err: any) {
      setFeedback({ error: err.message || "Failed to create region." });
    }
  };

  const handleDeleteRegion = async (region: Region) => {
    if (confirm(`Are you sure you want to delete '${region.region_name}'?`)) {
      try {
        await api.deleteRegion(region.id);
        setRegions((prev) => prev.filter((r) => r.id !== region.id));
      } catch (err: any) {
        alert(err.message || "Cannot delete region.");
      }
    }
  };

  const handleOpenAddDistrict = (regionId: number) => {
    setSelectedRegionId(regionId);
    setDistrictName("");
    setFeedback(null);
    setIsDistrictModalOpen(true);
  };

  const handleSaveDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegionId) return;
    setFeedback(null);
    try {
      await api.createDistrict({
        district_name: districtName.trim(),
        region_id: selectedRegionId,
      });
      setFeedback({ success: `District '${districtName}' created successfully.` });
      loadRegions();
      setTimeout(() => setIsDistrictModalOpen(false), 800);
    } catch (err: any) {
      setFeedback({ error: err.message || "Failed to create district." });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-7 h-7 text-teal-400" />
            <span>Manage Maharashtra Regions & Districts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure administrative zones, assign districts, and manage territorial boundaries.
          </p>
        </div>

        <button
          onClick={handleOpenAddRegion}
          className="btn-cyan px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Region</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
            feedback.error
              ? "bg-red-950/60 border border-red-800 text-red-300"
              : "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
          }`}
        >
          {feedback.error ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.error || feedback.success}</span>
        </div>
      )}

      {/* Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {regions.map((reg) => (
          <div
            key={reg.id}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    Region ID: {reg.id}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{reg.region_name}</h3>
                </div>
                <button
                  onClick={() => handleDeleteRegion(reg)}
                  className="p-1.5 rounded-lg bg-red-950/50 text-red-400 hover:bg-red-900/60"
                  title="Delete Region"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {reg.description || "No specific regional description specified."}
              </p>
            </div>

            {/* Districts in Region */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Associated Districts ({reg.districts.length}):
                </span>
                <button
                  onClick={() => handleOpenAddDistrict(reg.id)}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add District</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {reg.districts.map((d) => (
                  <span
                    key={d.id}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-1"
                  >
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{d.district_name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD REGION MODAL */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b1329] border border-cyan-800/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-white">Create Maharashtra Region</h3>
              <button onClick={() => setIsRegionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRegion} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Region Name</label>
                <input
                  type="text"
                  required
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  placeholder="e.g. Vidarbha Region"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={regionDesc}
                  onChange={(e) => setRegionDesc(e.target.value)}
                  placeholder="Historical and geographical background..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan px-5 py-2 rounded-xl text-xs font-bold">
                  Create Region
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DISTRICT MODAL */}
      {isDistrictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0b1329] border border-cyan-800/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-white">Add District</h3>
              <button onClick={() => setIsDistrictModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDistrict} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">District Name</label>
                <input
                  type="text"
                  required
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  placeholder="e.g. Raigad, Sindhudurg, Thane"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDistrictModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-cyan px-5 py-2 rounded-xl text-xs font-bold">
                  Add District
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

