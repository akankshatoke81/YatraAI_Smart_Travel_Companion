const API_BASE = "/api";

export interface Destination {
  id: number;
  name: string;
  description: string;
  district_id: number;
  district_name: string;
  region_name: string;
  category: string;
  latitude: number;
  longitude: number;
  entry_fee: number;
  opening_hours: string;
  visit_duration: string;
  history?: string;
  architecture?: string;
  image_path?: string;
  image_source?: string;
  image_attribution?: string;
  distance_km?: number | null;
  estimated_travel_time?: string | null;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  role: "admin" | "user";
  is_active?: boolean;
}

export interface AStarRouteResult {
  distance_km: number;
  duration_minutes: number;
  steps_count: number;
  coordinates: [number, number][];
  algorithm: string;
  graph_source: string;
}

export interface RecommendedDestinationItem {
  destination: Destination;
  visit_order: number;
  suggested_time_slot: string;
  reason: string;
  estimated_cost: number;
}

export interface RecommendationResult {
  title: string;
  summary: string;
  total_estimated_budget: number;
  total_visiting_duration: string;
  destinations: RecommendedDestinationItem[];
  ai_generated: boolean;
  ai_provider: string;
}

export interface LandmarkScanResult {
  status: "success" | "not_configured" | "not_recognized" | "error";
  recognized: boolean;
  landmark_name: string | null;
  confidence: number;
  bounding_box?: [number, number, number, number] | null;
  destination: Destination | null;
  message: string;
  model_used: string;
}

export interface TravelModeEstimate {
  mode: "bus" | "metro" | "auto" | "personal_vehicle" | "walking";
  mode_name: string;
  available: boolean;
  distance_km: number;
  travel_time_formatted: string;
  travel_time_minutes: number;
  estimated_cost_inr: number;
  cost_formatted: string;
  details: string;
  unavailable_reason?: string | null;
}

export interface TravelEstimateResponse {
  start_coordinates: [number, number];
  destination_coordinates: [number, number];
  destination_name: string;
  distance_km: number;
  estimates: TravelModeEstimate[];
}

export interface Region {
  id: number;
  region_name: string;
  description?: string;
  districts: { id: number; district_name: string; region_id: number }[];
}

export interface AdminDashboardData {
  total_users: number;
  total_destinations: number;
  total_regions: number;
  images_available: number;
  images_missing: number;
  recent_destinations: { id: number; name: string; category: string; district: string; created_at: string }[];
}

function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yatraai_token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

