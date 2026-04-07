// frontend/components/search/LocationAutoComplete.tsx
'use client'

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, X } from 'lucide-react';
import { travelApi } from '@/services/api';

interface Props {
  placeholder: string;
  value: string;
  onChange: (val: string, isValid: boolean) => void;
  isDark?: boolean;
  showGPS?: boolean;
}

async function resolveCoords(lat: number, lon: number): Promise<{city:string;state:string}|null> {
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

export default function LocationAutocomplete({ placeholder, value, onChange, showGPS }: Props) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastSelected = useRef(value || '');
  
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [results]);

  useEffect(() => { 
    if (value !== undefined && value !== query) {
      setQuery(value);
      setIsOpen(false); 
      lastSelected.current = value; 
    }
  }, [value]);

  const cap = (s?: string) =>
    s ? s.split(' ').map(w => w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ') : '';

  const fmt = (city: string, state?: string) => [cap(city), cap(state)].filter(Boolean).join(', ');

  const handleSelect = (loc: any) => {
    const display = fmt(loc.city, loc.state);
    lastSelected.current = display; 
    setQuery(display); 
    onChange(display, true); 
    setResults([]); 
    setIsOpen(false);
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
            lastSelected.current = display;
            setQuery(display);
            onChange(display, true); 
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
        alert("Location access failed. Please type manually.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    const run = async () => {
      if (query.length > 2 && query !== lastSelected.current) {
        setIsSearching(true);
        try {
          const parts = query.split(',');
          const cityQuery = parts[0].trim();
          const stateQuery = parts.length > 1 ? parts[1].trim().toLowerCase() : '';

          const data = await travelApi.searchLocations(cityQuery);
          
          if (data?.length) { 
            let filteredResults = data;
            if (stateQuery) {
              filteredResults = data.filter((loc: any) => 
                loc.state && loc.state.toLowerCase().includes(stateQuery)
              );
            }

            if (filteredResults.length > 0) {
              setResults(filteredResults); 
              setIsOpen(true); 
            } else {
              setResults([]); 
              setIsOpen(false);
            }
          } else { 
            setResults([]); 
            setIsOpen(false); 
          }
        } catch { /* silent */ }
        finally { setIsSearching(false); }
      } else { 
        setResults([]); 
        setIsOpen(false); 
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler, true);
    document.addEventListener('touchstart', handler, true); 
    return () => {
      document.removeEventListener('mousedown', handler, true);
      document.removeEventListener('touchstart', handler, true);
    };
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div id="location-autocomplete-input" className="relative flex items-center">
        <input
          className={`w-full p-3 rounded-xl outline-none transition-all duration-300 text-xs shadow-inner backdrop-blur-sm
            bg-theme-bg border border-theme-secondary/30 text-theme-text placeholder:text-theme-text/50 
            focus:border-theme-secondary focus:ring-1 focus:ring-theme-secondary focus:bg-theme-bg
            ${!isSearching && query.length === 0 && showGPS ? 'pr-[70px]' : 'pr-10'}`}
          placeholder={placeholder}
          value={query}
          onChange={e => { 
            const val = e.target.value;
            setQuery(val); 
            onChange(val, false); 
            if (lastSelected.current && val !== lastSelected.current) {
              lastSelected.current = ''; 
            }
          }}
          onFocus={() => { if (results.length) setIsOpen(true); }}
        />

        {isSearching ? (
          <div className="absolute right-3 flex items-center justify-center text-theme-secondary">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : isOpen || query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('', false); 
              lastSelected.current = '';
              setIsOpen(false);
              setResults([]);
            }}
            className="absolute right-2 p-1.5 rounded-lg transition-colors text-theme-text/50 hover:text-theme-text hover:bg-theme-secondary/20"
          >
            <X size={16} />
          </button>
        ) : showGPS ? (
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            title="Use current location"
            className={`absolute right-2 px-2.5 py-1.5 rounded-lg transition-all duration-300 text-[10px] font-bold tracking-wider flex items-center gap-1
              ${gpsLoading ? 'opacity-60 cursor-not-allowed' : ''}
              bg-theme-secondary/10 hover:bg-theme-secondary text-theme-secondary hover:text-theme-bg border border-transparent hover:border-theme-secondary`}
          >
            {gpsLoading
              ? <><Loader2 size={12} className="animate-spin" /></>
              : <><Navigation size={12} />GPS</>}
          </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 && (
        <ul 
          ref={listRef} 
          className="absolute z-50 w-full mt-2 border rounded-xl shadow-2xl max-h-[185px] overflow-y-auto backdrop-blur-md bg-theme-bg border-theme-secondary/20 custom-scrollbar"
        >
          {results.map((loc, i) => (
            <li
              key={i}
              onMouseDown={e => { e.preventDefault(); handleSelect(loc); }}
              className="p-3 flex items-center gap-3 cursor-pointer transition-colors duration-200 group hover:bg-theme-muted/20 border-b border-theme-secondary/10 last:border-0 text-theme-text"
            >
              <div className="p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110 bg-theme-secondary/10 text-theme-secondary group-hover:bg-theme-secondary group-hover:text-theme-bg">
                <MapPin className='size-6'/>
              </div>
              <div className="flex-1 text-sm overflow-hidden flex flex-col justify-center">
                <div className="font-semibold truncate leading-tight group-hover:text-theme-primary transition-colors">{cap(loc.city)}</div>
                <div className="text-[10px] font-medium leading-tight mt-0.5 text-theme-text/60 group-hover:text-theme-secondary transition-colors">
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