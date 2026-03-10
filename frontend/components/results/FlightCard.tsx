// larry6683/big-data-project-travel-app/frontend/components/results/FlightCard.tsx

import React, { useState, useMemo, useEffect } from 'react';

type SortOption = 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

export default function FlightCard({ flights, loading }: { flights: any[], loading?: boolean }) {
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [selectedFlightKeys, setSelectedFlightKeys] = useState<string[]>([]);

  // 🌟 FIX: Load the saved flight selection from localStorage instead of clearing it
  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.flights && tripState.flights.length > 0) {
          setSelectedFlightKeys(tripState.flights.map((f: any) => f._selectionKey));
        } else {
          setSelectedFlightKeys([]);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [flights]);

  // Handle Single Selection Toggle
  const toggleFlightSelection = (flight: any, uniqueKey: string) => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};

    const isSelected = selectedFlightKeys.includes(uniqueKey);

    if (isSelected) {
      // If already selected, deselect it
      tripState.flights = [];
      setSelectedFlightKeys([]);
    } else {
      // If NOT selected, overwrite the array so ONLY this one is selected
      const flightToSave = { ...flight, _selectionKey: uniqueKey };
      tripState.flights = [flightToSave];
      setSelectedFlightKeys([uniqueKey]);
    }

    localStorage.setItem('trip_state', JSON.stringify(tripState)); 
  };

  // --- FORMATTING HELPERS ---
  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBA';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timeString: string) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDuration = (durationString?: string) => {
    if (!durationString) return '';
    return durationString.toLowerCase().replace('h', 'h ').replace('m', 'm');
  };

  const getLayoverDuration = (arrivalTime: string, nextDepartureTime: string) => {
    if (!arrivalTime || !nextDepartureTime) return '';
    const arr = new Date(arrivalTime).getTime();
    const dep = new Date(nextDepartureTime).getTime();
    const diffMins = Math.floor((dep - arr) / (1000 * 60));
    if (diffMins <= 0) return '';
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getPrice = (f: any) => {
    const rawPrice = f.price?.grandTotal || f.price?.total || f.price || 0;
    if (typeof rawPrice === 'number') return rawPrice;
    return parseFloat(String(rawPrice).replace(/[^\d.-]/g, '')) || 0;
  };

  const getDuration = (f: any) => {
    if (!f.itineraries) return 0;
    return f.itineraries.reduce((sum: number, itin: any) => {
      const cleanStr = (itin.duration || '').toUpperCase().replace('PT', '');
      let hours = 0, minutes = 0;
      const hMatch = cleanStr.match(/(\d+)H/);
      const mMatch = cleanStr.match(/(\d+)M/);
      if (hMatch) hours = parseInt(hMatch[1], 10);
      if (mMatch) minutes = parseInt(mMatch[1], 10);
      return sum + (hours * 60) + minutes;
    }, 0);
  };

  const sortedFlights = useMemo(() => {
    if (!flights || !Array.isArray(flights)) return [];
    
    return [...flights].sort((a, b) => {
      const priceA = getPrice(a);
      const priceB = getPrice(b);
      const durA = getDuration(a);
      const durB = getDuration(b);
      switch (sortBy) {
        case 'price_asc': return priceA - priceB;
        case 'price_desc': return priceB - priceA;
        case 'duration_asc': return durA - durB;
        case 'duration_desc': return durB - durA;
        default: return 0;
      }
    });
  }, [flights, sortBy]);

  if (loading) return null; // Handled globally by TripResults now

  if (!flights || !Array.isArray(flights) || flights.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-dashed border-gray-300 rounded-xl text-gray-500 shadow-sm">
        <span className="text-3xl block mb-2">📭</span>
        <h3 className="text-base font-bold text-gray-800">No flights found</h3>
        <p className="text-sm">Try adjusting your search dates or locations.</p>
      </div>
    );
  }

  const SortBtn = ({ id, label }: { id: SortOption, label: string }) => {
    const isActive = sortBy === id;
    return (
      <button
        onClick={() => setSortBy(id)}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${
          isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col xl:flex-row justify-between xl:items-end border-b border-gray-200 pb-3 gap-2">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Results...</h3>
          <p className="text-xs text-gray-500">
            Showing {Math.min(flights.length, 12)} of {flights.length} options
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <SortBtn id="price_asc" label="💰 Lowest Price" />
          <SortBtn id="price_desc" label="💰 Highest Price" />
          <SortBtn id="duration_asc" label="⚡ Shortest" />
          <SortBtn id="duration_desc" label="⏳ Longest" />
        </div>
      </div>
      
      {sortedFlights.slice(0, 12).map((flight, flightIndex) => {
        const uniqueKey = flight.id ? `${flight.id}-${flightIndex}` : `flight-${flightIndex}`;
        const isSelected = selectedFlightKeys.includes(uniqueKey);

        return (
          <div 
            key={uniqueKey} 
            className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-200 ${
              isSelected       ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-100/10' : 'bg-white hover:shadow-md'
            }`}
          >
            <div className={`px-3 py-1 border-b flex justify-between items-center ${isSelected ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-100/40 border-gray-100'}`}>
              <div className="flex items-center gap-3">

                <div className="w-12 h-12 flex items-center justify-center overflow-hidden relative shrink-0">
                  <img src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`} alt={flight.airline_code} className="max-w-[80%] max-h-[80%] object-contain" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 leading-none mb-0">
                    {flight.airline_name || flight.airline_code} 
                    <span className="inline-block px-2 py-0.5 ml-2 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-widest font-bold rounded">
                      {flight.cabin_class}
                    </span>
                  </h4>
                </div>
              </div>
              <div className="text-right leading-none">
                <p className="text-2xl font-black text-indigo-600 tracking-tight">
                  ${getPrice(flight).toFixed(2)} 
                  <span className="text-[10px] text-gray-500 font-bold tracking-wider ml-1">{flight.currency}</span>
                </p>
              </div>

                <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm shrink-0">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleFlightSelection(flight, uniqueKey)} 
                    className="w-4 h-4 accent-indigo-600 cursor-pointer" 
                  />
          <span className="text-xs font-bold text-gray-700 select-none w-[56px] inline-block text-center">
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </label>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              {flight.itineraries?.map((itinerary: any, itinIndex: number) => {
                const isOutbound = itinIndex === 0;
                const theme = isOutbound 
                  ? { bg: 'bg-transparent', text: 'text-indigo-600', badgeBg: 'bg-indigo-100', icon: '🛫', label: 'Outbound' }
                  : { bg: 'bg-transparent', text: 'text-green-600', badgeBg: 'bg-green-100', icon: '🛬', label: 'Return' };
                const departureDate = itinerary.segments?.[0]?.departure_time;

                return (
                  <div key={itinIndex} className={`p-3 ${theme.bg}`}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-widest ${theme.badgeBg} ${theme.text}`}>
                          {theme.icon} {theme.label}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{formatDate(departureDate)}</span>
                      </div>
                      <div className="text-right leading-none">
                        <p className="text-xs font-bold text-gray-800">{formatDuration(itinerary.duration)}</p>
                        <p className={`text-xs font-bold mt-0.5 ${itinerary.stops === 0 ? 'text-green-500' : 'text-amber-500'}`}>
                          {itinerary.stops === 0 ? 'Direct' : `${itinerary.stops} Stop(s)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0 relative">
                      {itinerary.segments.length > 1 && (
                        <div className="absolute left-[5.5px] top-3 bottom-3 w-[2px] bg-gray-200 z-0"></div>
                      )}

                      {itinerary.segments?.map((seg: any, segIndex: number) => {
                        const isLast = segIndex === itinerary.segments.length - 1;
                        const nextSeg = itinerary.segments[segIndex + 1];

                        return (
                          <div key={segIndex} className={`relative z-10 flex gap-3 ${isLast ? '' : 'mb-3'}`}>
                            <div className="flex flex-col items-center mt-1">
                              <div className={`w-3 h-3 rounded-full border-2 bg-white relative z-20 ${isOutbound ? 'border-indigo-600' : 'border-emerald-500'}`}></div>
                            </div>

                            <div className="flex-1 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm relative">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-lg font-black text-gray-800 leading-none">{formatTime(seg.departure_time)}</p>
                                  <p className="text-xs font-bold text-gray-500 mt-0.5">
                                    {seg.departure_name || 'Airport'} ({seg.departure_airport})
                                  </p>
                                </div>
                                <div className="flex flex-col items-center px-1">
                                  <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-0.5">
                                    {seg.carrier_code} {seg.flight_number}
                                  </span>
                                  <div className="w-12 h-[2px] bg-gray-200 mb-1"></div>
                                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                    <span className="flex items-center gap-0.5 bg-gray-50 px-1 py-0.5 rounded">🎒 {seg.personal_item ?? 1}</span>
                                    <span className="flex items-center gap-0.5 bg-gray-50 px-1 py-0.5 rounded">💼 {seg.cabin_bags ?? 0}</span>
                                    <span className="flex items-center gap-0.5 bg-gray-50 px-1 py-0.5 rounded">🧳 {seg.checked_bags ?? 0}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-gray-800 leading-none">{formatTime(seg.arrival_time)}</p>
                                  <p className="text-xs font-bold text-gray-500 mt-0.5">
                                    {seg.arrival_name || 'Airport'} ({seg.arrival_airport})
                                  </p>
                                </div>
                              </div>
                              {!isLast && nextSeg && (
                                <div className="absolute left-1/2 -bottom-3.5 transform -translate-x-1/2 z-30">
                                  <span className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border border-amber-200 shadow-sm whitespace-nowrap">
                                     Layover: {getLayoverDuration(seg.arrival_time, nextSeg.departure_time)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}