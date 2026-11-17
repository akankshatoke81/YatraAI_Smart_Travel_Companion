"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  userLocation: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number; name?: string } | null;
  routeCoordinates?: [number, number][];
  routeInfo?: { distance_km: number; duration_minutes: number; algorithm: string } | null;
  allDestinations?: { id: number; name: string; latitude: number; longitude: number; category: string }[];
  onSelectDestination?: (id: number) => void;
}

export default function LeafletMap({
  userLocation,
  destinationLocation,
  routeCoordinates,
  routeInfo,
  allDestinations = [],
  onSelectDestination,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center on Maharashtra (Pune/Mumbai region) if no user location
    const defaultCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [18.5204, 73.8567]; // Pune

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 9,
      zoomControl: true,
    });

    // Dark styled or Standard OpenStreetMap Tiles with attribution
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | YatraAI Routing Engine',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Routes when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. User Location Marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="
            width: 22px;
            height: 22px;
            background: #06b6d4;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 14px #06b6d4, 0 0 24px rgba(6, 182, 212, 0.6);
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; padding: 4px;">
          <strong style="color: #0284c7;">📍 Your Current Location</strong><br/>
          Lat: ${userLocation.lat.toFixed(4)}°, Lng: ${userLocation.lng.toFixed(4)}°
        </div>
      `);
      markersLayer.addLayer(userMarker);
    }

    // 2. Active Destination Marker
    if (destinationLocation) {
      const destIcon = L.divIcon({
        className: "custom-dest-marker",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #4f46e5, #9333ea);
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 0 16px rgba(147, 51, 234, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="transform: rotate(45deg); color: #fff; font-size: 14px; font-weight: bold;">★</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const destMarker = L.marker([destinationLocation.lat, destinationLocation.lng], { icon: destIcon });
      destMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; padding: 4px;">
          <strong style="color: #4f46e5; font-size: 14px;">🚩 ${destinationLocation.name || "Target Monument"}</strong><br/>
          Coordinates: ${destinationLocation.lat.toFixed(4)}°, ${destinationLocation.lng.toFixed(4)}°
        </div>
      `);
      markersLayer.addLayer(destMarker);
      destMarker.openPopup();
    }

    // 3. Other Destinations Markers (if provided)
    if (allDestinations.length > 0) {
      allDestinations.forEach((dest) => {
        // Skip active destination marker to prevent duplicate
        if (destinationLocation && dest.latitude === destinationLocation.lat && dest.longitude === destinationLocation.lng) {
          return;
        }

        const landmarkIcon = L.divIcon({
          className: "custom-landmark-marker",
          html: `
            <div style="
              width: 16px;
              height: 16px;
              background: #0f172a;
              border: 2px solid #22d3ee;
              border-radius: 50%;
              box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
            "></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const m = L.marker([dest.latitude, dest.longitude], { icon: landmarkIcon });
        m.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
            <strong>${dest.name}</strong><br/>
            <span style="color: #0891b2; font-weight: 600;">${dest.category}</span>
          </div>
        `);
        if (onSelectDestination) {
          m.on("click", () => onSelectDestination(dest.id));
        }
        markersLayer.addLayer(m);
      });
    }

    // 4. Draw A* Route Polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length >= 2) {
      const latlngs: L.LatLngExpression[] = routeCoordinates.map(([lat, lng]) => [lat, lng]);

      // Glow backdrop line
      const glowLine = L.polyline(latlngs, {
        color: "#06b6d4",
        weight: 8,
        opacity: 0.4,
      });

      // Main route line
      const mainLine = L.polyline(latlngs, {
        color: "#4f46e5",
        weight: 4,
        opacity: 0.95,
        dashArray: "8, 4",
      });

      const routeGroup = L.featureGroup([glowLine, mainLine]);
      routeGroup.addTo(map);
      routeLayerRef.current = mainLine;

      // Fit map view to route bounds
      map.fitBounds(mainLine.getBounds(), { padding: [50, 50] });
    } else if (userLocation && destinationLocation) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [destinationLocation.lat, destinationLocation.lng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation, destinationLocation, routeCoordinates, allDestinations, onSelectDestination]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-cyan-900/40 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-10" />

      {/* Route Info Badge Overlay */}
      {routeInfo && (
        <div className="absolute top-4 right-4 z-20 bg-slate-950/90 backdrop-blur-md p-3.5 rounded-xl border border-cyan-800/60 shadow-xl text-slate-100 max-w-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold uppercase tracking-wider">
            <span>A* Route Active</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-white">{routeInfo.distance_km} km</span>
            <span className="text-xs text-slate-400">({routeInfo.duration_minutes} mins)</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Algorithm: {routeInfo.algorithm}
          </p>
        </div>
      )}
    </div>
  );
}

