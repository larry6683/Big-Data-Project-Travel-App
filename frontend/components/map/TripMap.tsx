"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from 'pmtiles';
import Cookies from 'js-cookie';
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
      const cookieData = Cookies.get("search_state");
      if (!cookieData) return;

      try {
        const { destination, radius } = JSON.parse(cookieData);
        
        // Initialize slider state safely between 1 and 25
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

    const cookieData = Cookies.get("search_state");
    if (!cookieData || !mapRef.current) return;
    
    try {
      const state = JSON.parse(cookieData);
      if (state.destination?.lat && state.destination?.lon) {
        mapRef.current.flyTo({
          center: [state.destination.lon, state.destination.lat],
          zoom: calculateZoomFromRadius(val),
          duration: 300, // Short duration for fast slider tracking
          essential: true
        });
      }
    } catch (e) {}
  };

  // Handle saving the state ONLY when slider drag is released
  const handleRadiusDrop = () => {
    const cookieData = Cookies.get("search_state");
    if (!cookieData) return;
    
    try {
      const state = JSON.parse(cookieData);
      state.radius = radiusValue;
      Cookies.set("search_state", JSON.stringify(state)); 
    } catch (e) {
      console.error("Failed to update cookie:", e);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '0px', overflow: 'hidden' }}>
      
      {/* Floating Radius Controller */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '100px',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'white',
        padding: '1px 3px',
        borderRadius: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid #e5e7eb'
      }}>
        <label style={{ fontSize: '10px', fontWeight: 600, color: '#374151', paddingLeft: '6px' }}>
          Radius: {radiusValue} mi
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
          style={{ width: '100px', cursor: 'pointer', accentColor: '#2563eb' }}
        />
      </div>

      {/* Map Container */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}