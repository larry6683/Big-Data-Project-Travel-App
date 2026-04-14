// frontend/components/search/Sidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, X, Calendar } from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface SidebarProps {
  onSearch: (params: any) => void;
  onSearchStart?: () => void; 
  onCancel?: () => void;
  loading?: boolean;
  onClose?: () => void; 
}

const INTEREST_CATEGORIES = [
  { id: 'amenity', label: '🍽️ Dining' },
  { id: 'tourism', label: '📸 Tourism' },
  { id: 'leisure', label: '🌳 Leisure' },
  { id: 'shop', label: '🛍️ Shopping' },
  { id: 'historic', label: '🏛️ Historic' },
  { id: 'transit', label: '🛣️ Transit' }
];

export default function Sidebar({ onSearch, onSearchStart, onCancel, loading, onClose }: SidebarProps) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  
  const [sourceValid, setSourceValid] = useState(false);
  const [destValid, setDestValid] = useState(false);

  const [dates, setDates] = useState({ start: "", end: "" });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelMode, setTravelMode] = useState<"fly" | "drive">("fly");
  const [budget, setBudget] = useState<"budget" | "luxury">("budget");
  const [radius, setRadius] = useState(10);
  const [interests, setInterests] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("search_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSource(parsed.source?.name || "");
        if (parsed.source?.name) setSourceValid(true); 
        
        setDestination(parsed.destination?.name || "");
        if (parsed.destination?.name) setDestValid(true); 
        
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL; 
      const res = await fetch(`${baseUrl}/locations/geocode?keyword=${encodeURIComponent(locationName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon) return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
      }
    } catch (err) {
      console.error(`Failed to fetch coordinates for ${locationName}:`, err);
    }
    return null;
  };

  const handleInterestToggle = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSearchSubmit = async () => {
    let finalSource = source;
    let finalDest = destination;
    let finalSourceValid = sourceValid;
    let finalDestValid = destValid;

    const savedStr = localStorage.getItem("search_state");
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr);
        const savedSource = parsed.source?.name || "";
        const savedDest = parsed.destination?.name || "";

        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');

        if (!finalSourceValid && finalSource.trim() && savedSource && normalize(savedSource).startsWith(normalize(finalSource))) {
          finalSource = savedSource;
          setSource(savedSource); 
          finalSourceValid = true;
          setSourceValid(true);
        }

        if (!finalDestValid && finalDest.trim() && savedDest && normalize(savedDest).startsWith(normalize(finalDest))) {
          finalDest = savedDest;
          setDestination(savedDest); 
          finalDestValid = true;
          setDestValid(true);
        }
      } catch (e) {
        console.error("Failed to parse search state for auto-fill", e);
      }
    }

    const newErrors: Record<string, string> = {};

    if (!finalSource.trim()) newErrors.source = "Source location is required.";
    else if (!finalSourceValid) newErrors.source = "Please select a valid source city from the dropdown.";

    if (!finalDest.trim()) newErrors.destination = "Destination is required.";
    else if (!finalDestValid) newErrors.destination = "Please select a valid destination city from the dropdown.";

    if (finalSourceValid && finalDestValid && finalSource.toLowerCase().trim() === finalDest.toLowerCase().trim()) {
      newErrors.destination = "Destination cannot be the same as source.";
    }

    if (!dates.start) newErrors.start = "Start date is required.";
    if (!dates.end) newErrors.end = "End date is required.";
    
    if (dates.start && dates.end) {
      const startDate = new Date(dates.start + "T12:00:00");
      const endDate = new Date(dates.end + "T12:00:00");
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.start = "Start date cannot be in the past.";
      }
      
      if (startDate >= endDate) {
        newErrors.end = "End date must be at least 1 day after start date.";
      } else {
        const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) newErrors.end = "Trip duration cannot exceed 30 days.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (onSearchStart) onSearchStart(); 

    setIsGeocoding(true);
    const [srcCoords, dstCoords] = await Promise.all([
      getCoordinates(finalSource),
      getCoordinates(finalDest),
    ]);
    setIsGeocoding(false);

    if (!srcCoords) { setErrors({ source: "Could not find coordinates for this city." }); return; }
    if (!dstCoords) { setErrors({ destination: "Could not find coordinates for this city." }); return; }

    const params = {
      source: { name: finalSource, ...srcCoords },
      destination: { name: finalDest, ...dstCoords },
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
  const nightCount = dates.start && dates.end ? Math.max(0, Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / 86400000)) : 0;
  
  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const minEndDate = dates.start ? new Date(new Date(dates.start + "T12:00:00").getTime() + 86400000) : new Date();

  return (
    <>
      <div className="w-[20vw] lg:w-[20vw] min-w-[300px] h-[100dvh] bg-theme-text border-r border-theme-secondary/20 flex flex-col font-sans text-theme-bg">        
        {/* FIXED HEADER */}
        <div className="p-4 border-b border-theme-secondary/20 shadow-md flex justify-between items-start shrink-0">          
          <div>
            <div className="text-2xl font-extrabold text-theme-bg tracking-tight flex items-center gap-2">
              <span className="text-theme-bg">Wanderplan</span><span className="text-theme-primary">US</span>            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-theme-bg/60 hover:text-theme-bg hover:bg-theme-bg/10 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-5 custom-scrollbar pb-6">
          <div>
            <div className="text-[11px] text-theme-bg/70 mb-4">Plan Your Trip</div>
            <SbLabel>Source</SbLabel>
            <LocationAutocomplete 
              placeholder="eg. NEW YORK, NY" 
              value={source} 
              onChange={(val, isValid) => {
                setSource(val);
                setSourceValid(isValid); 
                if (errors.source) setErrors(prev => ({ ...prev, source: "" }));
              }} 
              isDark={false} 
              showGPS={true} 
            />
            {errors.source && <span className="text-red-400 text-[11px] mt-1 block font-medium">{errors.source}</span>}
          </div>

          <div>
            <SbLabel>Destination</SbLabel>
            <LocationAutocomplete 
              placeholder="eg. LOS ANGELES, CA" 
              value={destination} 
              onChange={(val, isValid) => {
                setDestination(val);
                setDestValid(isValid);
                if (errors.destination) setErrors(prev => ({ ...prev, destination: "" }));
              }} 
              isDark={false} 
              showGPS={false} 
            />
            {errors.destination && <span className="text-red-400 text-[11px] mt-1 block font-medium">{errors.destination}</span>}
          </div>

          <div>
            <SbLabel>
              Travel Dates{" "}
              {nightCount > 0 && <span className="font-normal text-theme-bg/60 text-[10.5px]">· {nightCount} night{nightCount !== 1 ? "s" : ""}</span>}
            </SbLabel>
            
            <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[120px] relative">
                <DatePicker
                  selected={dates.start ? new Date(dates.start + "T12:00:00") : null}
                  onChange={(date: Date | null): void => {
                  if (!date) return;
                  const formatted: string = formatDate(date);
                  setDates((d: typeof dates) => ({ ...d, start: formatted }));
                  if (errors.start) setErrors((prev: Record<string, string>) => ({ ...prev, start: "" }));
                  
                  if (dates.end) {
                     const currEnd: Date = new Date(dates.end + "T12:00:00");
                     if (date >= currEnd) {
                      setDates((d: typeof dates) => ({ ...d, start: formatted, end: "" }));
                     }
                  }
                  }}
                  minDate={new Date()}
                  placeholderText="Start..."
                  popperPlacement="bottom-start"
                  className={`w-full py-[9px] pl-8 pr-3 bg-theme-bg border-[1.5px] ${errors.start ? 'border-red-500' : 'border-theme-secondary/30'} rounded-[10px] font-semibold text-[13px] text-theme-text focus:border-theme-secondary focus:ring-1 focus:ring-theme-secondary outline-none`}
                />
                 <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none z-10" />

                {errors.start && <span className="text-red-400 text-[11px] mt-1 block font-medium">{errors.start}</span>}
                </div>
              
              <div className="flex-1 min-w-[120px] relative">
                <DatePicker
                  selected={dates.end ? new Date(dates.end + "T12:00:00") : null}
                  onChange={(date: Date | null) => {
                    if (!date) return;
                    const formatted: string = formatDate(date);
                    setDates((d: typeof dates) => ({ ...d, end: formatted }));
                    if (errors.end) setErrors((prev: Record<string, string>) => ({ ...prev, end: "" }));
                  }}
                  minDate={minEndDate}
                  placeholderText="End..."
                  popperPlacement="bottom-start"
                  className={`w-full py-[9px] pl-8 pr-3 bg-theme-bg border-[1.5px] ${errors.end ? 'border-red-500' : 'border-theme-secondary/30'} rounded-[10px] font-semibold text-[13px] text-theme-text focus:border-theme-secondary focus:ring-1 focus:ring-theme-secondary outline-none`}
                />
                 <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none z-10" />

                {errors.end && <span className="text-red-400 text-[11px] mt-1 block font-medium">{errors.end}</span>}
              </div>
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
            <SbLabel>Budget Category</SbLabel>
            <div className="flex bg-theme-bg rounded-[10px] p-[3px] gap-[3px]">
              {(["budget", "luxury"] as const).map((opt) => (
<<<<<<< Updated upstream
                  <button 
                    key={opt} 
                    onClick={() => setBudget(opt)} 
                    className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${budget === opt ? 'bg-theme-primary font-bold text-theme-bg shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'bg-transparent font-normal text-theme-text/70'}`}
                  >
                    {opt === "budget" ? "💰 Budget" : "✨ Luxury"}
                  </button>
=======
                <button
                  key={opt}
                  onClick={() => setBudget(opt)}
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:bg-theme-primary/80 ${
                    budget === opt
                      ? "bg-theme-primary font-bold text-theme-bg shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                      : "bg-transparent font-normal text-theme-text/70"
                  }`}
                >
                  {opt === "budget" ? "💰 Budget" : "✨ Luxury"}
                </button>
>>>>>>> Stashed changes
              ))}
            </div>
          </div>

          <div>
            <SbLabel>Travel Mode</SbLabel>
            <div className="flex bg-theme-bg rounded-[10px] p-[3px] gap-[3px]">
              {(["fly", "drive"] as const).map((opt) => (
<<<<<<< Updated upstream
                  <button 
                    key={opt} 
                    onClick={() => setTravelMode(opt)} 
                    className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${travelMode === opt ? 'bg-theme-primary font-bold text-theme-bg shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'bg-transparent font-normal text-theme-text/70'}`}
                  >
                    {opt === "fly" ? "✈️ Fly" : "🚗 Drive"}
                  </button>
