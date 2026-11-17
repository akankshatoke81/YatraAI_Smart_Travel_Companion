"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  MapPin,
  Camera,
  Sparkles,
  WifiOff,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  Shield,
  Layers,
  Users,
  Image as ImageIcon,
  Navigation,
  Bookmark
} from "lucide-react";

export default function Navbar() {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0b1329]/90 backdrop-blur-md border-b border-cyan-900/40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-white" />
              <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300"></span>
              </span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                YatraAI
              </span>
              <span className="block text-[10px] text-cyan-400/80 uppercase tracking-widest font-medium">
                Maharashtra Companion
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {isAdmin ? (
              // ADMIN MENU
              <>
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/" ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    pathname === "/admin" ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/destinations"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive("/admin/destinations") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Destinations</span>
                </Link>
                <Link
                  href="/admin/regions"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive("/admin/regions") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Regions</span>
                </Link>
                <Link
                  href="/admin/users"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive("/admin/users") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Users</span>
                </Link>
                <Link
                  href="/admin/images"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive("/admin/images") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Images</span>
                </Link>
              </>
            ) : isAuthenticated ? (
              // LOGGED IN USER MENU
              <>
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/" ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/nearby"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/nearby") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Nearby</span>
                </Link>
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/dashboard") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/recommender"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/recommender") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Recommender</span>
                </Link>
                <Link
                  href="/scanner"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/scanner") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Scan Image</span>
                </Link>
                <Link
                  href="/map"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/map") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <span>2D Map</span>
                </Link>
                <Link
                  href="/ar-navigation"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/ar-navigation") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>AR Navigation</span>
                </Link>
                <Link
                  href="/offline"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/offline") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <WifiOff className="w-4 h-4 text-emerald-400" />
                  <span>Offline</span>
                </Link>
              </>
            ) : (
              // PUBLIC GUEST MENU
              <>
                <Link
                  href="/"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/" ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/places"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/places") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Explore Places</span>
                </Link>
                <Link
                  href="/nearby"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/nearby") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <span>Nearby</span>
                </Link>
                <Link
                  href="/recommender"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/recommender") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Trip Planner</span>
                </Link>
                <Link
                  href="/scanner"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/scanner") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4 text-teal-400" />
                  <span>AI Scanner</span>
                </Link>
                <Link
                  href="/offline"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/offline") ? "text-cyan-400 bg-cyan-950/40" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <WifiOff className="w-4 h-4 text-emerald-400" />
                  <span>Offline</span>
                </Link>
              </>
            )}
          </div>

          {/* Right Header Controls: Auth / Profile */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  href={isAdmin ? "/admin" : "/profile"}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.name?.slice(0, 2) || "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-slate-200 truncate max-w-[100px]">{user?.name}</p>
                    <span className="text-[10px] text-cyan-400 font-semibold uppercase">{user?.role}</span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium btn-gradient flex items-center space-x-1.5 shadow-md shadow-indigo-500/20"
                >
                  <User className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-b border-cyan-900/50 px-4 pt-2 pb-6 space-y-2">
          {isAdmin ? (
            <>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Home
              </Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-cyan-400">
                Admin Dashboard
              </Link>
              <Link href="/admin/destinations" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Manage Destinations
              </Link>
              <Link href="/admin/regions" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Manage Regions
              </Link>
              <Link href="/admin/users" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Manage Users
              </Link>
              <Link href="/admin/images" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Image Management
              </Link>
            </>
          ) : isAuthenticated ? (
            <>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Home
              </Link>
              <Link href="/nearby" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Nearby Places
              </Link>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                User Dashboard
              </Link>
              <Link href="/recommender" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                AI Recommender
              </Link>
              <Link href="/scanner" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Scan Image
              </Link>
              <Link href="/map" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                2D Map
              </Link>
              <Link href="/ar-navigation" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                AR Navigation
              </Link>
              <Link href="/offline" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Offline Mode
              </Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Home
              </Link>
              <Link href="/places" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Explore Places
              </Link>
              <Link href="/nearby" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Nearby
              </Link>
              <Link href="/recommender" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                AI Trip Planner
              </Link>
              <Link href="/scanner" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Scan Image
              </Link>
              <Link href="/offline" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-200">
                Offline Mode
              </Link>
              <div className="pt-4 flex flex-col space-y-2 border-t border-slate-800">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-slate-900 text-slate-200"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg btn-gradient"
                >
                  Register
                </Link>
              </div>
            </>
          )}

          {isAuthenticated && (
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 flex items-center justify-center space-x-2 rounded-lg bg-red-950/40 text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

