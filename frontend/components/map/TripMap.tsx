"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as pmtiles from 'pmtiles';
import Cookies from 'js-cookie';
import { fetchOsmInterests } from '../../services/api';

interface TripMapProps {
  mapData?: any; 
  attractions?: any[];
  stays?: any[];
}

// Maps Sidebar UI selection IDs to exact OSM tag search strings
const CATEGORY_TAG_MAP: Record<string, string[]> = {
  amenity: ['amenity=restaurant', 'amenity=cafe', 'amenity=pub', 'amenity=bank', 'amenity=hospital', 'amenity=school', 'amenity=fuel', 'amenity=parking'],
  aviation: ['aeroway=aerodrome', 'aeroway=heliport', 'aeroway=gate', 'aeroway=terminal', 'aeroway=runway'],
  tourism: ['tourism=hotel', 'tourism=museum', 'tourism=attraction', 'tourism=viewpoint', 'tourism=artwork', 'tourism=zoo'],
  leisure: ['leisure=park', 'leisure=swimming_pool', 'leisure=stadium', 'leisure=playground', 'leisure=golf_course'],
  shop: ['shop=supermarket', 'shop=convenience', 'shop=clothes', 'shop=bicycle', 'shop=electronics'],
  historic: ['historic=monument', 'historic=memorial', 'historic=castle', 'historic=ruins', 'historic=archaeological_site'],
  transit: ['highway=bus_stop', 'highway=cycleway', 'highway=footway']
};

export default function TripMap({ mapData }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [pois, setPois] = useState<any[]>([]);

  // 1. Initialize MapLibre with PMTiles support
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Register the PMTiles protocol
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const protomapsKey = process.env.NEXT_PUBLIC_PROTOMAPS_KEY || 'YOUR_PROTOMAPS_KEY';
    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY || 'YOUR_MAPTILER_KEY';
    const tomtom_api_key = process.env.NEXT_PUBLIC_TOMTOM_KEY || 'YOUR_TOMTOM_KEY';

    // =========================================================================
    // 🌍 THE ULTIMATE MAP THEME DICTIONARY
    // =========================================================================
    const STYLES: any = {
      // --- PROTOMAPS (New Build Integrated) ---
      protomapsBuild: {
        version: 8,
        sources: {
          protomaps: {
            type: 'vector',
            url: 'pmtiles://https://build.protomaps.com/20260303.pmtiles', // Your new build
            attribution: '© OpenStreetMap'
          }
        },
        layers: [] // Requires a full style layers definition to render
      },
      protomapsLight: `https://api.protomaps.com/styles/v2/light.json?key=${protomapsKey}`,

      // --- CARTO (Active) ---
      cartoVoyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', 

      // --- ENTERPRISE & OTHERS ---
      tomtomBasic: `https://api.tomtom.com/map/1/style/22/basic_main.json?key=${tomtom_api_key}`,
      mapTilerOsmVector: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${maptilerKey}`,
    };

    // ⬇️ ACTIVE TILE ⬇️
    const ACTIVE_STYLE = STYLES.protomapsLight;
    // ⬆️ =======================================================================

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: ACTIVE_STYLE,
      center: [-105.2705, 40.0150], // Default Boulder coords
      zoom: 12,
      attributionControl: false
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      maplibregl.removeProtocol('pmtiles');
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Fly to Location & Fetch POIs based on search_state cookie
  useEffect(() => {
    if (!mapRef.current) return;

    const syncWithSearchState = async () => {
      const cookieData = Cookies.get("search_state");
      if (!cookieData) return;

      try {
        const { destination, radius, interests } = JSON.parse(cookieData);
        
        if (destination?.lat && destination?.lon) {
          // Smoothly fly to the destination
          mapRef.current!.flyTo({
            center: [destination.lon, destination.lat],
            zoom: radius > 15 ? 11 : 13,
            essential: true,
            duration: 2000 
          });

          // Fetch POIs around that geocode
          if (interests && interests.length > 0) {
            const tagsToQuery = interests.flatMap((id: string) => CATEGORY_TAG_MAP[id] || []);
            const elements = await fetchOsmInterests(tagsToQuery, destination.lat, destination.lon, radius);
            setPois(elements);
          } else {
            setPois([]);
          }
        }
      } catch (err) {
        console.error("Map sync error:", err);
      }
    };

    syncWithSearchState();
  }, [mapData]); 

  // 3. Render Custom Category Markers
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    pois.forEach((poi) => {
      const lat = poi.lat || poi.center?.lat;
      const lon = poi.lon || poi.center?.lon;
      if (!lat || !lon) return;

      const name = poi.tags?.name || 'Interesting Place';
      const cat = poi.tags?.amenity || poi.tags?.tourism || poi.tags?.leisure || 'place';
      
      const popupHtml = `
        <div style="padding: 10px; font-family: sans-serif;">
          <strong style="display: block; margin-bottom: 4px;">${name}</strong>
          <span style="font-size: 11px; color: #666; text-transform: capitalize;">${cat.replace(/_/g, ' ')}</span>
        </div>
      `;

      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        width: 24px; height: 24px; background: #fff; 
        border: 2px solid #2563eb; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
      `;
      markerEl.innerHTML = poi.tags?.amenity ? '☕' : poi.tags?.tourism ? '📸' : '📍';

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lon, lat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(popupHtml))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [pois]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '12px' }} />;
}