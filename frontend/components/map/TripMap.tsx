"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";

interface TripMapProps {
  mapData?: any; 
  tripData?: any; 
}

// Math helper to calculate bearing/rotation for the airplane
const calculateBearing = (start: [number, number], end: [number, number]) => {
  const startLat = (start[1] * Math.PI) / 180;
  const startLng = (start[0] * Math.PI) / 180;
  const endLat = (end[1] * Math.PI) / 180;
  const endLng = (end[0] * Math.PI) / 180;

  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

// Generates a high-resolution curve for smooth animation
const getCurvedLine = (start: [number, number], end: [number, number], steps = 500) => {
  const line = [];
  const [x1, y1] = start;
  const [x2, y2] = end;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = mx - dy * 0.2;
  const cy = my + dx * 0.2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.pow(1 - t, 2) * x1 + 2 * (1 - t) * t * cx + Math.pow(t, 2) * x2;
    const y = Math.pow(1 - t, 2) * y1 + 2 * (1 - t) * t * cy + Math.pow(t, 2) * y2;
    line.push([x, y]);
  }
  return line;
};

export default function TripMap({ mapData }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  // Marker and Animation references for cleanup
  const staticMarkersRef = useRef<maplibregl.Marker[]>([]);
  const animatedMarkersRef = useRef<maplibregl.Marker[]>([]);
  const animationFramesRef = useRef<number[]>([]);

  const [radiusValue, setRadiusValue] = useState<number>(10);
  const [currentTripState, setCurrentTripState] = useState<any>({});
  const [sessionResults, setSessionResults] = useState<any>({});

  const calculateZoomFromRadius = (miles: number) => 14.5 - Math.log2(Math.max(1, miles));

  // 1. Listen for State & Session Data
  useEffect(() => {
    const loadData = () => {
      // Load Local Storage (Selected Items)
      const stateStr = localStorage.getItem("trip_state");
      if (stateStr) {
        try { setCurrentTripState(JSON.parse(stateStr)); } catch (e) {}
      } else {
        setCurrentTripState({});
      }

      // Load Session Storage (All available stays, flights, etc.)
      const sessionStr = sessionStorage.getItem("current_trip_results");
      if (sessionStr) {
        try { setSessionResults(JSON.parse(sessionStr)); } catch (e) {}
      } else {
        setSessionResults({});
      }
    };
    
    loadData();
    window.addEventListener("trip_state_changed", loadData);
    window.addEventListener("current_trip_results_changed", loadData); 

    return () => {
      window.removeEventListener("trip_state_changed", loadData);
      window.removeEventListener("current_trip_results_changed", loadData);
    };
  }, []);

  // 2. Initialize Map & Base Theme
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.protomaps.com/styles/v5/light/en.json?key=${process.env.NEXT_PUBLIC_PROTOMAPS_KEY}`,
      center: [-105.2705, 40.015],
      zoom: 15,
      attributionControl: false,
    });

    mapRef.current.addControl(new maplibregl.AttributionControl({ compact: false }), "bottom-right");
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      if (!mapRef.current) return;
      const layers = mapRef.current.getStyle().layers;

      layers.forEach((layer) => {
        if (layer.id === "background") mapRef.current!.setPaintProperty(layer.id, "background-color", "#F3F4F6");
        if (layer.id === "earth" || layer.id.includes("land")) {
          try { mapRef.current!.setPaintProperty(layer.id, "fill-color", "#F3F4F6"); } catch (e) {}
        }
        if (layer.id.includes("water") && layer.type === "fill") {
          try { mapRef.current!.setPaintProperty(layer.id, "fill-color", "#E5E7EB"); } catch (e) {}
        }
        if (layer.id.includes("transit_") && layer.type === "line") {
          try {
            mapRef.current!.setPaintProperty(layer.id, "line-color", "#111827");
            mapRef.current!.setPaintProperty(layer.id, "line-opacity", layer.id.includes("minor") ? 0.05 : 0.15);
          } catch (e) {}
        }
        if (layer.id.includes("buildings") && layer.type === "fill") {
          mapRef.current!.setLayoutProperty(layer.id, "visibility", "none");
        }
      });
    });

    return () => {
      maplibregl.removeProtocol("pmtiles");
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 3. Dynamic Interactive Markers & Animations
  const renderInteractiveData = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Cleanup previous renders
    staticMarkersRef.current.forEach((m) => m.remove());
    staticMarkersRef.current = [];
    animatedMarkersRef.current.forEach((m) => m.remove());
    animatedMarkersRef.current = [];
    animationFramesRef.current.forEach((frame) => cancelAnimationFrame(frame));
    animationFramesRef.current = [];

    if (map.getLayer("driving-route-layer")) map.removeLayer("driving-route-layer");
    if (map.getSource("driving-route-source")) map.removeSource("driving-route-source");
    if (map.getLayer("flight-route-layer")) map.removeLayer("flight-route-layer");
    if (map.getSource("flight-route-source")) map.removeSource("flight-route-source");

    const { stays: allStays, rawParams, drivingData } = sessionResults;
    const { stays: selectedStays, drive: selectedDrive, flights: selectedFlights } = currentTripState;

    // RULE 1: Stays (From Session Storage)
    const selectedStayKeys = selectedStays?.map((s: any) => s._selectionKey) || [];
    
    if (allStays?.length > 0) {
      allStays.slice(0, 12).forEach((stay: any, idx: number) => {
        const lat = stay.latitude || stay.geoCode?.latitude || stay.geo_code?.latitude || stay.hotel?.latitude;
        const lng = stay.longitude || stay.geoCode?.longitude || stay.geo_code?.longitude || stay.hotel?.longitude;
        const uniqueKey = stay.hotel_id || stay.hotelId || stay.hotel?.hotelId || stay.id || `stay-${idx}`;
        const isSelected = selectedStayKeys.includes(uniqueKey);

        if (lat && lng) {
          const el = document.createElement("div");

          // Clean Line Art SVG for Hotel (Bed Icon)
          const bedSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
          const bedSvgSmall = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;

          if (isSelected) {
            // Highlighted Selected Hotel
            el.className = "w-10 h-10 bg-theme-bg text-theme-primary rounded-xl border-2 border-theme-primary flex items-center justify-center shadow-xl z-30 group relative cursor-pointer";
            el.innerHTML = `
              ${bedSvg}
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap bg-theme-text text-theme-bg px-3 py-1.5 rounded-xl shadow-xl z-50 flex flex-col items-center">
                <span class="font-black text-[11px] uppercase tracking-widest">${stay.name || stay.hotel?.name || "Selected Hotel"}</span>
                <div class="w-2 h-2 bg-theme-text absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45"></div>
              </div>
            `;
          } else {
            // Unselected Hotel: Opacity drops to 70% naturally, restores to 100 on hover.
            el.className = "w-8 h-8 bg-theme-bg text-theme-primary rounded-xl border border-theme-primary/10 flex items-center justify-center shadow-sm z-20 group relative cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-300";
            el.innerHTML = `
              ${bedSvgSmall}
              <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap bg-theme-text text-theme-bg px-3 py-1.5 rounded-xl shadow-xl z-50 flex flex-col items-center">
                <span class="font-black text-[11px] uppercase tracking-widest">${stay.name || stay.hotel?.name || "Hotel"}</span>
                <div class="w-2 h-2 bg-theme-text absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45"></div>
              </div>
            `;
          }

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map);

          staticMarkersRef.current.push(marker);
        }
      });
    }

    // RULE 2: Flight Path & Animation
    if (selectedFlights && selectedFlights.length > 0 && rawParams?.source && rawParams?.destination) {
      const srcLon = rawParams.source.lon || rawParams.source.longitude;
      const srcLat = rawParams.source.lat || rawParams.source.latitude;
      const destLon = rawParams.destination.lon || rawParams.destination.longitude;
      const destLat = rawParams.destination.lat || rawParams.destination.latitude;

      if (srcLon && srcLat && destLon && destLat) {
        const curvedRoute = getCurvedLine([srcLon, srcLat], [destLon, destLat], 500); 
        
        map.addSource("flight-route-source", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: curvedRoute } },
        });

        map.addLayer({
          id: "flight-route-layer",
          type: "line",
          source: "flight-route-source",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#0E9C4C", "line-width": 3, "line-dasharray": [2, 4] },
        });

        const planeEl = document.createElement("div");
        planeEl.className = "text-theme-primary drop-shadow-md z-40";
        planeEl.style.fontSize = "24px";
        planeEl.innerHTML = "✈️";

        const planeMarker = new maplibregl.Marker({ element: planeEl })
          .setLngLat(curvedRoute[0] as [number, number])
          .addTo(map);
        animatedMarkersRef.current.push(planeMarker);

        let counter = 0;
        const animateFlight = () => {
          if (!mapRef.current) return;
          counter = (counter + 1) % curvedRoute.length;
          const currentPos = curvedRoute[counter] as [number, number];
          const nextPos = curvedRoute[(counter + 1) % curvedRoute.length] as [number, number];
          
          planeMarker.setLngLat(currentPos);
          
          const bearing = calculateBearing(currentPos, nextPos);
          planeEl.style.transform = `rotate(${bearing - 45}deg)`; 

          animationFramesRef.current.push(requestAnimationFrame(animateFlight));
        };
        animateFlight();
      }
    }

    // RULE 3: Drive Path & Animation
    if (selectedDrive?.selected && drivingData?.geometry) {
      const driveCoordinates = drivingData.geometry.coordinates || [];

      map.addSource("driving-route-source", {
        type: "geojson",
        data: drivingData.geometry,
      });

      map.addLayer({
        id: "driving-route-layer",
        type: "line",
        source: "driving-route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0E9C4C", "line-width": 5, "line-opacity": 0.8 },
      });

      if (driveCoordinates.length > 1) {
        const carEl = document.createElement("div");
        carEl.className = "w-4 h-4 bg-theme-bg border-4 border-theme-primary rounded-full shadow-lg z-40";
        
        const carMarker = new maplibregl.Marker({ element: carEl })
          .setLngLat(driveCoordinates[0])
          .addTo(map);
        animatedMarkersRef.current.push(carMarker);

        let driveCounter = 0;
        const animateDrive = () => {
          if (!mapRef.current) return;
          driveCounter = (driveCounter + 2) % driveCoordinates.length; 
          carMarker.setLngLat(driveCoordinates[driveCounter]);
          animationFramesRef.current.push(requestAnimationFrame(animateDrive));
        };
        animateDrive();
      }
    }

  }, [sessionResults, currentTripState]); 

  // Trigger render when map is ready or when state updates
  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) {
      renderInteractiveData();
    } else {
      mapRef.current?.once("styledata", renderInteractiveData);
    }
  }, [renderInteractiveData]);

  // Center Map on Destination
  useEffect(() => {
    if (!mapRef.current) return;
    const savedData = localStorage.getItem("search_state");
    if (!savedData) return;

    try {
      const { destination, radius } = JSON.parse(savedData);
      const initialRadius = radius ? Math.max(1, Math.min(25, radius)) : 10;
      setRadiusValue(initialRadius);

      if (destination?.lat && destination?.lon) {
        mapRef.current!.flyTo({
          center: [destination.lon, destination.lat],
          zoom: calculateZoomFromRadius(initialRadius),
          essential: true,
          duration: 2000,
        });
      }
    } catch (err) {}
  }, [mapData]);

  // Radius Slider Handling
  const handleRadiusSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setRadiusValue(val);
    const savedData = localStorage.getItem("search_state");
    if (!savedData || !mapRef.current) return;

    try {
      const state = JSON.parse(savedData);
      if (state.destination?.lat && state.destination?.lon) {
        mapRef.current.flyTo({
          center: [state.destination.lon, state.destination.lat],
          zoom: calculateZoomFromRadius(val),
          duration: 300,
          essential: true,
        });
      }
    } catch (e) {}
  };

  const handleRadiusDrop = () => {
    const savedData = localStorage.getItem("search_state");
    if (!savedData) return;
    try {
      const state = JSON.parse(savedData);
      state.radius = radiusValue;
      localStorage.setItem("search_state", JSON.stringify(state));
    } catch (e) {}
  };

  return (
    <div className="relative w-full h-full rounded-none overflow-hidden">
      {/* Search Radius UI */}
      <div className="absolute bottom-6 left-6 z-40 bg-theme-bg px-2 py-1.5 rounded-2xl shadow-xl flex flex-col gap-1 border border-theme-surface">
        <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted pl-1">
          Search Radius: {radiusValue} mi
        </label>
        <input
          type="range"
          min="1" max="31" step="2"
          value={radiusValue}
          onChange={handleRadiusSlider}
          onMouseUp={handleRadiusDrop}
          onTouchEnd={handleRadiusDrop}
          className="w-[140px] cursor-pointer accent-theme-primary h-2 bg-theme-surface rounded-lg appearance-none shadow-inner mx-1"
        />
      </div>

      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}