// larry6683/big-data-project-travel-app/frontend/components/results/DrivingCard.tsx

"use client";

import React, { useState, useEffect } from 'react';

export default function DrivingCard({ drivingData, loading: parentLoading }: { drivingData?: any, loading?: boolean }) {
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(parentLoading || false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSelected, setIsSelected] = useState<boolean>(false);
  
  const [passedCities, setPassedCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState<boolean>(false);
  
  // State for showing the intermediates list
  const [showIntermediates, setShowIntermediates] = useState<boolean>(false); 

  const stateAbbr: Record<string, string> = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
  };

  // 🌟 FIX: Load the saved intermediates state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('drive_intermediates_open');
    if (savedState === 'true') {
      setShowIntermediates(true);
    }
  }, []);

  // Check localStorage on mount to see if the drive route was previously selected
  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.drive && tripState.drive.selected) {
          setIsSelected(true);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    const loadRouteData = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchStateStr = localStorage.getItem('search_state');
        let sName = "Origin";
        let dName = "Destination";
        let searchState: any = null;

        if (searchStateStr) {
          searchState = JSON.parse(searchStateStr);
          sName = searchState.source?.name || "Origin";
          dName = searchState.destination?.name || "Destination";
        }

        const cachedTripStr = sessionStorage.getItem('current_trip_results');
        let cachedTrip = cachedTripStr ? JSON.parse(cachedTripStr) : null;

        if (drivingData && Object.keys(drivingData).length > 0) {
          setRouteData({
            ...drivingData,
            sourceName: sName,
            destinationName: dName
          });
          
          if (cachedTrip?.drivingData?.passedCities) {
            setPassedCities(cachedTrip.drivingData.passedCities);
          }
          
          setLoading(false);
          return;
        }

        if (!searchState) throw new Error("No search state found.");

        if (cachedTrip?.drivingData) {
          setRouteData(cachedTrip.drivingData);
          if (cachedTrip.drivingData.passedCities) {
            setPassedCities(cachedTrip.drivingData.passedCities);
          }
          setLoading(false);
          return;
        }

        const { source, destination } = searchState;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

        const response = await fetch(
          `${baseUrl}/driving/route?origin_lat=${source.lat}&origin_lon=${source.lon}&dest_lat=${destination.lat}&dest_lon=${destination.lon}`
        );

        if (!response.ok) throw new Error("Failed to fetch driving route.");

        const data = await response.json();
        const finalRouteData = {
          ...data,
          sourceName: sName,
          destinationName: dName
        };

        if (cachedTrip) {
          cachedTrip.drivingData = finalRouteData;
          sessionStorage.setItem('current_trip_results', JSON.stringify(cachedTrip));
        }
        
        setRouteData(finalRouteData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadRouteData();
  }, [drivingData]);

  useEffect(() => {
    if (routeData?.geometry?.coordinates && passedCities.length === 0 && !citiesLoading) {
      const cachedTripStr = sessionStorage.getItem('current_trip_results');
      const cachedTrip = cachedTripStr ? JSON.parse(cachedTripStr) : null;

      if (cachedTrip?.drivingData?.passedCities) {
         setPassedCities(cachedTrip.drivingData.passedCities);
      } else {
         fetchIntermediates();
      }
    }
  }, [routeData]);

