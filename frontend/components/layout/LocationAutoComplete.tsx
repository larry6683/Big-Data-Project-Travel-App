'use client'

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { travelApi } from '@/services/api';

interface Props {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  isDark?: boolean;
  showGPS?: boolean;
}

export default function LocationAutocomplete({ placeholder, value, onChange, isDark, showGPS }: Props) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal state if the parent provides a value (like loading from localStorage)
  useEffect(() => {
    if (value && value !== query && !isOpen) {
      setQuery(value);
    }
  }, [value]);

  const formatDisplay = (city: string, state?: string) => {
    const cap = (str?: string) => {
      if (!str) return '';
      return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };
    const parts = [cap(city), cap(state)].filter(Boolean);
    return parts.join(', ');
  };

  const handleSelect = (loc: any) => {
    const display = formatDisplay(loc.city, loc.state);
    setQuery(display);      // Update the input box
    onChange(display);      // Send data to Sidebar
    setResults([]);         // Clear results
    setIsOpen(false);       // Close dropdown
  };

const handleGPS = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent potential form submission
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await travelApi.getNearestCity(pos.coords.latitude, pos.coords.longitude);
          
          // Check if we got a valid city name back
          if (data && data.city) {
            const display = formatDisplay(data.city, data.state);
            setQuery(display);
            onChange(display);
          } else {
            // Show alert if the geocoding services failed
            alert("We found your location, but couldn't identify a city name. Please type it manually.");
          }
        } catch (err) {
          console.error("Failed to fetch nearest city:", err);
          alert("The geocoding service is currently unavailable. Please type your location.");
        }
      },
      (error) => {
        // ... existing error switch logic
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // The simplified search effect
  useEffect(() => {
    const fetchLocations = async () => {
      // Only search if length > 2 AND the text doesn't exactly match the already-selected value
      if (query.length > 2 && query !== value) {
        setIsSearching(true);
        try {
          const data = await travelApi.searchLocations(query);
          if (data && data.length > 0) {
            setResults(data);
            setIsOpen(true);
          } else {
            setResults([]);
            setIsOpen(false);
          }
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };
    
    const timer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(timer);
  }, [query, value]); // Reacts when query or value changes

  // Click outside to close
  useEffect(() => {
    const clickOut = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          className={`w-full p-3 rounded-xl outline-none transition-all duration-300 text-xs shadow-inner backdrop-blur-sm
              ${isDark 
      ? 'bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white/10' 
      : 'bg-white border border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
    }
            ${showGPS ? 'pr-[70px]' : 'pr-3'} 
          `}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // We only call onChange here if they completely clear the box
            if (e.target.value === '') onChange('');
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {showGPS && (
          <button 
            type="button" 
            onClick={handleGPS} 
            title="Use Current Location"
            className={`absolute right-2 px-2.5 py-1.5 rounded-lg transition-all duration-300 text-[10px] font-bold tracking-wider flex items-center gap-1
              ${isDark ? 'bg-white/5 hover:bg-blue-600 text-white border border-white/5 hover:border-blue-500' : 'bg-gray-100 hover:bg-blue-600 text-gray-600 hover:text-white'}
            `}>
            <Navigation size={12} /> GPS
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <ul className={`absolute z-50 w-full mt-2 border rounded-xl shadow-2xl max-h-[185px] overflow-y-auto backdrop-blur-md
          ${isDark 
            ? 'bg-slate-900/95 border-white/10 sleek-scroll' 
            : 'bg-white border-gray-100 scrollbar-thin'
          }`}>
          {results.map((loc, i) => (
            <li 
              key={i} 
              // CRITICAL FIX: onMouseDown guarantees this fires before the input loses focus!
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(loc);
              }} 
              className={`p-3 flex items-center gap-3 cursor-pointer transition-colors duration-200 group
                ${isDark ? 'hover:bg-blue-600/20 border-b border-white/5 last:border-0 text-slate-200' : 'hover:bg-blue-50 border-b border-gray-50 last:border-0 text-gray-700'}
              `}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110 
                ${isDark ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                <MapPin size={14} />
              </div>
              <div className="flex-1 text-sm overflow-hidden flex flex-col justify-center">
                <div className="font-semibold truncate leading-tight">
                  {loc.city ? loc.city.charAt(0).toUpperCase() + loc.city.slice(1).toLowerCase() : ""}
                </div>
                <div className={`text-[10px] font-medium leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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