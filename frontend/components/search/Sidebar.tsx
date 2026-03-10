// larry6683/big-data-project-travel-app/frontend/components/search/Sidebar.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";

interface SidebarProps {
  onSearch: (params: any) => void;
  loading?: boolean;
  onClose?: () => void; // called when the mobile ✕ button is pressed
}

const INTEREST_CATEGORIES = [
  { id: 'amenity', label: '🍽️ Dining' },
  { id: 'tourism', label: '📸 Tourism' },
  { id: 'leisure', label: '🌳 Leisure' },
  { id: 'shop', label: '🛍️ Shopping' },
  { id: 'historic', label: '🏛️ Historic' },
  { id: 'transit', label: '🛣️ Transit' }
];

export default function Sidebar({ onSearch, loading, onClose }: SidebarProps) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState({ start: "", end: "" });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelMode, setTravelMode] = useState<"fly" | "drive">("fly");
  const [budget, setBudget] = useState<"budget" | "luxury">("budget");
  const [radius, setRadius] = useState(10);
  const [interests, setInterests] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("search_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSource(parsed.source?.name || "");
        setDestination(parsed.destination?.name || "");
        setDates({ start: parsed.startDate || "", end: parsed.endDate || "" });
        setAdults(parsed.adults || 1);
        setChildren(parsed.children || 0);
        setTravelMode(parsed.travelMode || "fly");
        setBudget(parsed.budget || "budget");
        setRadius(parsed.radius || 10);
        setInterests(parsed.interests || []);
      } catch (e) {
        console.error("Failed to parse existing search state from localStorage", e);
      }
    }
  }, []);

  const getCoordinates = async (locationName: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${baseUrl}/locations/geocode?keyword=${encodeURIComponent(locationName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon) {
          return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
        }
      }
    } catch (err) {
      console.error(`Failed to fetch coordinates for ${locationName}:`, err);
    }
    return null;
  };

  const handleInterestToggle = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = async () => {
    if (!source || !destination || !dates.start || !dates.end) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsGeocoding(true);
    const [srcCoords, dstCoords] = await Promise.all([
      getCoordinates(source),
      getCoordinates(destination),
    ]);
    setIsGeocoding(false);

    const params = {
      source: { name: source, ...(srcCoords || {}) },
      destination: { name: destination, ...(dstCoords || {}) },
      startDate: dates.start,
      endDate: dates.end,
      adults,
      children,
      travelMode,
      budget,
      radius,
      interests,
    };

    localStorage.setItem("search_state", JSON.stringify(params));
    onSearch(params);
  };

  const isWorking = loading || isGeocoding;

  const nightCount = dates.start && dates.end
    ? Math.max(0, Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / 86400000))
    : 0;

  return (
    <>


      <div className="w-[80vw] max-w-[320px] lg:w-[20vw] lg:max-w-none h-screen bg-slate-900 border-r border-slate-200/10 px-[18px] py-6 flex flex-col gap-5 font-sans overflow-y-auto text-white">
        
        {/* Header row */}
        <div className="pb-2.5 border-b border-slate-800 flex justify-between items-start">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              WanderPlan <span className="text-indigo-600">US</span>
            </div>
            <div className="text-[11px] text-[#c2c2c2] mt-1">Plan Your Trip</div>
          </div>

          {/* Close button — only visible on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div>
          <SbLabel>Departure From</SbLabel>
          <LocationAutocomplete placeholder="eg. NEW YORK, NY" value={source} onChange={setSource} isDark={false} showGPS={true} />
        </div>

        <div>
          <SbLabel>Destination To</SbLabel>
          <LocationAutocomplete placeholder="eg. LOS ANGELES, CA" value={destination} onChange={setDestination} isDark={false} showGPS={false} />
        </div>

        <div>
          <SbLabel>
            Travel Dates{" "}
            {nightCount > 0 && <span className="font-normal text-slate-400 text-[10.5px]">· {nightCount} night{nightCount !== 1 ? "s" : ""}</span>}
          </SbLabel>
          <div className="flex flex-col gap-2">
            <input
              type="date" 
              value={dates.start}
              onChange={e => setDates(d => ({ ...d, start: e.target.value }))}
              className="w-full py-[9px] px-3 bg-white border-[1.5px] border-slate-200 rounded-[10px] font-inherit text-[13px] text-slate-900 focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-600/12 outline-none transition-all duration-150"
            />
            <input
              type="date" 
              value={dates.end}
              onChange={e => setDates(d => ({ ...d, end: e.target.value }))}
              className="w-full py-[9px] px-3 bg-white border-[1.5px] border-slate-200 rounded-[10px] font-inherit text-[13px] text-slate-900 focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-600/12 outline-none transition-all duration-150"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="flex-1 basis-[120px]">
            <SbLabel>Adults</SbLabel>
            <SbCounter value={adults} min={1} max={9} onChange={setAdults} />
          </div>
          <div className="flex-1 basis-[120px]">
            <SbLabel>Children</SbLabel>
            <SbCounter value={children} min={0} max={9} onChange={setChildren} />
          </div>
        </div>

        <div>
          <SbLabel>Travel Mode</SbLabel>
          <div className="flex bg-slate-100 rounded-[10px] p-[3px] gap-[3px]">
            {(["fly", "drive"] as const).map((opt) => {
              const active = travelMode === opt;
              return (
                <button 
                  key={opt} 
                  onClick={() => setTravelMode(opt)} 
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${active ? 'bg-white font-bold text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'bg-transparent font-normal text-slate-500'}`}
                >
                  {opt === "fly" ? "✈️ Fly" : "🚗 Drive"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SbLabel>Budget Category</SbLabel>
          <div className="flex bg-slate-100 rounded-[10px] p-[3px] gap-[3px]">
            {(["budget", "luxury"] as const).map((opt) => {
              const active = budget === opt;
              return (
                <button 
                  key={opt} 
                  onClick={() => setBudget(opt)} 
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${active ? 'bg-white font-bold text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'bg-transparent font-normal text-slate-500'}`}
                >
                  {opt === "budget" ? "💰 Budget" : "✨ Luxury"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SbLabel>
            Search Radius{" "}
            <span className="font-normal text-slate-500">({radius} mi)</span>
          </SbLabel>
          <input
            type="range" min={1} max={25} step={1} value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full cursor-pointer my-1 accent-indigo-600" 
          />
          <div className="flex justify-between text-[10.5px] text-slate-500">
            <span>1 mi</span><span>25 mi</span>
          </div>
        </div>

        <div>
          <SbLabel>Interests</SbLabel>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_CATEGORIES.map((category) => {
              const active = interests.includes(category.id);
              return (
                <button
                  key={category.id} 
                  onClick={() => handleInterestToggle(category.id)} 
                  className={`px-2.5 py-1.5 rounded-2xl border-[1.5px] text-xs cursor-pointer transition-all duration-200 ${active ? 'border-indigo-600 bg-indigo-600/15 text-indigo-600' : 'border-slate-700 bg-transparent text-slate-400'}`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          className={`w-full p-4 rounded-2xl border-none font-inherit text-sm font-bold flex items-center justify-center gap-2 mt-auto transition-all duration-150 ${isWorking ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white cursor-pointer shadow-[0_4px_15px_rgba(37,99,235,0.3)] hover:bg-indigo-600 active:scale-[0.98]'}`}
          onClick={handleSearchSubmit} 
          disabled={isWorking}
        >
          {isWorking ? (
            <><Loader2 size={17} className="animate-spin" /> Gathering Details...</>
          ) : (
            <><Search size={17} /> SUBMIT</>
          )}
        </button>
      </div>
    </>
  );
}

function SbLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#c6c6c6] mb-1.5 ml-1">
      {children}
    </div>
  );
}

function SbCounter({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2.5 bg-white p-1 rounded-[10px] border-[1.5px] border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <button 
        className="w-[30px] h-[30px] border-[1.5px] border-slate-200 rounded-lg bg-white text-slate-700 text-[17px] cursor-pointer flex items-center justify-center font-mono shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors duration-150 hover:bg-slate-100" 
        onClick={() => onChange(Math.max(min, value - 1))}
      >−</button>
      <span className="flex-1 font-bold text-sm text-slate-900 text-center">{value}</span>
      <button 
        className="w-[30px] h-[30px] border-[1.5px] border-slate-200 rounded-lg bg-white text-slate-700 text-[17px] cursor-pointer flex items-center justify-center font-mono shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors duration-150 hover:bg-slate-100"
        onClick={() => onChange(Math.min(max, value + 1))}
      >+</button>
    </div>
  );
}