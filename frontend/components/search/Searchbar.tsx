"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Calendar, TrendingUp } from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { travelApi } from "../../services/api";

const stateAbbreviations: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

interface SearchBarProps {
  onSearch: (params: any) => void;
  onSearchStart?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  isCompact?: boolean; 
}

export default function SearchBar({
  onSearch,
  onSearchStart,
  onCancel,
  loading,
  isCompact = false,
}: SearchBarProps) {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [sourceValid, setSourceValid] = useState(false);
  const [destValid, setDestValid] = useState(false);
  const [dates, setDates] = useState({ start: "", end: "" });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelMode, setTravelMode] = useState<"fly" | "drive">("fly");
  const [budget, setBudget] = useState<"budget" | "Premium">("budget");
  const [radius, setRadius] = useState(10);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topDestinations, setTopDestinations] = useState<any[]>([]);

  const refreshTrending = async () => {
    const data = await travelApi.getTopDestinations();
    if (data && data.length > 0) {
      setTopDestinations(data);
    }
  };

  useEffect(() => {
    refreshTrending();
  }, []);

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
      } catch (e) {
        console.error("Failed to parse existing search state", e);
      }
    }
  }, []);

  const getCoordinates = async (locationName: string, isDestination: boolean = false) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${baseUrl}/locations/geocode?keyword=${encodeURIComponent(
        locationName
      )}${isDestination ? "&is_destination=true" : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon) return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
      }
    } catch (err) {
      console.error(`Failed to fetch coordinates for ${locationName}:`, err);
    }
    return null;
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
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");

        if (!finalSourceValid && finalSource.trim() && savedSource && normalize(savedSource).startsWith(normalize(finalSource))) {
          finalSource = savedSource; setSource(savedSource); finalSourceValid = true; setSourceValid(true);
        }
        if (!finalDestValid && finalDest.trim() && savedDest && normalize(savedDest).startsWith(normalize(finalDest))) {
          finalDest = savedDest; setDestination(savedDest); finalDestValid = true; setDestValid(true);
        }
      } catch (e) {}
    }

    const newErrors: Record<string, string> = {};
    if (!finalSource.trim()) newErrors.source = "Required.";
    else if (!finalSourceValid) newErrors.source = "Select valid city.";

    if (!finalDest.trim()) newErrors.destination = "Required.";
    else if (!finalDestValid) newErrors.destination = "Select valid city.";

    if (finalSourceValid && finalDestValid && finalSource.toLowerCase().trim() === finalDest.toLowerCase().trim()) {
      newErrors.destination = "Cannot be same as source.";
    }

    if (!dates.start) newErrors.start = "Required.";
    if (!dates.end) newErrors.end = "Required.";

    if (dates.start && dates.end) {
      const startDate = new Date(dates.start + "T12:00:00");
      const endDate = new Date(dates.end + "T12:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) newErrors.start = "Cannot be in past.";
      if (startDate >= endDate) newErrors.end = "Must be after start.";
      else {
        const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) newErrors.end = "Max 30 days.";
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
      getCoordinates(finalDest, true),
    ]);
    setIsGeocoding(false);

    refreshTrending();

    if (!srcCoords) {
      setErrors({ source: "Could not find coordinates." });
      return;
    }
    if (!dstCoords) {
      setErrors({ destination: "Could not find coordinates." });
      return;
    }

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
      interests: [],
    };

    localStorage.setItem("search_state", JSON.stringify(params));
    onSearch(params);
  };

  const isWorking = loading || isGeocoding;
  const nightCount = dates.start && dates.end
    ? Math.max(0, Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / 86400000))
    : 0;

  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const minEndDate = dates.start ? new Date(new Date(dates.start + "T12:00:00").getTime() + 86400000) : new Date();

  return (
    <div className="w-full bg-theme-text border-b border-theme-secondary/20 font-sans text-theme-bg shadow-xl z-30">
      <div className={`px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto flex flex-col ${isCompact ? 'py-4 gap-3' : 'py-6 md:py-8 gap-5 md:gap-6'}`}>
        
        {/* ROW 1: Core Inputs (Always Visible) */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-end relative z-10">
          <div className="w-full lg:flex-[1.2] relative">
            <SbLabel>Source</SbLabel>
            <LocationAutocomplete
              id="source-input"
              placeholder="eg. NEW YORK, NY"
              value={source}
              onChange={(val, isValid) => {
                setSource(val); setSourceValid(isValid);
                if (errors.source) setErrors((prev) => ({ ...prev, source: "" }));
              }}
              isDark={false}
              showGPS={true}
            />
            {errors.source && <span className="absolute -bottom-5 left-1 text-red-400 text-[11px] font-bold">{errors.source}</span>}
          </div>

          <div className="w-full lg:flex-[1.2] relative">
            <SbLabel>Destination</SbLabel>
            <LocationAutocomplete
              placeholder="eg. LOS ANGELES, CA"
              value={destination}
              onChange={(val, isValid) => {
                setDestination(val); setDestValid(isValid);
                if (errors.destination) setErrors((prev) => ({ ...prev, destination: "" }));
              }}
              isDark={false}
              showGPS={false}
            />
            {errors.destination && <span id="destination_error" className="absolute -bottom-5 left-1 text-red-400 text-[11px] font-bold">{errors.destination}</span>}
          </div>

          <div className="w-full lg:flex-[1.5] relative">
            <SbLabel>
              Travel Dates {nightCount > 0 && <span className="font-normal text-theme-bg/60 text-[11px] ml-1">· {nightCount} night{nightCount !== 1 ? "s" : ""}</span>}
            </SbLabel>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <DatePicker
                  selected={dates.start ? new Date(dates.start + "T12:00:00") : null}
                  onChange={(date: Date | null): void => {
                    if (!date) return;
                    const formatted: string = formatDate(date);
                    setDates((d) => ({ ...d, start: formatted }));
                    if (errors.start) setErrors((prev) => ({ ...prev, start: "" }));
                    if (dates.end && date >= new Date(dates.end + "T12:00:00")) {
                      setDates((d) => ({ ...d, start: formatted, end: "" }));
                    }
                  }}
                  minDate={new Date()}
                  placeholderText="Start Date"
                  popperPlacement="bottom-start"
                  className={`w-full h-[52px] pl-10 pr-3 bg-theme-bg border-[1.5px] ${errors.start ? "border-red-500" : "border-theme-secondary/30"} rounded-xl font-semibold text-[14px] text-theme-text focus:border-theme-primary focus:ring-1 focus:ring-theme-primary outline-none shadow-sm`}
                />
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none" />
              </div>
              <div className="flex-1 relative">
                <DatePicker
                  selected={dates.end ? new Date(dates.end + "T12:00:00") : null}
                  onChange={(date: Date | null) => {
                    if (!date) return;
                    setDates((d) => ({ ...d, end: formatDate(date) }));
                    if (errors.end) setErrors((prev) => ({ ...prev, end: "" }));
                  }}
                  minDate={minEndDate}
                  placeholderText="End Date"
                  popperPlacement="bottom-end"
                  className={`w-full h-[52px] pl-10 pr-3 bg-theme-bg border-[1.5px] ${errors.end ? "border-red-500" : "border-theme-secondary/30"} rounded-xl font-semibold text-[14px] text-theme-text focus:border-theme-primary focus:ring-1 focus:ring-theme-primary outline-none shadow-sm`}
                />
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none" />
              </div>
            </div>
            {(errors.start || errors.end) && (
              <span className="absolute -bottom-5 left-1 text-red-400 text-[11px] font-bold">{errors.start || errors.end}</span>
            )}
          </div>

          <div className="w-full lg:w-[160px] flex mt-4 lg:mt-0">
            {!isWorking ? (
              <button
                id="submit-side"
                className="w-full h-[52px] rounded-xl bg-theme-primary text-theme-bg text-[15px] font-black tracking-wider flex items-center justify-center gap-2 hover:bg-theme-secondary transition-all shadow-md active:scale-95"
                onClick={handleSearchSubmit}
              >
                <Search size={18} /> SEARCH
              </button>
            ) : (
              <div className="w-full h-[52px] rounded-xl bg-theme-text border border-theme-secondary/40 text-theme-bg/80 font-black flex items-center justify-center gap-2 shadow-inner">
                <Loader2 size={18} className="animate-spin text-theme-muted" />
                <span className="text-xs tracking-widest uppercase">Working...</span>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Secondary Options (Hidden if isCompact === true) */}
        {!isCompact && (
          <div className="flex flex-col xl:flex-row justify-between gap-5 pt-4 border-t border-theme-secondary/20 relative z-0">
            <div className="flex flex-wrap gap-5 lg:gap-8 items-center">
              
              {/* Passengers */}
              <div className="flex gap-4">
                <div>
                  <SbLabel>Adults</SbLabel>
                  <SbCounter value={adults} min={1} max={9} onChange={setAdults} />
                </div>
                <div>
                  <SbLabel>Children</SbLabel>
                  <SbCounter value={children} min={0} max={9} onChange={setChildren} />
                </div>
              </div>

              {/* Budget Toggle */}
              <div className="w-[190px]">
                <SbLabel>Budget Category</SbLabel>
                <div className="flex bg-theme-bg rounded-xl p-[4px] shadow-inner gap-1 border border-theme-surface">
                  {(["budget", "Premium"] as const).map((opt) => (
                    <button key={opt} onClick={() => setBudget(opt)} className={`flex-1 py-2 rounded-lg text-xs transition-all ${budget === opt ? "bg-theme-primary font-black tracking-wider text-theme-bg shadow-sm" : "bg-transparent font-bold text-theme-text/70 hover:text-theme-text hover:bg-theme-secondary/5"}`}>
                      {opt === "budget" ? "💰 Budget" : "✨ Premium"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="w-[170px]">
                <SbLabel>Travel Mode</SbLabel>
                <div className="flex bg-theme-bg rounded-xl p-[4px] shadow-inner gap-1 border border-theme-surface">
                  {(["fly", "drive"] as const).map((opt) => (
                    <button key={opt} onClick={() => setTravelMode(opt)} className={`flex-1 py-2 rounded-lg text-xs transition-all ${travelMode === opt ? "bg-theme-primary font-black tracking-wider text-theme-bg shadow-sm" : "bg-transparent font-bold text-theme-text/70 hover:text-theme-text hover:bg-theme-secondary/5"}`}>
                      {opt === "fly" ? "✈️ Fly" : "🚗 Drive"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radius Slider */}
              <div className="w-full sm:w-[220px]">
                <SbLabel>Search Radius <span className="font-bold text-theme-bg/60 ml-1">({radius} mi)</span></SbLabel>
                <input
                  type="range" min={1} max={25} step={1} value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full cursor-pointer mt-3 accent-theme-primary h-2 bg-theme-bg rounded-lg appearance-none shadow-inner"
                />
              </div>
            </div>

            {/* Trending Searches */}
            {topDestinations.length > 0 && (
              <div className="hidden xl:flex items-center gap-3 max-w-[450px]">
                <div className="text-[11px] font-black tracking-[0.1em] uppercase text-theme-bg/60 whitespace-nowrap flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-theme-primary" /> Trending:
                </div>
                <div className="flex flex-wrap gap-2.5 overflow-hidden max-h-[36px]">
                  {topDestinations.slice(0, 3).map((dest, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDestination(dest.full_name); setDestValid(true);
                        if (errors.destination) setErrors((prev) => ({ ...prev, destination: "" }));
                      }}
                      className="px-3 py-2 rounded-lg border border-theme-secondary/30 bg-theme-secondary/10 text-theme-bg text-[11px] font-black hover:bg-theme-primary hover:text-theme-bg transition-all whitespace-nowrap shadow-sm hover:shadow active:scale-95 uppercase tracking-wider"
                    >
                      {dest.city}{dest.state ? `, ${stateAbbreviations[dest.state] || dest.state}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SbLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-black tracking-[0.1em] uppercase text-theme-bg/80 mb-1.5 ml-1">{children}</div>;
}

function SbCounter({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void; }) {
  return (
    <div className="flex items-center justify-between px-1 bg-theme-bg rounded-xl border border-theme-surface h-[44px] min-w-[100px] shadow-inner">
      <button className="w-8 h-8 rounded-lg bg-theme-surface text-theme-text hover:bg-theme-secondary/20 flex items-center justify-center font-bold text-lg active:scale-95 transition-all" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="font-black text-[15px] text-theme-text text-center w-8">{value}</span>
      <button className="w-8 h-8 rounded-lg bg-theme-surface text-theme-text hover:bg-theme-secondary/20 flex items-center justify-center font-bold text-lg active:scale-95 transition-all" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}