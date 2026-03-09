// larry6683/big-data-project-travel-app/frontend/components/layout/Sidebar.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";

interface SidebarProps {
  onSearch: (params: any) => void;
  loading?: boolean;
}

const INTEREST_CATEGORIES = [
  { id: 'amenity', label: '🍽️ Dining' },
  { id: 'tourism', label: '📸 Tourism' },
  { id: 'leisure', label: '🌳 Leisure' },
  { id: 'shop', label: '🛍️ Shopping' },
  { id: 'historic', label: '🏛️ Historic' },
  { id: 'transit', label: '🛣️ Transit' }
];

export default function Sidebar({ onSearch, loading }: SidebarProps) {
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
    // Swapped Cookies.get for localStorage.getItem
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
      // Pointing to the new safe backend proxy route that uses Open-Meteo
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${baseUrl}/locations/geocode?keyword=${encodeURIComponent(locationName)}`);
      
      if (res.ok) {
        const data = await res.json();
        // Return coordinates if found by the backend
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
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = async () => {
    if (!source || !destination || !dates.start || !dates.end) {
      alert("Please fill in all location and date fields.");
      return;
    }
    setIsGeocoding(true);
    
    const sourceCoords = await getCoordinates(source);
    const destCoords = await getCoordinates(destination);
    
    if (!sourceCoords || !destCoords) {
      alert("Could not find exact coordinates for one or both locations. Please select a valid city from the dropdown.");
      setIsGeocoding(false);
      return;
    }

    const numNights = Math.ceil(Math.abs(new Date(dates.end).getTime() - new Date(dates.start).getTime()) / 86400000);
    const searchState = {
      source: { name: source, ...sourceCoords },
      destination: { name: destination, ...destCoords },
      startDate: dates.start,
      endDate: dates.end,
      numNights,
      adults,
      children,
      travelMode,
      budget,
      radius,
      interests, 
      timestamp: new Date().toISOString(),
    };
    
    // Swapped Cookies.set for localStorage.setItem
    localStorage.setItem("search_state", JSON.stringify(searchState));
    
    setIsGeocoding(false);
    onSearch(searchState);
  };

  const isWorking = loading || isGeocoding;
  const nightCount = dates.start && dates.end
    ? Math.max(0, Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / 86400000))
    : 0;

  return (
    <>
      <style>{`
        @keyframes sbSpin { to { transform: rotate(360deg); } }
        .sb-input-date { transition: border-color 0.15s, box-shadow 0.15s; }
        .sb-input-date:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; outline: none; }
        .sb-select:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important; outline: none; }
        .sb-count-btn:hover { background: #f1f5f9 !important; }
        .sb-submit:hover:not(:disabled) { background: #1d4ed8 !important; }
        .sb-submit:active:not(:disabled) { transform: scale(0.98); }
        .sb-range { accent-color: #2563eb; }
        .sb-range::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #2563eb; cursor: pointer; box-shadow: 0 1px 4px rgba(37,99,235,0.4); }
        .sb-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #2563eb; cursor: pointer; border: none; }
        .sb-toggle-btn { transition: all 0.15s; }
        .sb-toggle-btn:hover { opacity: 0.85; }
        .sb-interest-btn { transition: all 0.2s; }
      `}</style>

      <div className="w-80" style={{
        minHeight: "100vh",
        background: "#0f172a",
        borderRight: "1px solid #e8edf4",
        padding: "24px 18px",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column", gap: "20px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflowY: "auto",
        color: "#ffffff"
      }}>

        <div style={{ paddingBottom: "10px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px", display: "flex", alignItems:"center", gap:"8px" }}>
            <div className="bg-blue-100 p-1.5 rounded-lg border border-blue-200"><Search size={16} className="text-blue-600" /></div>
            WanderPlan <span style={{ color: "#2563eb" }}>US</span>
          </div>
          <div style={{ fontSize: "11px", color: "#c2c2c2", marginTop: "4px" }}>Plan Your Trip</div>
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
            {nightCount > 0 && <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "10.5px" }}>· {nightCount} night{nightCount !== 1 ? "s" : ""}</span>}
          </SbLabel>
          <div style={{ display: "flex", gap: "7px" }}>
            {[
              { val: dates.start, key: "start" },
              { val: dates.end, key: "end" },
            ].map(({ val, key }) => (
              <input
                key={key} type="date" value={val} onChange={(e) => setDates({ ...dates, [key]: e.target.value })}
                className="sb-input-date"
                style={{
                  width: "100%", padding: "10px 12px", fontFamily: "inherit", fontSize: "13px",
                  background: "#fff", color: "#1a202c", border: "1.5px solid #e2e8f0", borderRadius: "10px",
                  boxSizing: "border-box", cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1}}>
            <SbLabel>Adults</SbLabel>
            <SbCounter value={adults} min={1} max={9} onChange={setAdults} />
          </div>
          <div style={{ flex: 1}}>
            <SbLabel>Children</SbLabel>
            <SbCounter value={children} min={0} max={9} onChange={setChildren} />
          </div>
        </div>

        <div>
          <SbLabel>Travel Mode</SbLabel>
          <div style={{ display: "flex", background: "#e8edf4", borderRadius: "10px", padding: "3px", gap: "3px" }}>
            {(["fly", "drive"] as const).map((opt) => {
              const active = travelMode === opt;
              return (
                <button key={opt} className="sb-toggle-btn" onClick={() => setTravelMode(opt)} style={{
                  flex: 1, padding: "7px 0", borderRadius: "8px", border: "none",
                  background: active ? "#fff" : "transparent",
                  fontFamily: "inherit", fontSize: "12.5px", fontWeight: active ? 700 : 400,
                  color: active ? "#1a202c" : "#64748b", cursor: "pointer",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}>
                  {opt === "fly" ? "✈️ Fly" : "🚗 Drive"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SbLabel>Budget Category</SbLabel>
          <div style={{ display: "flex", background: "#e8edf4", borderRadius: "10px", padding: "3px", gap: "3px" }}>
            {(["budget", "luxury"] as const).map((opt) => {
              const active = budget === opt;
              return (
                <button key={opt} className="sb-toggle-btn" onClick={() => setBudget(opt)} style={{
                  flex: 1, padding: "7px 0", borderRadius: "8px", border: "none",
                  background: active ? "#fff" : "transparent",
                  fontFamily: "inherit", fontSize: "12.5px", fontWeight: active ? 700 : 400,
                  color: active ? "#1a202c" : "#64748b", cursor: "pointer",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}>
                  {opt === "budget" ? "💰 Budget" : "✨ Luxury"}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SbLabel>
            Search Radius{" "}
            <span style={{ fontWeight: 400, color: "#64748b" }}>({radius} mi)</span>
          </SbLabel>
          <input
            type="range" min={1} max={25} step={1} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))}
            className="sb-range" style={{ width: "100%", cursor: "pointer", margin: "4px 0" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#64748b" }}>
            <span>1 mi</span><span>25 mi</span>
          </div>
        </div>

        <div>
          <SbLabel>Interests</SbLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {INTEREST_CATEGORIES.map((category) => {
              const active = interests.includes(category.id);
              return (
                <button
                  key={category.id} onClick={() => handleInterestToggle(category.id)} className="sb-interest-btn"
                  style={{
                    padding: "6px 10px", borderRadius: "16px",
                    border: active ? "1.5px solid #3b82f6" : "1.5px solid #334155",
                    background: active ? "rgba(59, 130, 246, 0.15)" : "transparent",
                    color: active ? "#60a5fa" : "#94a3b8", fontSize: "12px", cursor: "pointer"
                  }}
                >
                  {category.label}
                </button>
              )
            })}
          </div>
        </div>

        <button className="sb-submit mt-auto" onClick={handleSearchSubmit} disabled={isWorking} style={{
          width: "100%", padding: "16px", background: isWorking ? "#94a3b8" : "#2563eb",
          color: "#fff", border: "none", borderRadius: "16px", fontFamily: "inherit", fontSize: "14px", fontWeight: 700,
          cursor: isWorking ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          boxShadow: isWorking ? "none" : "0 4px 15px rgba(37,99,235,0.3)", transition: "background 0.15s, box-shadow 0.15s, transform 0.1s",
        }}>
          {isWorking ? (
            <><Loader2 size={17} style={{ animation: "sbSpin 0.7s linear infinite" }} /> Gathering Details...</>
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
    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#c6c6c6", marginBottom: "6px", marginLeft: "4px" }}>
      {children}
    </div>
  );
}

function SbCounter({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", padding:"4px", borderRadius:"10px", border:"1.5px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <button className="sb-count-btn" onClick={() => onChange(Math.max(min, value - 1))} style={countBtnStyle}>−</button>
      <span style={{ flex: 1, fontWeight: 700, fontSize: "14px", color: "#1a202c", textAlign: "center" }}>{value}</span>
      <button className="sb-count-btn" onClick={() => onChange(Math.min(max, value + 1))} style={countBtnStyle}>+</button>
    </div>
  );
}

const countBtnStyle: React.CSSProperties = {
  width: "30px", height: "30px", border: "1.5px solid #e2e8f0", borderRadius: "8px",
  background: "#fff", color: "#374151", fontSize: "17px", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "background 0.12s",
};