=======
                <button
                  key={opt}
                  onClick={() => setTravelMode(opt)}
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:bg-theme-primary/80 ${
                    travelMode === opt
                      ? "bg-theme-primary font-bold text-theme-bg shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                      : "bg-transparent font-normal text-theme-text/70"
                  }`}
                >
                  {opt === "fly" ? "✈️ Fly" : "🚗 Drive"}
                </button>
>>>>>>> Stashed changes
              ))}
            </div>
          </div>

          <div>
            <SbLabel>
              Search Radius <span className="font-normal text-theme-bg/60">({radius} mi)</span>
            </SbLabel>
            <input
              type="range" min={1} max={25} step={1} value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full cursor-pointer my-1 accent-theme-primary" 
            />
          </div>

          <div>
            <SbLabel>Interests</SbLabel>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_CATEGORIES.map((category) => (
                  <button
                    key={category.id} 
                    onClick={() => handleInterestToggle(category.id)} 
                    className={`px-2.5 py-1.5 rounded-2xl border-[1.5px] text-xs cursor-pointer transition-all duration-200 ${interests.includes(category.id) ? 'border-theme-secondary bg-theme-secondary/20 text-theme-bg/90' : 'border-theme-secondary/30 bg-transparent text-theme-bg/70 hover:text-theme-bg hover:border-theme-secondary/60'}`}
                  >
                    {category.label}
                  </button>
              ))}
            </div>
          </div>
        </div>

        {/* FIXED FOOTER WITH SUBMIT BUTTON */}
        <div className="p-4 bg-theme-text border-t border-theme-secondary/20 shrink-0">
          {!isWorking ? (
            <button 
<<<<<<< Updated upstream
              className="w-full p-4 rounded-2xl bg-theme-primary text-theme-bg text-sm font-bold flex items-center justify-center gap-2 hover:bg-theme-secondary transition-all shadow-[0_4px_15px_rgba(0,0,0,0.25)] active:scale-[0.98]"
=======
              id="submit-side" className="w-full p-4 rounded-2xl bg-theme-primary text-theme-bg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-85 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.25)] active:scale-[0.98]"
>>>>>>> Stashed changes
              onClick={handleSearchSubmit} 
            >
              <Search size={17} /> SUBMIT
            </button>
          ) : (
            <div className="flex gap-2 h-[52px]">
              <div className="flex-1 rounded-2xl bg-theme-text border border-theme-secondary/40 text-theme-bg/80 font-bold flex items-center justify-center gap-2">
                <Loader2 size={17} className="animate-spin text-theme-muted" />
                <span className="text-xs tracking-wider">GATHERING...</span>
              </div>
              <button 
                onClick={onCancel}
                title="Cancel Search"
                className="w-[52px] rounded-2xl bg-red-500/90 hover:bg-theme-primary/80 text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SbLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-bg/70 mb-1.5 ml-1">{children}</div>;
}

function SbCounter({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2.5 bg-theme-bg p-1 rounded-[10px] border-[1.5px] border-theme-secondary/30 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <button className="w-[30px] h-[30px] border-[1.5px] border-theme-secondary/30 rounded-lg bg-theme-bg text-theme-text text-[17px] cursor-pointer hover:bg-theme-secondary/10 transition-colors" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="flex-1 font-bold text-sm text-theme-text text-center">{value}</span>
      <button className="w-[30px] h-[30px] border-[1.5px] border-theme-secondary/30 rounded-lg bg-theme-bg text-theme-text text-[17px] cursor-pointer hover:bg-theme-secondary/10 transition-colors" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}