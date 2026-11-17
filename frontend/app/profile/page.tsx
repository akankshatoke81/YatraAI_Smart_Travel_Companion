"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Calendar, Shield, LogOut, ArrowRight, Heart } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, favouriteIds } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated]);

  if (loading || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading user profile...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Traveler Profile</h1>
        <p className="text-xs text-slate-400 mt-1">Manage your account information and saved preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-800 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white uppercase shadow-lg shadow-cyan-500/20">
            {user.name.slice(0, 2)}
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-widest">
              {user.role} Account
            </span>
            <h2 className="text-2xl font-bold text-white mt-1.5">{user.name}</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-500 block">Full Name</span>
            <div className="flex items-center space-x-2 mt-1 text-slate-200 font-semibold text-sm">
              <User className="w-4 h-4 text-cyan-400" />
              <span>{user.name}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-500 block">Email Address</span>
            <div className="flex items-center space-x-2 mt-1 text-slate-200 font-semibold text-sm">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>{user.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-500 block">Traveler Age</span>
            <div className="flex items-center space-x-2 mt-1 text-slate-200 font-semibold text-sm">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{user.age ? `${user.age} Years` : "Not specified"}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-500 block">Saved Favourites</span>
            <div className="flex items-center space-x-2 mt-1 text-red-400 font-semibold text-sm">
              <Heart className="w-4 h-4 fill-current" />
              <span>{favouriteIds.length} Monuments</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Return to User Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="px-5 py-2.5 rounded-xl bg-red-950/60 text-red-400 hover:bg-red-900/60 border border-red-800/80 text-xs font-bold flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

