// larry6683/big-data-project-travel-app/frontend/components/layout/LocationAutoComplete.tsx

'use client'

import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { travelApi } from '@/services/api';

interface Props {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  isDark?: boolean;
  showGPS?: boolean;
}

export default function LocationAutocomplete({ placeholder, value, onChange, isDark, showGPS }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Capitalizes first letter of each word (e.g., "greeley, colorado" -> "Greeley, Colorado")
  const formatDisplay = (city: string, state: string) => {
    const cap = (str: string) => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return `${cap(city)}, ${cap(state)}`;
  };

  const handleGPS = async () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const data = await travelApi.getNearestCity(pos.coords.latitude, pos.coords.longitude);
      if (data && data.city) {
        const display = formatDisplay(data.city, data.state || "");
        setQuery(display);
        onChange(display);
      }
    }, null, { enableHighAccuracy: true });
  };

  useEffect(() => {
    const fetchLocations = async () => {
      // Trigger immediately after the first letter
      if (query.length > 0 && query !== value) {
        const data = await travelApi.searchLocations(query);
        setResults(data || []);
        setIsOpen(true);
      } else if (query.length === 0) {
        setResults([]);
        setIsOpen(false);
      }
    };
    const timer = setTimeout(fetchLocations, 200);
    return () => clearTimeout(timer);
  }, [query, value]);

  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="flex gap-2">
        <input
          className={`w-full p-2 rounded border outline-none ${isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-blue-500' : 'bg-white'}`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {showGPS && (
          <button onClick={handleGPS} className="px-4 bg-blue-600 rounded text-white text-[10px] font-bold hover:bg-blue-500 transition-colors">
            GPS
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <ul className={`absolute z-50 w-full mt-1 border rounded shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white'}`}>
          {results.map((loc, i) => (
            <li 
              key={i} 
              onClick={() => {
                const display = formatDisplay(loc.city, loc.state);
                setQuery(display);
                onChange(display);
                setIsOpen(false);
              }} 
              className="p-3 flex items-center gap-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800 last:border-0 text-white group"
            >
              <MapPin size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <div className="flex-1 text-sm overflow-hidden">
                <div className="font-bold truncate">
                  {loc.city.charAt(0).toUpperCase() + loc.city.slice(1).toLowerCase()}
                </div>
                <div className="text-[10px] text-zinc-500 font-medium">
                  {loc.state ? loc.state.charAt(0).toUpperCase() + loc.state.slice(1).toLowerCase() : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}