const fetchIntermediates = async () => {
    if (citiesLoading || !routeData?.geometry?.coordinates) return;

    setCitiesLoading(true);
    const coords = routeData.geometry.coordinates;
    const citiesFound: string[] = [];

    const step = Math.max(1, Math.floor(coords.length / 40));
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];

    for (let i = step; i < coords.length - step; i += step) {
      const [lon, lat] = coords[i];

      const distToStart = Math.sqrt(Math.pow(lon - startCoord[0], 2) + Math.pow(lat - startCoord[1], 2));
      const distToEnd = Math.sqrt(Math.pow(lon - endCoord[0], 2) + Math.pow(lat - endCoord[1], 2));

      if (distToStart < 0.08 || distToEnd < 0.08) {
        continue; 
      }

      try {
        const res = await fetch(`${baseUrl}/locations/nearest?lat=${lat}&lon=${lon}`);
        if (res.ok) {
          const data = await res.json();

          const cityName = data.city;
          const stateName = data.state;
          const stateDisplay = stateName ? (stateAbbr[stateName] || stateName) : "";
          const fullLabel = stateDisplay ? `${cityName}, ${stateDisplay}` : cityName;

          const sNameLower = (routeData.sourceName || "").toLowerCase().split(',')[0].trim();
          const dNameLower = (routeData.destinationName || "").toLowerCase().split(',')[0].trim();
          const cityLower = (cityName || "").toLowerCase().trim();

          const isSourceOrDest = sNameLower === cityLower || dNameLower === cityLower;

          if (cityName && cityName !== "Unknown" && !citiesFound.includes(fullLabel) && !isSourceOrDest) {
            citiesFound.push(fullLabel);
          }
        }
      } catch (e) {
        console.error("Geocoding error", e);
      }
    }

    setPassedCities(citiesFound);
    
    const cachedTripStr = sessionStorage.getItem('current_trip_results');
    if (cachedTripStr) {
      const cachedTrip = JSON.parse(cachedTripStr);
      if (!cachedTrip.drivingData) {
        cachedTrip.drivingData = routeData || {};
      }
      cachedTrip.drivingData.passedCities = citiesFound;
      sessionStorage.setItem('current_trip_results', JSON.stringify(cachedTrip));
    }
    
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

  // 🌟 FIX: Toggles the state and saves it directly to sessionStorage
  const toggleIntermediates = () => {
    const newState = !showIntermediates;
    setShowIntermediates(newState);
    sessionStorage.setItem('drive_intermediates_open', String(newState));
  };

  if (loading) return null; 
  if (!routeData) return null;

  const fuel = calculateFuel(routeData.distance_km);

  return (
    <div className="flex flex-col gap-4">
      <div className={`bg-white rounded-xl overflow-hidden border p-5 transition-all duration-200 ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg bg-blue-50/10' : 'border-gray-200 shadow-sm'}`}>

        <div className="mb-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Road Trip Journey</h3>

                <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm shrink-0">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleDriveSelection()} 
                    className="w-4 h-4 accent-blue-600 cursor-pointer" 
                  />
                  <span className="text-xs font-bold text-gray-700 select-none">
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </label>

          </div>
          
          <div className="flex items-center gap-2 text-sm font-bold mt-1">
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-lg shadow-sm">
              {routeData.sourceName}
            </span>
            <span className="text-gray-400 text-lg">➔</span>
            <span className="bg-red-50 text-red-800 border border-red-200 px-3 py-1 rounded-lg shadow-sm">
              {routeData.destinationName}
            </span>
          </div>
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
            onClick={toggleIntermediates} // 🌟 UPDATED to use the new toggle function
            className="w-full flex justify-between items-center group mb-2"
          >
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest group-hover:underline">
              {showIntermediates ? '▼ Hide Route List' : '▶ View All Passing Cities'}
            </span>
            {citiesLoading && (
              <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            )}
          </button>

          {showIntermediates && (
            <div className="mt-4 bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="relative flex flex-col gap-6 ml-2">
                
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-blue-200"></div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-blue-600 border-[3px] border-white shadow-sm ring-2 ring-blue-200 shrink-0"></div>
                  <span className="text-base font-black text-gray-900">{routeData.sourceName}</span>
                </div>

                {passedCities.map((city, idx) => (
                  <div key={idx} className="relative z-10 flex items-center gap-4">
                    <div className="w-3 h-3 ml-[2px] rounded-full bg-white border-[3px] border-blue-300 shadow-sm shrink-0"></div>
                    <span className="text-sm font-bold text-gray-600">{city}</span>
                  </div>
                ))}

                {citiesLoading && passedCities.length === 0 && (
                  <div className="pl-8 text-xs text-gray-400 font-bold italic animate-pulse">Scanning route...</div>
                )}

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-[3px] border-white shadow-sm ring-2 ring-red-200 shrink-0"></div>
                  <span className="text-base font-black text-gray-900">{routeData.destinationName}</span>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}