"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Calendar
} from "lucide-react";
import { User as UserType, api } from "@/services/api";

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentAdmin, isAdmin, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push("/login");
        return;
      }
      loadUsers();
    }
  }, [authLoading, isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminUsers(search || undefined);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleToggleStatus = async (user: UserType) => {
    if (user.id === currentAdmin?.id) {
      alert("Cannot deactivate your own administrator account.");
      return;
    }

    const nextStatus = !user.is_active;
    try {
      await api.toggleUserStatus(user.id, nextStatus);
      setMessage(`Account '${user.name}' marked as ${nextStatus ? "Active" : "Inactive"}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update account status.");
    }
  };

  const handleDeleteUser = async (user: UserType) => {
    if (user.id === currentAdmin?.id) {
      alert("Cannot delete your own administrator account.");
      return;
    }

    if (confirm(`Are you sure you want to permanently delete user '${user.name}' (${user.email})?`)) {
      try {
        await api.deleteUser(user.id);
        setMessage(`Account '${user.name}' permanently deleted.`);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } catch (err: any) {
        alert(err.message || "Failed to delete user.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Manage Registered Users</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review accounts, activate/deactivate travelers, and enforce administrative access.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-24 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          className="btn-cyan absolute right-1.5 top-1.5 px-3 py-1 rounded-lg text-xs font-bold"
        >
          Search
        </button>
      </form>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Age</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs uppercase">
                        {u.name.slice(0, 2)}
                      </div>
                      <span className="font-bold text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3.5 px-4 text-slate-400">{u.age ? `${u.age} yrs` : "—"}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === "admin"
                          ? "bg-purple-950 text-purple-300 border border-purple-800"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active !== false
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-red-950 text-red-300 border border-red-800"
                      }`}
                    >
                      {u.is_active !== false ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      disabled={u.id === currentAdmin?.id}
                      className={`p-1.5 rounded-lg text-xs font-semibold ${
                        u.is_active !== false
                          ? "bg-amber-950/60 text-amber-400 hover:bg-amber-900/60"
                          : "bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60"
                      } disabled:opacity-30`}
                      title={u.is_active !== false ? "Deactivate Account" : "Activate Account"}
                    >
                      {u.is_active !== false ? (
                        <UserX className="w-3.5 h-3.5" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      disabled={u.id === currentAdmin?.id}
                      className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/60 disabled:opacity-30"
                      title="Delete User"
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
    </div>
  );
}

