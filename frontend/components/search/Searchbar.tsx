// frontend/components/search/Sidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, X, Calendar, TrendingUp } from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { travelApi } from "../../services/api";

const stateAbbreviations: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

interface SearchbarProps {
  id?: string;
  onSearch: (params: any) => void;
  onSearchStart?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  onClose?: () => void;
}

export default function Searchbar({
  onSearch,
  onSearchStart,
  onCancel,
  loading,
  onClose,
}: SearchbarProps) {
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
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topDestinations, setTopDestinations] = useState<any[]>([]);

  // 1. Reusable function to fetch top destinations instantly
  const refreshTrending = async () => {
    const data = await travelApi.getTopDestinations();
    if (data && data.length > 0) {
      setTopDestinations(data);
    }
  };

  // 2. Fetch top destinations on initial load
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
        console.error(
          "Failed to parse existing search state from localStorage",
          e
        );
      }
    }
  }, []);

  // Updated function to handle tracking top destinations
  const getCoordinates = async (
    locationName: string,
    isDestination: boolean = false
  ) => {
    try {
<<<<<<< Updated upstream:frontend/components/search/Sidebar.tsx
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      // We add the is_destination flag to the URL if it's true
=======
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
>>>>>>> Stashed changes:frontend/components/search/Searchbar.tsx
      const url = `${baseUrl}/locations/geocode?keyword=${encodeURIComponent(
        locationName
      )}${isDestination ? "&is_destination=true" : ""}`;

      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon)
          return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
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

        if (
          !finalSourceValid &&
          finalSource.trim() &&
          savedSource &&
          normalize(savedSource).startsWith(normalize(finalSource))
        ) {
          finalSource = savedSource;
          setSource(savedSource);
          finalSourceValid = true;
          setSourceValid(true);
        }

        if (
          !finalDestValid &&
          finalDest.trim() &&
          savedDest &&
          normalize(savedDest).startsWith(normalize(finalDest))
        ) {
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
    else if (!finalSourceValid)
      newErrors.source = "Please select a valid source city from the dropdown.";

    if (!finalDest.trim()) newErrors.destination = "Destination is required.";
    else if (!finalDestValid)
      newErrors.destination =
        "Please select a valid destination city from the dropdown.";

    if (
      finalSourceValid &&
      finalDestValid &&
      finalSource.toLowerCase().trim() === finalDest.toLowerCase().trim()
    ) {
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
        const diffDays = Math.ceil(
          Math.abs(endDate.getTime() - startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (diffDays > 30)
          newErrors.end = "Trip duration cannot exceed 30 days.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (onSearchStart) onSearchStart();

    setIsGeocoding(true);
    // FIXED: Passed `true` to the destination geocode call to trigger backend Redis tracking
    const [srcCoords, dstCoords] = await Promise.all([
      getCoordinates(finalSource),
      getCoordinates(finalDest, true),
    ]);
    setIsGeocoding(false);

    // 3. INSTANT REFRESH: Update the trending list immediately without reloading the page!
    refreshTrending();

    if (!srcCoords) {
      setErrors({ source: "Could not find coordinates for this city." });
      return;
    }
    if (!dstCoords) {
      setErrors({ destination: "Could not find coordinates for this city." });
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
  const nightCount =
    dates.start && dates.end
      ? Math.max(
          0,
          Math.ceil(
            (new Date(dates.end).getTime() - new Date(dates.start).getTime()) /
              86400000
          )
        )
      : 0;

  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const minEndDate = dates.start
    ? new Date(new Date(dates.start + "T12:00:00").getTime() + 86400000)
    : new Date();

  return (
    <>
      <div className="w-[20vw] lg:w-[20vw] min-w-[300px] h-[100dvh] bg-theme-text border-r border-theme-secondary/20 flex flex-col font-sans text-theme-bg">
        {/* FIXED HEADER */}
        <div className="p-4 border-b border-theme-secondary/20 shadow-md flex justify-between items-start shrink-0">
          <div>
<<<<<<< Updated upstream:frontend/components/search/Sidebar.tsx
            <div className="text-2xl font-extrabold text-theme-bg tracking-tight flex items-center gap-2">
              {/* <img src="/logo.svg" alt="Wanderplan logo" className="w-10 h-10" /> */}
              <span className="text-theme-bg">Wanderplan</span><span className="text-theme-accent">US</span>
            </div>
=======
<div className="text-2xl font-extrabold text-theme-bg tracking-tight flex items-center">
<svg className="w-12 h-12 text-theme-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <g strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7.5" strokeWidth={1.5} />
    
    <line x1="12" y1="4.5" x2="12" y2="6.3" strokeWidth={1}/>
    <line x1="19.5" y1="12" x2="17.7" y2="12" strokeWidth={1}/>
    <line x1="12" y1="19.5" x2="12" y2="17.7" strokeWidth={1}/>
    <line x1="4.5" y1="12" x2="6.3" y2="12" strokeWidth={1}/>
    
    {/* Uses --color-theme-primary (#00820E) */}
    <circle cx="12" cy="12" r="1.1" className="fill-theme-primary stroke-none" />
        
    <line x1="12" y1="12" x2="16" y2="5.5" strokeWidth={2} />
  </g>
  
  {/* Uses --color-theme-accent (#FDE047) */}
  <g className="stroke-theme-accent" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="17.7" cy="2.3" r="1.4" className="fill-theme-primary stroke-none" />
  </g>
</svg>
  <span className="text-theme-bg">minute</span>
  <span className="text-theme-primary">bound</span>
</div>
>>>>>>> Stashed changes:frontend/components/search/Searchbar.tsx
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
            <div className="text-[11px] text-theme-bg/70 mb-4">
              Plan Your Trip
            </div>
            <SbLabel>Source</SbLabel>
            <LocationAutocomplete 
              id="source-input"
              placeholder="eg. NEW YORK, NY" 
              value={source} 
              onChange={(val, isValid) => {
                setSource(val);
                setSourceValid(isValid);
                if (errors.source)
                  setErrors((prev) => ({ ...prev, source: "" }));
              }}
              isDark={false}
              showGPS={true}
            />
            {errors.source && (
              <span className="text-red-400 text-[11px] mt-1 block font-medium">
                {errors.source}
              </span>
            )}
          </div>

          <div>
            <SbLabel>Destination</SbLabel>
            <LocationAutocomplete 
              placeholder="eg. LOS ANGELES, CA"
              value={destination} 
              onChange={(val, isValid) => {
                setDestination(val);
                setDestValid(isValid);
                if (errors.destination)
                  setErrors((prev) => ({ ...prev, destination: "" }));
              }}
              isDark={false}
              showGPS={false}
            />
            {errors.destination && (
              <span id="destination_error" className="text-red-400 text-[11px] mt-1 block font-medium">
                {errors.destination}
              </span>
            )}

            {/* Trending Destinations UI */}
            {topDestinations.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-bold tracking-[0.05em] uppercase text-theme-bg/50 mb-2 ml-1 flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-theme-primary" />{" "}
                  Trending Searches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topDestinations.map((dest, idx) => {
                    // NEW: Lookup the abbreviation. If it's not in the list, just use the original string.
                    const stateAbbrev = dest.state
                      ? stateAbbreviations[dest.state] || dest.state
                      : "";

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setDestination(dest.full_name);
                          setDestValid(true);
                          if (errors.destination) {
                            setErrors((prev) => ({ ...prev, destination: "" }));
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-[8px] border border-theme-secondary/20 bg-theme-bg/5 text-theme-bg/80 text-[11px] font-medium hover:bg-theme-primary hover:text-theme-bg hover:border-theme-primary transition-all duration-200"
                      >
                        {dest.city}
                        {stateAbbrev ? `, ${stateAbbrev}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <SbLabel>
              Travel Dates{" "}
              {nightCount > 0 && (
                <span className="font-normal text-theme-bg/60 text-[10.5px]">
                  · {nightCount} night{nightCount !== 1 ? "s" : ""}
                </span>
              )}
            </SbLabel>

            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[120px] relative">
                <DatePicker
                  selected={
                    dates.start ? new Date(dates.start + "T12:00:00") : null
                  }
                  onChange={(date: Date | null): void => {
                    if (!date) return;
                    const formatted: string = formatDate(date);
                    setDates((d: typeof dates) => ({ ...d, start: formatted }));
                    if (errors.start)
                      setErrors((prev: Record<string, string>) => ({
                        ...prev,
                        start: "",
                      }));

                    if (dates.end) {
                      const currEnd: Date = new Date(dates.end + "T12:00:00");
                      if (date >= currEnd) {
                        setDates((d: typeof dates) => ({
                          ...d,
                          start: formatted,
                          end: "",
                        }));
                      }
                    }
                  }}
                  minDate={new Date()}
                  placeholderText="Start..."
                  popperPlacement="bottom-start"
                  className={`w-full py-[9px] pl-8 pr-3 bg-theme-bg border-[1.5px] ${
                    errors.start
                      ? "border-red-500"
                      : "border-theme-secondary/30"
                  } rounded-[10px] font-semibold text-[13px] text-theme-text focus:border-theme-secondary focus:ring-1 focus:ring-theme-secondary outline-none`}
                />
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none z-10"
                />

                {errors.start && <span id="start_date_error" className="text-red-400 text-[11px] mt-1 block font-medium">{errors.start}</span>}
                </div>
              
              <div className="flex-1 min-w-[120px] relative">
                <DatePicker
                  selected={
                    dates.end ? new Date(dates.end + "T12:00:00") : null
                  }
                  onChange={(date: Date | null) => {
                    if (!date) return;
                    const formatted: string = formatDate(date);
                    setDates((d: typeof dates) => ({ ...d, end: formatted }));
                    if (errors.end)
                      setErrors((prev: Record<string, string>) => ({
                        ...prev,
                        end: "",
                      }));
                  }}
                  minDate={minEndDate}
                  placeholderText="End..."
                  popperPlacement="bottom-start"
                  className={`w-full py-[9px] pl-8 pr-3 bg-theme-bg border-[1.5px] ${
                    errors.end ? "border-red-500" : "border-theme-secondary/30"
                  } rounded-[10px] font-semibold text-[13px] text-theme-text focus:border-theme-secondary focus:ring-1 focus:ring-theme-secondary outline-none`}
                />
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none z-10"
                />

                {errors.end && (
                  <span className="text-red-400 text-[11px] mt-1 block font-medium">
                    {errors.end}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <div id="num_adults" className="flex-1 basis-[120px]">
              <SbLabel>Adults</SbLabel>
              <SbCounter value={adults} min={1} max={9} onChange={setAdults} />
            </div>
            <div id="num_children" className="flex-1 basis-[120px]">
              <SbLabel>Children</SbLabel>
              <SbCounter
                value={children}
                min={0}
                max={9}
                onChange={setChildren}
              />
            </div>
          </div>

          <div>
            <SbLabel>Budget Category</SbLabel>
            <div className="flex bg-theme-bg rounded-[10px] p-[3px] gap-[3px]">
              {(["budget", "luxury"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBudget(opt)}
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${
                    budget === opt
                      ? "bg-theme-primary font-bold text-theme-bg]"
                      : "bg-transparent font-normal text-theme-text/70"
                  }`}
                >
                  {opt === "budget" ? "💰 Budget" : "✨ Luxury"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SbLabel>Travel Mode</SbLabel>
            <div className="flex bg-theme-bg rounded-[10px] p-[3px] gap-[3px]">
              {(["fly", "drive"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTravelMode(opt)}
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${
                    travelMode === opt
                      ? "bg-theme-primary font-bold text-theme-bg shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                      : "bg-transparent font-normal text-theme-text/70"
                  }`}
                >
                  {opt === "fly" ? "✈️ Fly" : "🚗 Drive"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SbLabel>
              Search Radius{" "}
              <span className="font-normal text-theme-bg/60">
                ({radius} mi)
              </span>
            </SbLabel>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full cursor-pointer my-1 accent-theme-primary"
            />
          </div>
        </div>

        {/* FIXED FOOTER WITH SUBMIT BUTTON */}
        <div className="p-4 bg-theme-text border-t border-theme-secondary/20 shrink-0">
          {!isWorking ? (
            <button 
              id="submit-side" className="w-full p-4 rounded-2xl bg-theme-primary text-theme-bg text-sm font-bold flex items-center justify-center gap-2 hover:bg-theme-secondary transition-all shadow-[0_4px_15px_rgba(0,0,0,0.25)] active:scale-[0.98]"
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
                className="w-[52px] rounded-2xl bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
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
  return (
    <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-bg/70 mb-1.5 ml-1">
      {children}
    </div>
  );
}

function SbCounter({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-theme-bg p-1 rounded-[10px] border-[1.5px] border-theme-secondary/30 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <button
        className="w-[30px] h-[30px] border-[1.5px] border-theme-secondary/30 rounded-lg bg-theme-bg text-theme-text text-[17px] cursor-pointer hover:bg-theme-secondary/10 transition-colors"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="flex-1 font-bold text-sm text-theme-text text-center">
        {value}
      </span>
      <button
        className="w-[30px] h-[30px] border-[1.5px] border-theme-secondary/30 rounded-lg bg-theme-bg text-theme-text text-[17px] cursor-pointer hover:bg-theme-secondary/10 transition-colors"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}