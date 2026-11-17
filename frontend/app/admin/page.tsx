"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Users,
  MapPin,
  Layers,
  Image as ImageIcon,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { AdminDashboardData, api } from "@/services/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push("/login");
        return;
      }
      loadMetrics();
    }
  }, [authLoading, isAdmin]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminDashboard();
      setMetrics(data);
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
        <p className="text-sm text-slate-400">Loading administrator console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            System Overview & Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as {user?.name} ({user?.email}) • Role verified by backend authentication
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/destinations"
            className="btn-cyan px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Destination</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{metrics?.total_users || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered Travelers</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Destinations</span>
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{metrics?.total_destinations || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Maharashtra Monuments</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Regions</span>
            <Layers className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-3xl font-black text-white">{metrics?.total_regions || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Administrative Divisions</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Photos Active</span>
            <ImageIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{metrics?.images_available || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Verified Attributions</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider">Missing Images</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{metrics?.images_missing || 0}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Action Needed</span>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/admin/destinations"
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all group"
        >
          <MapPin className="w-6 h-6 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300">Manage Destinations</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Create, edit, or remove destination entries, entry fees, coordinates, and descriptions.
          </p>
        </Link>

        <Link
          href="/admin/regions"
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-900 transition-all group"
        >
          <Layers className="w-6 h-6 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white group-hover:text-teal-300">Manage Regions</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Configure Maharashtra regional categories, link districts, and update boundaries.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all group"
        >
          <Users className="w-6 h-6 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300">Manage Users</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Inspect registered travelers, activate or deactivate accounts with confirmation.
          </p>
        </Link>

        <Link
          href="/admin/images"
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all group"
        >
          <ImageIcon className="w-6 h-6 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white group-hover:text-purple-300">Image Management</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Upload high-resolution photographs, replace photos, and verify license attributions.
          </p>
        </Link>
      </div>

      {/* Recently Added Destinations Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Recently Added Destinations</span>
          </h3>
          <Link href="/admin/destinations" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Monument Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {metrics?.recent_destinations && metrics.recent_destinations.length > 0 ? (
                metrics.recent_destinations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{d.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                        {d.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{d.district}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/admin/destinations"
                        className="text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No recent destinations recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