export const api = {
  // --- AUTH ---
  async register(data: { name: string; email: string; age?: number; password: string; confirm_password: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed." }));
      throw new Error(err.detail || "Registration failed.");
    }
    return res.json();
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Invalid email or password." }));
      throw new Error(err.detail || "Login failed.");
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      throw new Error("Unauthorized");
    }
    return res.json();
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: { ...getAuthHeader() } });
    } catch (_) {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("yatraai_token");
      localStorage.removeItem("yatraai_user");
    }
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // --- DESTINATIONS ---
  async getDestinations(params?: {
    search?: string;
    region?: string;
    region_id?: number;
    district?: string;
    district_id?: number;
    category?: string;
    user_lat?: number;
    user_lng?: number;
    limit?: number;
  }): Promise<Destination[]> {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.region) q.append("region", params.region);
    if (params?.region_id !== undefined && params?.region_id !== null) q.append("region_id", params.region_id.toString());
    if (params?.district) q.append("district", params.district);
    if (params?.district_id !== undefined && params?.district_id !== null) q.append("district_id", params.district_id.toString());
    if (params?.category) q.append("category", params.category);
    if (params?.user_lat !== undefined && params?.user_lat !== null) q.append("user_lat", params.user_lat.toString());
    if (params?.user_lng !== undefined && params?.user_lng !== null) q.append("user_lng", params.user_lng.toString());
    if (params?.limit) q.append("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/destinations?${q.toString()}`);
    if (!res.ok) throw new Error("Failed to load destinations.");
    return res.json();
  },

  async getNearbyDestinations(lat: number, lng: number, radius_km = 150): Promise<Destination[]> {
    const res = await fetch(`${API_BASE}/destinations/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}`);
    if (!res.ok) throw new Error("Failed to load nearby places.");
    return res.json();
  },

  async getCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/destinations/categories`);
    if (!res.ok) return [];
    return res.json();
  },

  async getDestinationById(id: number, user_lat?: number, user_lng?: number): Promise<Destination> {
    const q = new URLSearchParams();
    if (user_lat !== undefined && user_lat !== null) q.append("user_lat", user_lat.toString());
    if (user_lng !== undefined && user_lng !== null) q.append("user_lng", user_lng.toString());

    const res = await fetch(`${API_BASE}/destinations/${id}?${q.toString()}`);
    if (!res.ok) throw new Error("Destination not found.");
    return res.json();
  },

  async explainDestination(id: number, aspect = "all") {
    const res = await fetch(`${API_BASE}/destinations/${id}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination_id: id, aspect }),
    });
    if (!res.ok) throw new Error("Failed to generate AI explanation.");
    return res.json();
  },

  // Admin Destinations
  async createDestination(data: Partial<Destination>): Promise<Destination> {
    const res = await fetch(`${API_BASE}/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Create failed" }));
      throw new Error(err.detail);
    }
    return res.json();
  },

  async updateDestination(id: number, data: Partial<Destination>): Promise<Destination> {
    const res = await fetch(`${API_BASE}/destinations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Update failed" }));
      throw new Error(err.detail);
    }
    return res.json();
  },

  async deleteDestination(id: number) {
    const res = await fetch(`${API_BASE}/destinations/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Delete destination failed.");
    return res.json();
  },

  async uploadDestinationPhoto(id: number, file: File, attribution?: string, source?: string) {
    const formData = new FormData();
    formData.append("file", file);
    const q = new URLSearchParams();
    if (attribution) q.append("attribution", attribution);
    if (source) q.append("source", source);

    const res = await fetch(`${API_BASE}/destinations/${id}/upload-photo?${q.toString()}`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) throw new Error("Photo upload failed.");
    return res.json();
  },

  // --- REGIONS & DISTRICTS ---
  async getRegions(): Promise<Region[]> {
    const res = await fetch(`${API_BASE}/regions`);
    if (!res.ok) return [];
    return res.json();
  },

  async createRegion(data: { region_name: string; description?: string }) {
    const res = await fetch(`${API_BASE}/regions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Create region failed.");
    return res.json();
  },

  async deleteRegion(id: number) {
    const res = await fetch(`${API_BASE}/regions/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Delete region failed." }));
      throw new Error(err.detail);
    }
    return res.json();
  },

  async createDistrict(data: { district_name: string; region_id: number }) {
    const res = await fetch(`${API_BASE}/regions/districts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Create district failed.");
    return res.json();
  },

  // --- A* NAVIGATION ---
  async computeRoute(start_lat: number, start_lng: number, end_lat: number, end_lng: number, destination_id?: number): Promise<AStarRouteResult> {
    const res = await fetch(`${API_BASE}/navigation/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_lat, start_lng, end_lat, end_lng, destination_id }),
    });
    if (!res.ok) throw new Error("Route calculation failed.");
    return res.json();
  },

  async getTravelEstimate(params: {
    start_lat: number;
    start_lng: number;
    dest_lat?: number;
    dest_lng?: number;
    destination_id?: number;
  }): Promise<TravelEstimateResponse> {
    const res = await fetch(`${API_BASE}/navigation/travel-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to calculate travel estimation.");
    return res.json();
  },

  // --- AI RECOMMENDATIONS ---
  async generateRecommendations(data: {
    starting_location: string;
    preferred_region?: string;
    preferred_district?: string;
    total_budget: number;
    available_time: string;
    interests: string[];
    num_travellers: number;
    travel_type: string;
    user_lat?: number;
    user_lng?: number;
  }): Promise<RecommendationResult> {
    const res = await fetch(`${API_BASE}/recommendations/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate itinerary.");
    return res.json();
  },

  async saveItinerary(itineraryData: any) {
    const res = await fetch(`${API_BASE}/recommendations/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(itineraryData),
    });
    if (!res.ok) throw new Error("Failed to save itinerary.");
    return res.json();
  },

  async getSavedItineraries() {
    const res = await fetch(`${API_BASE}/recommendations/saved`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return [];
    return res.json();
  },

  // --- LANDMARK SCANNER ---
  async scanMonument(file: File): Promise<LandmarkScanResult> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/landmarks/scan`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Scanner failed to process image.");
    return res.json();
  },

  // --- FAVOURITES ---
  async getFavourites(): Promise<Destination[]> {
    const res = await fetch(`${API_BASE}/favourites`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getFavouriteIds(): Promise<number[]> {
    const res = await fetch(`${API_BASE}/favourites/ids`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return [];
    return res.json();
  },

  async toggleFavourite(destinationId: number): Promise<{ favourited: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/favourites/${destinationId}/toggle`, {
      method: "POST",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Toggle favourite failed.");
    return res.json();
  },

  // --- OFFLINE ---
  async getOfflineBundle(region?: string) {
    const q = region ? `?region=${encodeURIComponent(region)}` : "";
    const res = await fetch(`${API_BASE}/offline/bundle${q}`);
    if (!res.ok) throw new Error("Failed to retrieve offline bundle.");
    return res.json();
  },

  // --- ADMIN PORTAL ---
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Admin access required.");
    return res.json();
  },

  async getAdminUsers(search?: string): Promise<User[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`${API_BASE}/admin/users${q}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to retrieve user accounts.");
    return res.json();
  },

  async toggleUserStatus(userId: number, isActive: boolean) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("Failed to update user status.");
    return res.json();
  },

  async deleteUser(userId: number) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to delete user.");
    return res.json();
  },
};

