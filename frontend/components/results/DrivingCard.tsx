"use client";

import React, { useState, useEffect } from 'react';

export default function DrivingCard({ drivingData, loading: parentLoading }: { drivingData?: any, loading?: boolean }) {
  const [routeData, setRouteData] = useState<any>(drivingData || null);
  const [loading, setLoading] = useState<boolean>(parentLoading || false);
  const [error, setError] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState<boolean>(false);
  
  const [passedCities, setPassedCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState<boolean>(false);
  const [showIntermediates, setShowIntermediates] = useState<boolean>(true);

  const stateAbbr: Record<string, string> = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
  };

  useEffect(() => {
    const fetchRoute = async () => {
      if (drivingData && Object.keys(drivingData).length > 0) {
        setRouteData(drivingData);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchStateStr = localStorage.getItem('search_state');
        if (!searchStateStr) throw new Error("No search state found.");

        const searchState = JSON.parse(searchStateStr);
        const { source, destination } = searchState;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        
        // Ensure this endpoint path matches your Python setup
        const response = await fetch(
          `${baseUrl.replace('/api/v1', '')}/driving/route?origin_lat=${source.lat}&origin_lon=${source.lon}&dest_lat=${destination.lat}&dest_lon=${destination.lon}`
        );

        if (!response.ok) throw new Error("Failed to fetch driving route.");

        const data = await response.json();
        setRouteData({
          ...data,
          sourceName: source.name || "Origin",
          destinationName: destination.name || "Destination"
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [drivingData]);

  useEffect(() => {
    if (routeData?.geometry?.coordinates && passedCities.length === 0 && !citiesLoading) {
      fetchIntermediates();
    }
  }, [routeData]);

const fetchIntermediates = async () => {
    if (citiesLoading || !routeData?.geometry?.coordinates) return;

    setCitiesLoading(true);
    const coords = routeData.geometry.coordinates;
    const citiesFound: string[] = [];
    
    // Scan points to identify passing cities
    const step = Math.max(1, Math.floor(coords.length / 20)); 
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    for (let i = step; i < coords.length; i += step) {
      const [lon, lat] = coords[i];
      try {
        // Now calling our safe Python backend instead of Nominatim directly
        const res = await fetch(`${baseUrl}/locations/nearest?lat=${lat}&lon=${lon}`);
        if (res.ok) {
          const data = await res.json();
          
          const cityName = data.city;
          const stateName = data.state;
          const stateDisplay = stateName ? (stateAbbr[stateName] || stateName) : "";
          
          const fullLabel = stateDisplay ? `${cityName}, ${stateDisplay}` : cityName;
          
          // Filter out "Unknown" results from the reverse geocoder
          if (cityName && cityName !== "Unknown" && !citiesFound.includes(fullLabel)) {
            citiesFound.push(fullLabel);
          }
        }
        // Slight delay to respect backend processing
        await new Promise(r => setTimeout(r, 800)); 
      } catch (e) {
        console.error("Geocoding error", e);
      }
    }
    setPassedCities(citiesFound);
    setCitiesLoading(false);
  };

  const calculateFuel = (km: number) => {
    const miles = km * 0.621371;
    const gallons = miles / 25; 
    return {
      gallons: gallons.toFixed(1),
      cost: (gallons * 3.35).toFixed(2),
      miles: miles.toFixed(0)
    };
  };

  const toggleDriveSelection = () => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    const newSelected = !isSelected;
    setIsSelected(newSelected);

    tripState.drive = newSelected ? { selected: true, data: routeData } : null;
    localStorage.setItem('trip_state', JSON.stringify(tripState));
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-gray-400">Loading Route...</div>;
  if (!routeData) return null;

  const fuel = calculateFuel(routeData.distance_km);

  return (
    <div className="flex flex-col gap-4">
      <div className={`bg-white rounded-xl overflow-hidden border p-5 transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg' : 'border-gray-200 shadow-sm'}`}>
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Road Trip Journey</h3>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              {routeData.sourceName} ➔ {routeData.destinationName}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors shadow-md">
            <input type="checkbox" checked={isSelected} onChange={toggleDriveSelection} className="w-4 h-4 accent-white" />
            <span className="text-xs font-black uppercase tracking-widest select-none">Save Route</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Distance</span>
            <span className="text-xl font-black text-gray-800">{fuel.miles} Mi</span>
            <span className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">{routeData.distance_km} km</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Drive Time</span>
            <span className="text-xl font-black text-gray-800">
              {Math.floor(routeData.duration_mins / 60)}h {Math.round(routeData.duration_mins % 60)}m
            </span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-emerald-600 block mb-1">Fuel Estimate</span>
            <span className="text-xl font-black text-emerald-700">${fuel.cost}</span>
            <span className="text-[11px] text-emerald-500/70 font-medium leading-tight mt-0.5">{fuel.gallons} Gal</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <button 
            onClick={() => setShowIntermediates(!showIntermediates)}
            className="w-full flex justify-between items-center group"
          >
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest group-hover:underline">
              {showIntermediates ? '▼ Hide Route List' : '▶ View All Passing Cities'}
            </span>
            {citiesLoading && (
              <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            )}
          </button>

          {showIntermediates && (
            <div className="mt-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div className="flex flex-col gap-4 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-blue-200"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm shrink-0"></div>
                  <span className="text-sm font-black text-gray-900">{routeData.sourceName}</span>
                </div>

                {passedCities.map((city, idx) => (
                  <div key={idx} className="flex items-center gap-4 relative z-10">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-blue-400 shadow-sm shrink-0"></div>
                    <span className="text-sm font-bold text-gray-600">{city}</span>
                  </div>
                ))}

                {citiesLoading && passedCities.length === 0 && (
                   <div className="pl-8 text-xs text-gray-400 font-bold italic animate-pulse">Scanning map...</div>
                )}

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm shrink-0"></div>
                  <span className="text-sm font-black text-gray-900">{routeData.destinationName}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}