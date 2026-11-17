"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  IndianRupee,
  Clock
} from "lucide-react";
import { Destination, Region, api } from "@/services/api";

export default function AdminDestinationsPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    district_id: 1,
    category: "Heritage",
    latitude: 18.5204,
    longitude: 73.8567,
    entry_fee: 0,
    opening_hours: "09:00 AM - 06:00 PM",
    visit_duration: "2 hours",
    history: "",
    architecture: "",
    image_path: "",
    image_source: "Wikimedia Commons",
    image_attribution: "Public Domain / CC BY-SA 4.0",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push("/login");
        return;
      }
      loadData();
    }
  }, [authLoading, isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dests, regs] = await Promise.all([
        api.getDestinations({ limit: 150 }),
        api.getRegions(),
      ]);
      setDestinations(dests);
      setRegions(regs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDest(null);
    setUploadFile(null);
    setFormError(null);
    setFormSuccess(null);
    // Find first valid district id
    const firstDistrictId = regions.length > 0 && regions[0].districts.length > 0 ? regions[0].districts[0].id : 1;
    setFormData({
      name: "",
      description: "",
      district_id: firstDistrictId,
      category: "Heritage",
      latitude: 18.5204,
      longitude: 73.8567,
      entry_fee: 0,
      opening_hours: "09:00 AM - 06:00 PM",
      visit_duration: "2 hours",
      history: "",
      architecture: "",
      image_path: "",
      image_source: "Wikimedia Commons",
      image_attribution: "Public Domain / CC BY-SA 4.0",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dest: Destination) => {
    setEditingDest(dest);
    setUploadFile(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      name: dest.name,
      description: dest.description,
      district_id: dest.district_id,
      category: dest.category,
      latitude: dest.latitude,
      longitude: dest.longitude,
      entry_fee: dest.entry_fee,
      opening_hours: dest.opening_hours,
      visit_duration: dest.visit_duration,
      history: dest.history || "",
      architecture: dest.architecture || "",
      image_path: dest.image_path || "",
      image_source: dest.image_source || "Wikimedia Commons",
      image_attribution: dest.image_attribution || "Public Domain",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (dest: Destination) => {
    if (confirm(`Are you sure you want to permanently delete '${dest.name}'?`)) {
      try {
        await api.deleteDestination(dest.id);
        setDestinations((prev) => prev.filter((d) => d.id !== dest.id));
      } catch (err: any) {
        alert(err.message || "Failed to delete destination.");
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      let savedDest: Destination;
      if (editingDest) {
        savedDest = await api.updateDestination(editingDest.id, formData);
      } else {
        savedDest = await api.createDestination(formData);
      }

      // If a new photo was chosen, upload it
      if (uploadFile) {
        await api.uploadDestinationPhoto(
          savedDest.id,
          uploadFile,
          formData.image_attribution,
          formData.image_source
        );
      }

      setFormSuccess(`Destination '${formData.name}' successfully saved.`);
      loadData();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save destination.");
    }
  };

  // Filtered list
  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.district_name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  // All districts flat list
  const allDistricts = regions.flatMap((r) => r.districts);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <MapPin className="w-7 h-7 text-cyan-400" />
            <span>Manage Maharashtra Destinations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, edit descriptions, upload photographs, and update coordinates.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Destination</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, district, or category..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Destinations Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Photo</th>
                <th className="py-3.5 px-4">Monument Name</th>
                <th className="py-3.5 px-4">District / Region</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Entry Fee</th>
                <th className="py-3.5 px-4">Coordinates</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredDestinations.map((dest) => (
                <tr key={dest.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <img
                      src={dest.image_path || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=200&q=80"}
                      alt={dest.name}
                      className="w-12 h-10 object-cover rounded-lg bg-slate-950 border border-slate-800"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-white max-w-[200px] truncate">
                    {dest.name}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {dest.district_name} ({dest.region_name})
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                      {dest.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">
                    {dest.entry_fee === 0 ? "Free" : `₹${dest.entry_fee}`}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {dest.latitude.toFixed(2)}°, {dest.longitude.toFixed(2)}°
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(dest)}
                      className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700"
                      title="Edit Destination"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dest)}
                      className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/60"
                      title="Delete Destination"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT DESTINATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0b1329] border border-cyan-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white">
                {editingDest ? `Edit '${editingDest.name}'` : "Add New Maharashtra Destination"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Destination Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Heritage">Heritage</option>
                    <option value="Forts">Forts</option>
                    <option value="Temples">Temples</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Nature">Nature</option>
                    <option value="Beaches">Beaches</option>
                    <option value="Museums">Museums</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">District</label>
                <select
                  value={formData.district_id}
                  onChange={(e) => setFormData({ ...formData, district_id: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {allDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.district_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Entry Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.visit_duration}
                    onChange={(e) => setFormData({ ...formData, visit_duration: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Historical Significance</label>
                <textarea
                  rows={2}
                  value={formData.history}
                  onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Architecture Details</label>
                <textarea
                  rows={2}
                  value={formData.architecture}
                  onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Photo Upload & Attribution */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
                  Destination Photograph & Attribution
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Upload Local Image File</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-950 file:text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Or Image URL</label>
                    <input
                      type="text"
                      value={formData.image_path}
                      onChange={(e) => setFormData({ ...formData, image_path: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Photo Source</label>
                    <input
                      type="text"
                      value={formData.image_source}
                      onChange={(e) => setFormData({ ...formData, image_source: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Photo Attribution / License</label>
                    <input
                      type="text"
                      value={formData.image_attribution}
                      onChange={(e) => setFormData({ ...formData, image_attribution: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gradient px-6 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

