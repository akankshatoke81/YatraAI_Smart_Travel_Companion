"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { Compass, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (_) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 bg-slate-900/90 border border-cyan-800/40 p-8 rounded-3xl shadow-2xl shadow-cyan-950/40 backdrop-blur-md">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 mb-2">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Password Reset</h2>
          <p className="text-xs text-slate-400">Enter your registered email to receive recovery instructions</p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Instructions Dispatched</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If an account is associated with <span className="text-cyan-300 font-semibold">{email}</span>, password reset instructions have been recorded.
            </p>
            <Link
              href="/login"
              className="inline-block pt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Registered Email</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-gradient font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-60"
            >
              {loading ? <span>Sending...</span> : <span>Send Recovery Instructions</span>}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

