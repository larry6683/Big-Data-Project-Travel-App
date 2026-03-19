// frontend/components/search/Sidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  X,
  LayoutDashboard,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";
import { useAuth } from "../../context/AuthContext";
import ProfileModal from "../ProfileModal"; // 🌟 NEW IMPORT
import { travelApi } from "../../services/api"; // 🌟 NEW IMPORT

interface SidebarProps {
  onSearch: (params: any) => void;
  onSearchStart?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  onClose?: () => void;
}

const INTEREST_CATEGORIES = [
  { id: "amenity", label: "🍽️ Dining" },
  { id: "tourism", label: "📸 Tourism" },
  { id: "leisure", label: "🌳 Leisure" },
  { id: "shop", label: "🛍️ Shopping" },
  { id: "historic", label: "🏛️ Historic" },
  { id: "transit", label: "🛣️ Transit" },
];

export default function Sidebar({
  onSearch,
  onSearchStart,
  onCancel,
  loading,
  onClose,
}: SidebarProps) {
  const { isLoggedIn, user, logout } = useAuth();

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

  // 🌟 NEW PROFILE STATES
  const [showProfile, setShowProfile] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:8000";

  // 🌟 NEW PROFILE FETCH FUNCTION
  const fetchProfileImage = async () => {
    if (isLoggedIn) {
      try {
        const data = await travelApi.getProfile();
        setProfilePic(data.profile_picture_url);
      } catch (e) {
        console.error("Failed to fetch profile image", e);
      }
    }
  };

  useEffect(() => {
    fetchProfileImage();
  }, [isLoggedIn]);

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
        console.error(
          "Failed to parse existing search state from localStorage",
          e
        );
      }
    }
  }, []);

  const getCoordinates = async (
    locationName: string,
    isDestination: boolean = false
  ) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = isDestination
        ? `${baseUrl}/locations/geocode?keyword=${encodeURIComponent(
            locationName
          )}&is_destination=true`
        : `${baseUrl}/locations/geocode?keyword=${encodeURIComponent(
            locationName
          )}`;

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

  const handleInterestToggle = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
      const startDate = new Date(dates.start);
      const endDate = new Date(dates.end);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tzOffsetStartDate = new Date(
        startDate.getTime() + startDate.getTimezoneOffset() * 60000
      );
      const tzOffsetEndDate = new Date(
        endDate.getTime() + endDate.getTimezoneOffset() * 60000
      );
      if (tzOffsetStartDate < today)
        newErrors.start = "Start date cannot be in the past.";
      if (tzOffsetStartDate >= tzOffsetEndDate)
        newErrors.end = "End date must be at least 1 day after start date.";
      else {
        const diffDays = Math.ceil(
          Math.abs(tzOffsetEndDate.getTime() - tzOffsetStartDate.getTime()) /
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
    const [srcCoords, dstCoords] = await Promise.all([
      getCoordinates(finalSource, false),
      getCoordinates(finalDest, true),
    ]);
    setIsGeocoding(false);

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
      interests,
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
  const todayStr = new Date().toISOString().split("T")[0];

  let minEndDateStr = todayStr;
  if (dates.start) {
    const [year, month, day] = dates.start.split("-").map(Number);
    const nextDay = new Date(year, month - 1, day + 1);
    const y = nextDay.getFullYear();
    const m = String(nextDay.getMonth() + 1).padStart(2, "0");
    const d = String(nextDay.getDate()).padStart(2, "0");
    minEndDateStr = `${y}-${m}-${d}`;
  }

  return (
    <>
      <div className="w-[22vw] lg:w-[20vw] min-w-[300px] h-[100dvh] bg-slate-900 border-r border-slate-200/10 flex flex-col font-sans text-white">
        {/* FIXED HEADER */}
        <div className="p-4 border-b border-slate-800 shadow-md flex justify-between items-start shrink-0">
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              WanderPlan <span className="text-blue-600">US</span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* SCROLLABLE MIDDLE SECTION */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar pb-6">
          {/* 🌟 UPDATED USER BADGE */}
          {isLoggedIn && (
            <div
              className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center gap-3 mb-2 cursor-pointer hover:bg-slate-800 transition-all"
              onClick={() => setShowProfile(true)}
            >
              {profilePic ? (
                <img
                  src={`${API_BASE_URL}${profilePic}`}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border border-slate-600"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                  {user?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Logged In As
                </div>
                <div className="text-sm font-semibold truncate text-blue-100">
                  {user}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] text-[#c2c2c2] mb-4">
              Plan Your Trip
            </div>
            <SbLabel>Source</SbLabel>
            <LocationAutocomplete
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
              <span className="text-red-400 text-[11px] mt-1 block font-medium">
                {errors.destination}
              </span>
            )}
          </div>

          <div>
            <SbLabel>
              Travel Dates{" "}
              {nightCount > 0 && (
                <span className="font-normal text-slate-400 text-[10.5px]">
                  · {nightCount} night{nightCount !== 1 ? "s" : ""}
                </span>
              )}
            </SbLabel>

            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[120px]">
                <input
                  type="date"
                  min={todayStr}
                  value={dates.start}
                  onChange={(e) => {
                    setDates((d) => ({ ...d, start: e.target.value }));
                    if (errors.start)
                      setErrors((prev) => ({ ...prev, start: "" }));
                    if (dates.end) {
                      const newStart = new Date(e.target.value);
                      const currEnd = new Date(dates.end);
                      if (newStart >= currEnd)
                        setDates((d) => ({
                          ...d,
                          start: e.target.value,
                          end: "",
                        }));
                    }
                  }}
                  className={`w-full py-[9px] px-3 bg-white border-[1.5px] ${
                    errors.start ? "border-red-500" : "border-slate-200"
                  } rounded-[10px] font-inherit text-[13px] text-slate-900 focus:border-blue-600 outline-none`}
                />
                {errors.start && (
                  <span className="text-red-400 text-[11px] mt-1 block font-medium">
                    {errors.start}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-[120px]">
                <input
                  type="date"
                  min={minEndDateStr}
                  value={dates.end}
                  onChange={(e) => {
                    setDates((d) => ({ ...d, end: e.target.value }));
                    if (errors.end) setErrors((prev) => ({ ...prev, end: "" }));
                  }}
                  className={`w-full py-[9px] px-3 bg-white border-[1.5px] ${
                    errors.end ? "border-red-500" : "border-slate-200"
                  } rounded-[10px] font-inherit text-[13px] text-slate-900 focus:border-blue-600 outline-none`}
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
            <div className="flex-1 basis-[120px]">
              <SbLabel>Adults</SbLabel>
              <SbCounter value={adults} min={1} max={9} onChange={setAdults} />
            </div>
            <div className="flex-1 basis-[120px]">
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
            <div className="flex bg-slate-100 rounded-[10px] p-[3px] gap-[3px]">
              {(["budget", "luxury"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setBudget(opt)}
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${
                    budget === opt
                      ? "bg-white font-bold text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                      : "bg-transparent font-normal text-slate-500"
                  }`}
                >
                  {opt === "budget" ? "💰 Budget" : "✨ Luxury"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SbLabel>Travel Mode</SbLabel>
            <div className="flex bg-slate-100 rounded-[10px] p-[3px] gap-[3px]">
              {(["fly", "drive"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTravelMode(opt)}
                  className={`flex-1 py-[7px] rounded-lg border-none font-inherit text-[12.5px] cursor-pointer transition-all duration-150 hover:opacity-85 ${
                    travelMode === opt
                      ? "bg-white font-bold text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                      : "bg-transparent font-normal text-slate-500"
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
              <span className="font-normal text-slate-400">({radius} mi)</span>
            </SbLabel>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full cursor-pointer my-1 accent-blue-600"
            />
          </div>

          <div>
            <SbLabel>Interests</SbLabel>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleInterestToggle(category.id)}
                  className={`px-2.5 py-1.5 rounded-2xl border-[1.5px] text-xs cursor-pointer transition-all duration-200 ${
                    interests.includes(category.id)
                      ? "border-blue-600 bg-blue-600/15 text-white"
                      : "border-slate-700 bg-transparent text-slate-400"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Private Dashboard Section */}
          {isLoggedIn && (
            <div className="mt-4 pt-6 border-t border-slate-800 flex flex-col gap-2">
              <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-blue-500 mb-1 ml-1">
                Private Dashboard
              </div>

              <Link href="/dashboard">
                <button className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50 w-full p-2 rounded mb-2">
                  <span>📂 My Saved Trips</span>
                </button>
              </Link>

              <button className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm group">
                <History
                  size={18}
                  className="text-slate-500 group-hover:text-blue-400"
                />
                <span>Search History</span>
              </button>

              {/* 🌟 UPDATED BUTTON ACTION */}
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm group"
              >
                <Settings
                  size={18}
                  className="text-slate-500 group-hover:text-blue-400"
                />
                <span>Profile Settings</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm mt-2"
              >
                <LogOut size={18} />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>

        {/* FIXED FOOTER WITH SUBMIT BUTTON */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          {!isWorking ? (
            <button
              className="w-full p-4 rounded-2xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-[0_4px_15px_rgba(37,99,235,0.3)] active:scale-[0.98]"
              onClick={handleSearchSubmit}
            >
              <Search size={17} /> SUBMIT
            </button>
          ) : (
            <div className="flex gap-2 h-[52px]">
              <div className="flex-1 rounded-2xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center gap-2 border border-slate-700">
                <Loader2 size={17} className="animate-spin" />
                <span className="text-xs tracking-wider">GATHERING...</span>
              </div>
              <button
                onClick={onCancel}
                title="Cancel Search"
                className="w-[52px] rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🌟 NEW MODAL COMPONENT */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onProfileUpdate={fetchProfileImage}
      />
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
    <div className="flex items-center gap-2.5 bg-white p-1 rounded-[10px] border-[1.5px] border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <button
        className="w-[30px] h-[30px] border-[1.5px] border-slate-200 rounded-lg bg-white text-slate-700 text-[17px] cursor-pointer"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="flex-1 font-bold text-sm text-slate-900 text-center">
        {value}
      </span>
      <button
        className="w-[30px] h-[30px] border-[1.5px] border-slate-200 rounded-lg bg-white text-slate-700 text-[17px] cursor-pointer"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
