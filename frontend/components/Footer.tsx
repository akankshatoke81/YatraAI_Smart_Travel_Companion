import React from "react";
import Link from "next/link";
import { Compass, Heart, ShieldCheck, MapPin, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-cyan-900/30 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">YatraAI</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Smart AI/ML Travel Companion for Maharashtra. Featuring YOLO computer vision monument scanning, A* route optimization, Groq-powered itineraries, and AR guidance.
            </p>
          </div>

          {/* Maharashtra Regions */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Explore Regions
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/places?region=Pune%20Region" className="hover:text-cyan-400 transition-colors">Pune & Sahyadri Forts</Link></li>
              <li><Link href="/places?region=Mumbai%20Region" className="hover:text-cyan-400 transition-colors">Mumbai Heritage Arc</Link></li>
              <li><Link href="/places?region=Satara%20Region" className="hover:text-cyan-400 transition-colors">Satara & Mahabaleshwar</Link></li>
              <li><Link href="/places?region=Kolhapur%20Region" className="hover:text-cyan-400 transition-colors">Kolhapur & Sangli</Link></li>
              <li><Link href="/places?region=Konkan%20Region" className="hover:text-cyan-400 transition-colors">Konkan Coast & Beaches</Link></li>
              <li><Link href="/places?region=Nashik%20Region" className="hover:text-cyan-400 transition-colors">Nashik Pilgrimage Hub</Link></li>
            </ul>
          </div>

          {/* AI/ML Capabilities */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              AIML Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/scanner" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5"><span>YOLO Landmark Scanner</span></Link></li>
              <li><Link href="/map" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5"><span>A* Road Graph Routing</span></Link></li>
              <li><Link href="/recommender" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5"><span>Groq LLaMA Trip Planner</span></Link></li>
              <li><Link href="/ar-navigation" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5"><span>Camera AR Direction HUD</span></Link></li>
              <li><Link href="/offline" className="hover:text-cyan-400 transition-colors flex items-center space-x-1.5"><span>IndexedDB Offline Engine</span></Link></li>
            </ul>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/nearby" className="hover:text-cyan-400 transition-colors">Nearby Attractions</Link></li>
              <li><Link href="/places" className="hover:text-cyan-400 transition-colors">Destination Catalog</Link></li>
              <li><Link href="/login" className="hover:text-cyan-400 transition-colors">Traveler Login</Link></li>
              <li><Link href="/register" className="hover:text-cyan-400 transition-colors">Create Account</Link></li>
              <li><Link href="/admin" className="hover:text-cyan-400 transition-colors">Admin Portal (admin/admin)</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} YatraAI – Smart AI/ML Travel Companion for Maharashtra.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Built with Next.js, FastAPI, MySQL, YOLO & Groq</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

