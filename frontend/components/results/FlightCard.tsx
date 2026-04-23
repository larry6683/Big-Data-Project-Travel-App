import React, { useState, useMemo, useEffect } from 'react';

type SortOption = 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

export default function FlightCard({ flights, loading }: { flights: any[], loading?: boolean }) {
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [selectedFlightKeys, setSelectedFlightKeys] = useState<string[]>([]);

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

  const toggleFlightSelection = (flight: any, uniqueKey: string) => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};

    const isSelected = selectedFlightKeys.includes(uniqueKey);

    if (isSelected) {
      tripState.flights = [];
      setSelectedFlightKeys([]);
    } else {
      const flightToSave = { ...flight, _selectionKey: uniqueKey };
      tripState.flights = [flightToSave];
      setSelectedFlightKeys([uniqueKey]);
    }

    localStorage.setItem('trip_state', JSON.stringify(tripState)); 
  };

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

  if (loading) return null; 

  if (!flights || !Array.isArray(flights) || flights.length === 0) {
    return (
      <div className="p-8 text-center bg-theme-bg border border-dashed border-theme-secondary/20 rounded-xl text-theme-text/70 shadow-sm">
        <span className="text-3xl block mb-2">📭</span>
        <h3 className="text-base font-bold text-theme-text">No flights found</h3>
        <p className="text-sm">Try adjusting your search dates or locations.</p>
      </div>
    );
  }

  const SortBtn = ({ id, label }: { id: SortOption, label: string }) => {
    const isActive = sortBy === id;
    return (
      <button
        onClick={() => setSortBy(id)}
        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all border ${
          isActive ? 'bg-theme-secondary text-theme-bg border-theme-secondary shadow-md' : 'bg-theme-bg text-theme-text/80 border-theme-surface hover:bg-theme-surface'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col xl:flex-row justify-between xl:items-end border-b border-theme-surface pb-4 gap-3">
        <div>
          <p className="align-items-center text-xs font-bold text-theme-muted uppercase tracking-wider">
            Showing {Math.min(flights.length, 12)} of {flights.length} options
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SortBtn id="price_asc" label="Lowest Price" />
          <SortBtn id="price_desc" label="Highest Price" />
          <SortBtn id="duration_asc" label="Shortest" />
          <SortBtn id="duration_desc" label="Longest" />
        </div>
      </div>
      
      {sortedFlights.slice(0, 12).map((flight, flightIndex) => {
        const uniqueKey = flight.id ? `${flight.id}-${flightIndex}` : `flight-${flightIndex}`;
        const isSelected = selectedFlightKeys.includes(uniqueKey);

        return (
          <div 
            key={uniqueKey} 
            className={`rounded-xl overflow-hidden transition-all duration-200 border ${
              isSelected ? 'border-theme-primary ring-2 ring-theme-primary bg-theme-surface/30 shadow-md' : 'border-theme-surface bg-theme-surface/20 hover:shadow-lg hover:border-theme-muted'
            }`}
          >
            {/* Header */}
            <div className={`px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isSelected ? 'bg-theme-primary/5 border-theme-primary/20' : 'bg-theme-bg/50 border-theme-surface'}`}>
              <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-theme-bg rounded-lg border border-theme-surface flex items-center justify-center overflow-hidden relative shrink-0 shadow-sm">
                  <img src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`} alt={flight.airline_code} className="max-w-[80%] max-h-[80%] object-contain" />
                </div>
                <div>
                  <h4 className="font-extrabold text-theme-text leading-none flex items-center gap-2">
                    {flight.airline_name || flight.airline_code} 
                    <span className="inline-block px-2 py-0.5 bg-theme-surface text-theme-secondary text-[10px] uppercase tracking-widest font-black rounded-md">
                      {flight.cabin_class}
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-5">
                <div className="text-left sm:text-right leading-none">
                  <p className="text-2xl font-black text-theme-primary tracking-tight">
                    ${getPrice(flight).toFixed(2)} 
                    <span className="text-xs text-theme-muted font-bold tracking-wider ml-1">{flight.currency}</span>
                  </p>
                </div>

                <button 
                  onClick={() => toggleFlightSelection(flight, uniqueKey)} 
                  className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm shrink-0 active:scale-95 ${
                    isSelected 
                      ? 'bg-theme-primary text-theme-bg' 
                      : 'bg-theme-secondary text-theme-bg hover:bg-theme-secondary/90'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap w-full">
              {flight.itineraries?.map((itinerary: any, itinIndex: number) => {
                const isOutbound = itinIndex === 0;
                const departureDate = itinerary.segments?.[0]?.departure_time;

                return (
                  <div 
                    key={itinIndex} 
                    className={`flex-1 basis-[340px] p-5 bg-transparent ${
                      isOutbound ? 'border-b xl:border-b-0 xl:border-r border-theme-surface' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isOutbound ? 'bg-theme-primary/10 text-theme-primary' : 'bg-theme-secondary/10 text-theme-secondary'}`}>
                          {isOutbound ? '🛫 Outbound' : '🛬 Return'}
                        </span>
                        <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">{formatDate(departureDate)}</span>
                      </div>
                      <div className="text-right leading-none">
                        <p className="text-xs font-black text-theme-text">{formatDuration(itinerary.duration)}</p>
                        <p className={`text-[10px] uppercase font-black tracking-wider mt-1 ${itinerary.stops === 0 ? 'text-theme-primary' : 'text-theme-accent'}`}>
                          {itinerary.stops === 0 ? 'Direct' : `${itinerary.stops} Stop(s)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0 relative">
                      {itinerary.segments.length > 1 && (
                        <div className="absolute left-[5.5px] top-3 bottom-3 w-[2px] bg-theme-surface z-0"></div>
                      )}

                      {itinerary.segments?.map((seg: any, segIndex: number) => {
                        const isLast = segIndex === itinerary.segments.length - 1;
                        const nextSeg = itinerary.segments[segIndex + 1];

                        return (
                          <div key={segIndex} className={`relative z-10 flex gap-3 ${isLast ? '' : 'mb-4'}`}>
                            <div className="flex flex-col items-center mt-1.5">
                              <div className={`w-3 h-3 rounded-full border-[3px] bg-theme-bg relative z-20 ${isOutbound ? 'border-theme-primary' : 'border-theme-secondary'}`}></div>
                            </div>

                            <div className="flex-1 bg-theme-bg p-4 rounded-xl border border-theme-surface shadow-sm relative">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xl font-black text-theme-text leading-none">{formatTime(seg.departure_time)}</p>
                                  <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider mt-1.5">
                                    {seg.departure_airport}
                                  </p>
                                </div>
                                <div className="flex flex-col items-center px-2">
                                  <span className="text-[10px] text-theme-text/50 font-bold tracking-widest uppercase mb-1">
                                    {seg.carrier_code} {seg.flight_number}
                                  </span>
                                  <div className="w-16 sm:w-24 h-[2px] bg-theme-surface mb-1.5 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-theme-muted">✈️</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-black text-theme-text leading-none">{formatTime(seg.arrival_time)}</p>
                                  <p className="text-[11px] font-bold text-theme-muted uppercase tracking-wider mt-1.5">
                                    {seg.arrival_airport}
                                  </p>
                                </div>
                              </div>
                              {!isLast && nextSeg && (
                                <div className="absolute left-1/2 -bottom-3.5 transform -translate-x-1/2 z-30">
                                  <span className="bg-theme-surface text-theme-text text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full border border-theme-muted/30 shadow-sm whitespace-nowrap">
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