'use client'

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { travelApi } from '@/services/api';

interface Props {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  isDark?: boolean;
  showGPS?: boolean;
}

// ─── main GPS resolver ───────────────────────────────────────────────────────
// Exclusively calls the backend so the BDC API key remains secure
async function resolveCoords(lat: number, lon: number): Promise<{city:string;state:string}|null> {
  console.log(`[GPS] resolving ${lat}, ${lon} via backend`);
  try {
    const data = await travelApi.getNearestCity(lat, lon);
    if (data?.city) { 
      return { city: data.city, state: data.state ?? "" }; 
    }
  } catch (e) { 
    console.warn("[GPS] backend error:", e); 
  }
  return null;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function LocationAutocomplete({ placeholder, value, onChange, isDark, showGPS }: Props) {
  const [query, setQuery]           = useState(value || '');
  const [results, setResults]       = useState<any[]>([]);
  const [isOpen, setIsOpen]         = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value && value !== query && !isOpen) setQuery(value); }, [value]);

  const cap = (s?: string) =>
    s ? s.split(' ').map(w => w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ') : '';

  const fmt = (city: string, state?: string) => [cap(city), cap(state)].filter(Boolean).join(', ');

  const handleSelect = (loc: any) => {
    const display = fmt(loc.city, loc.state);
    setQuery(display); onChange(display); setResults([]); setIsOpen(false);
  };

  const handleGPS = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!navigator.geolocation) { alert("Geolocation not supported by your browser."); return; }
    if (gpsLoading) return;

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const result = await resolveCoords(lat, lon);
          if (result) {
            const display = fmt(result.city, result.state);
            setQuery(display);
            onChange(display);
          } else {
            alert("We found your location but couldn't identify the city. Please type it manually.");
          }
        } catch {
          alert("Location service unavailable. Please type your city manually.");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        const msgs: Record<number,string> = {
          1: "Location access denied. Please allow it and try again.",
          2: "Your position couldn't be determined. Please type manually.",
          3: "Location request timed out. Please try again.",
        };
        alert(msgs[err.code] || "Unknown location error.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    const run = async () => {
      if (query.length > 2 && query !== value) {
        setIsSearching(true);
        try {
          const data = await travelApi.searchLocations(query);
          if (data?.length) { setResults(data); setIsOpen(true); }
          else              { setResults([]); setIsOpen(false); }
        } catch { /* silent */ }
        finally { setIsSearching(false); }
      } else { setResults([]); setIsOpen(false); }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [query, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          className={`w-full p-3 rounded-xl outline-none transition-all duration-300 text-xs shadow-inner backdrop-blur-sm
            ${isDark
              ? 'bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white/10'
              : 'bg-white border border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
            ${showGPS ? 'pr-[70px]' : 'pr-3'}`}
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) onChange(''); }}
          onFocus={() => { if (results.length) setIsOpen(true); }}
        />

        {showGPS && (
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            title="Use current location"
            className={`absolute right-2 px-2.5 py-1.5 rounded-lg transition-all duration-300 text-[10px] font-bold tracking-wider flex items-center gap-1
              ${gpsLoading ? 'opacity-60 cursor-not-allowed' : ''}
              ${isDark
                ? 'bg-white/5 hover:bg-blue-600 text-white border border-white/5 hover:border-blue-500'
                : 'bg-gray-100 hover:bg-blue-600 text-gray-600 hover:text-white'}`}
          >
            {gpsLoading
              ? <><Loader2 size={12} className="animate-spin" />...</>
              : <><Navigation size={12} />GPS</>}
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className={`absolute z-50 w-full mt-2 border rounded-xl shadow-2xl max-h-[185px] overflow-y-auto backdrop-blur-md
          ${isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-gray-100'}`}>
          {results.map((loc, i) => (
            <li
              key={i}
              onMouseDown={e => { e.preventDefault(); handleSelect(loc); }}
              className={`p-3 flex items-center gap-3 cursor-pointer transition-colors duration-200 group
                ${isDark
                  ? 'hover:bg-blue-600/20 border-b border-white/5 last:border-0 text-slate-200'
                  : 'hover:bg-blue-50 border-b border-gray-50 last:border-0 text-gray-700'}`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110
                ${isDark
                  ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white'
                  : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                <MapPin size={14} />
              </div>
              <div className="flex-1 text-sm overflow-hidden flex flex-col justify-center">
                <div className="font-semibold truncate leading-tight">{cap(loc.city)}</div>
                <div className={`text-[10px] font-medium leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {cap(loc.state)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}