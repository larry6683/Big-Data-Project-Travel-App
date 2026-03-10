// larry6683/big-data-project-travel-app/frontend/components/map/TripMap.tsx

"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from 'pmtiles';
import * as protomaps_basemaps from '@protomaps/basemaps';

interface TripMapProps {
  mapData?: any; 
  attractions?: any[];
  stays?: any[];
}

export default function TripMap({ mapData }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const [radiusValue, setRadiusValue] = useState<number>(10);

  // Helper to dynamically calculate zoom based on radius miles
  const calculateZoomFromRadius = (miles: number) => {
    return 14.5 - Math.log2(Math.max(1, miles)); 
  };

  // 1. Initialize MapLibre with PMTiles support and Protomaps Layers
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const rawLayers = protomaps_basemaps.layers("protomaps", protomaps_basemaps.namedFlavor("light"), {lang:"en"});
    const validatedLayers = rawLayers.map((layer: any) => {
      if (layer.type === 'line' && layer.paint && typeof layer.paint['line-color'] === 'undefined') {
        return { ...layer, paint: { ...layer.paint, 'line-color': '#cccccc' } };
      }
      return layer;
    });

    const STYLES: any = {
      protomapsBuild: {
        version: 8,
        name: "Protomaps Latest Build",
        sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
        glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sources: {
          protomaps: {
            type: 'vector',
            url: 'pmtiles://https://build.protomaps.com/20260303.pmtiles', 
            attribution: '<a href="https://protomaps.com" target="_blank">Protomaps |</a> <a href="https://openstreetmap.org">OpenStreetMap ©</a>'
          }
        },
        layers: validatedLayers
      }
    };

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLES.protomapsBuild,
      center: [-105.2705, 40.0150], 
      zoom: 15,
      attributionControl: false 
    });

    mapRef.current.addControl(
      new maplibregl.AttributionControl({ compact: false }),
      'bottom-right'
    );
    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      maplibregl.removeProtocol('pmtiles');
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Initial Data Sync
  useEffect(() => {
    if (!mapRef.current) return;

    const syncWithSearchState = async () => {
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
            duration: 2000 
          });
        }
      } catch (err) {
        console.error("Map sync error:", err);
      }
    };

    syncWithSearchState();
  }, [mapData]); 

  // Handle immediate visual slider drag (Smooth Zooming)
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
          essential: true
        });
      }
    } catch (e) {}
  };

  // Handle saving the state ONLY when slider drag is released
  const handleRadiusDrop = () => {
    const savedData = localStorage.getItem("search_state");
    if (!savedData) return;
    
    try {
      const state = JSON.parse(savedData);
      state.radius = radiusValue;
      localStorage.setItem("search_state", JSON.stringify(state)); 
    } catch (e) {
      console.error("Failed to update localStorage:", e);
    }
  };

  return (
    <div className="relative w-full h-full rounded-none overflow-hidden">
      
      {/* Floating Radius Controller */}
      <div className="absolute bottom-3 left-[100px] -translate-x-1/2 z-10 bg-white px-1 py-[3px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-2.5 border border-gray-200">
        <label className="text-[10px] font-semibold text-gray-700 pl-1.5">
         Zoom: {radiusValue} mi
        </label>
        <input 
          type="range" 
          min="1" 
          max="31" 
          step="2"
          value={radiusValue} 
          onChange={handleRadiusSlider}
          onMouseUp={handleRadiusDrop}
          onTouchEnd={handleRadiusDrop}
          className="w-[100px] cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}