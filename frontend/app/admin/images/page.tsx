"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Image as ImageIcon,
  Upload,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  X,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { Destination, api } from "@/services/api";

export default function AdminImagesPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [targetDest, setTargetDest] = useState<Destination | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [attribution, setAttribution] = useState("");
  const [source, setSource] = useState("Wikimedia Commons");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push("/login");
        return;
      }
      loadDestinations();
    }
  }, [authLoading, isAdmin]);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const data = await api.getDestinations({ limit: 150 });
      setDestinations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpload = (dest: Destination) => {
    setTargetDest(dest);
    setUploadFile(null);
    setImageUrl(dest.image_path || "");
    setAttribution(dest.image_attribution || "Public Domain");
    setSource(dest.image_source || "Wikimedia Commons");
    setSuccessMsg(null);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDest) return;
    setUploading(true);

    try {
      if (uploadFile) {
        await api.uploadDestinationPhoto(targetDest.id, uploadFile, attribution, source);
      } else if (imageUrl) {
        await api.updateDestination(targetDest.id, {
          image_path: imageUrl.trim(),
          image_attribution: attribution.trim(),
          image_source: source.trim(),
        });
      }
      setSuccessMsg(`Photo updated successfully for '${targetDest.name}'.`);
      loadDestinations();
      setTimeout(() => setTargetDest(null), 900);
    } catch (err: any) {
      alert(err.message || "Failed to update photograph.");
    } finally {
      setUploading(false);
    }
  };

  const withImages = destinations.filter((d) => d.image_path && d.image_path.trim() !== "");
  const withoutImages = destinations.filter((d) => !d.image_path || d.image_path.trim() === "");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-2">
          <ImageIcon className="w-7 h-7 text-purple-400" />
          <span>Destination Photograph & Image Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Audit photo coverage, verify copyright attributions, and replace outdated or inaccurate photographs.
        </p>
      </div>

      {/* Coverage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Catalog</span>
          <p className="text-3xl font-black text-white mt-1">{destinations.length}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active Monuments</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Images Available</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">{withImages.length}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">{((withImages.length / (destinations.length || 1)) * 100).toFixed(0)}% Coverage</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Missing Images</span>
          <p className="text-3xl font-black text-amber-400 mt-1">{withoutImages.length}</p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Requires Upload</span>
        </div>
      </div>

      {/* Grid of Destination Photos */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">All Destination Photographs</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                {dest.image_path ? (
                  <img
                    src={dest.image_path}
                    alt={dest.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-950">
                    <AlertTriangle className="w-6 h-6 text-amber-400 mb-1" />
                    <span className="text-[11px] text-slate-400 font-semibold">Missing Photo</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950/80 text-cyan-300 border border-slate-700">
                    {dest.category}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white truncate">{dest.name}</h4>
                <div className="flex items-center space-x-1 text-slate-400 text-xs mt-0.5">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{dest.district_name}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-1">
                  License: {dest.image_attribution || "Not attributed"}
                </p>
              </div>

              <button
                onClick={() => handleOpenUpload(dest)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace / Upload Photo</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* UPLOAD / EDIT PHOTO MODAL */}
      {targetDest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0b1329] border border-cyan-800/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-white">Update Photo for &apos;{targetDest.name}&apos;</h3>
              <button onClick={() => setTargetDest(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Upload Image File (JPG, PNG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-950 file:text-cyan-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Or Image Web URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Photo Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Archeological Survey of India, MTDC, Wikimedia Commons"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  License Attribution
                </label>
                <input
                  type="text"
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                  placeholder="e.g. Photo by XYZ under CC BY-SA 4.0 / Public Domain"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTargetDest(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-gradient px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {uploading ? "Saving..." : "Save Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

