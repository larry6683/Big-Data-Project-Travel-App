// frontend/components/results/FlightCard.tsx
import React, { useState, useMemo, useEffect } from "react";

type SortOption = "price_asc" | "price_desc" | "duration_asc" | "duration_desc";

export default function FlightCard({
  flights,
  loading,
}: {
  flights: any[];
  loading?: boolean;
}) {
  const [sortBy, setSortBy] = useState<SortOption>("price_asc");
  const [selectedFlightKeys, setSelectedFlightKeys] = useState<string[]>([]);

  useEffect(() => {
    const tripStateStr = localStorage.getItem("trip_state");
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.flights && tripState.flights.length > 0) {
          setSelectedFlightKeys(
            tripState.flights.map((f: any) => f._selectionKey)
          );
        } else {
          setSelectedFlightKeys([]);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [flights]);

  const toggleFlightSelection = (flight: any, uniqueKey: string) => {
    const tripStateStr = localStorage.getItem("trip_state");
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

    localStorage.setItem("trip_state", JSON.stringify(tripState));
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "TBA";
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timeString: string) => {
    if (!timeString) return "";
    return new Date(timeString).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (durationString?: string) => {
    if (!durationString) return "";
    return durationString.toLowerCase().replace("h", "h ").replace("m", "m");
  };

  const getLayoverDuration = (
    arrivalTime: string,
    nextDepartureTime: string
  ) => {
    if (!arrivalTime || !nextDepartureTime) return "";
    const arr = new Date(arrivalTime).getTime();
    const dep = new Date(nextDepartureTime).getTime();
    const diffMins = Math.floor((dep - arr) / (1000 * 60));
    if (diffMins <= 0) return "";
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getPrice = (f: any) => {
    const rawPrice = f.price?.grandTotal || f.price?.total || f.price || 0;
    if (typeof rawPrice === "number") return rawPrice;
    return parseFloat(String(rawPrice).replace(/[^\d.-]/g, "")) || 0;
  };

  const getDuration = (f: any) => {
    if (!f.itineraries) return 0;
    return f.itineraries.reduce((sum: number, itin: any) => {
      const cleanStr = (itin.duration || "").toUpperCase().replace("PT", "");
      let hours = 0,
        minutes = 0;
      const hMatch = cleanStr.match(/(\d+)H/);
      const mMatch = cleanStr.match(/(\d+)M/);
      if (hMatch) hours = parseInt(hMatch[1], 10);
      if (mMatch) minutes = parseInt(mMatch[1], 10);
      return sum + hours * 60 + minutes;
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
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "duration_asc":
          return durA - durB;
        case "duration_desc":
          return durB - durA;
        default:
          return 0;
      }
    });
  }, [flights, sortBy]);

  if (loading) return null;

  if (!flights || !Array.isArray(flights) || flights.length === 0) {
    return (
      <div className="p-8 text-center bg-theme-bg border border-dashed border-theme-secondary/20 rounded-xl text-theme-text/70 shadow-sm">
        <span className="text-3xl block mb-2">📭</span>
        <h3 className="text-base font-bold text-theme-text">
          No flights found
        </h3>
        <p className="text-sm">Try adjusting your search dates or locations.</p>
      </div>
    );
  }

  const SortBtn = ({ id, label }: { id: SortOption; label: string }) => {
    const isActive = sortBy === id;
    return (
      <button
        onClick={() => setSortBy(id)}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${
          isActive
            ? "bg-theme-primary text-theme-bg border-theme-primary shadow-sm"
            : "bg-theme-bg text-theme-text/80 border-theme-secondary hover:bg-theme-surface"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col xl:flex-row justify-between xl:items-end border-b border-theme-secondary/20 pb-3 gap-2">
        <div>
          <p className="align-items-center text-xs text-theme-text">
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
        const uniqueKey = flight.id
          ? `${flight.id}-${flightIndex}`
          : `flight-${flightIndex}`;
        const isSelected = selectedFlightKeys.includes(uniqueKey);

        return (
          <div
            key={uniqueKey}
            className={`rounded-lg overflow-hidden transition-all duration-200 border ${
              isSelected
                ? "border-theme-primary ring-1 ring-theme-primary bg-theme-surface/20 shadow-sm"
                : "border-theme-secondary/20 bg-theme-surface/20 hover:shadow-md"
            }`}
          >
            {/* Header */}
            <div
              className={`px-3 py-1 border-b flex justify-between items-center ${
                isSelected
                  ? "bg-theme-bg/20 border-theme-secondary/20"
                  : "bg-theme-bg/20 border-theme-secondary/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center overflow-hidden relative shrink-0">
                  <img
                    src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`}
                    alt={flight.airline_code}
                    className="max-w-[80%] max-h-[80%] object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-theme-text leading-none mb-0 flex items-center gap-2">
                    {flight.airline_name || flight.airline_code}
                    <span className="inline-block px-2 py-0.5 bg-theme-surface text-theme-text/80 text-[10px] uppercase tracking-widest font-bold rounded">
                      {flight.cabin_class}
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right leading-none">
                  <p className="text-2xl font-black text-theme-primary tracking-tight">
                    ${getPrice(flight).toFixed(2)}
                    <span className="text-[10px] text-theme-text/70 font-bold tracking-wider ml-1">
                      {flight.currency}
                    </span>
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-theme-bg text-theme-text px-4 py-2 rounded-lg hover:bg-theme-surface border border-theme-secondary transition-colors shadow-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFlightSelection(flight, uniqueKey)}
                    className="w-4 h-4 accent-theme-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-theme-text/80 select-none w-[56px] inline-block text-center">
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap w-full">
              {flight.itineraries?.map((itinerary: any, itinIndex: number) => {
                const isOutbound = itinIndex === 0;
                const theme = isOutbound
                  ? {
                      bg: "bg-transparent",
                      text: "text-theme-primary",
                      badgeBg: "bg-theme-muted/30",
                      icon: "🛫",
                      label: "Outbound",
                    }
                  : {
                      bg: "bg-transparent",
                      text: "text-theme-secondary",
                      badgeBg: "bg-theme-muted/40",
                      icon: "🛬",
                      label: "Return",
                    };
                const departureDate = itinerary.segments?.[0]?.departure_time;

                return (
                  <div
                    key={itinIndex}
                    // IMPORTANT: min-w-0 here ensures the entire itinerary column doesn't stretch and break flex-wrap!
                    className={`flex-1 min-w-0 basis-[340px] p-4 ${theme.bg} ${
                      isOutbound
                        ? "border-b xl:border-b-0 xl:border-r border-theme-secondary/20"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-black uppercase tracking-widest ${theme.badgeBg} ${theme.text}`}
                        >
                          {theme.icon} {theme.label}
                        </span>
                        <span className="text-xs font-bold text-theme-text/70">
                          {formatDate(departureDate)}
                        </span>
                      </div>
                      <div className="text-right leading-none shrink-0">
                        <p className="text-xs font-bold text-theme-text">
                          {formatDuration(itinerary.duration)}
                        </p>
                        <p
                          className={`text-xs font-bold mt-0.5 ${
                            itinerary.stops === 0
                              ? "text-theme-secondary"
                              : "text-theme-accent"
                          }`}
                        >
                          {itinerary.stops === 0
                            ? "Direct"
                            : `${itinerary.stops} Stop(s)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0 relative">
                      {itinerary.segments.length > 1 && (
                        <div className="absolute left-[5.5px] top-3 bottom-3 w-[2px] bg-theme-surface z-0"></div>
                      )}

                      {itinerary.segments?.map((seg: any, segIndex: number) => {
                        const isLast =
                          segIndex === itinerary.segments.length - 1;
                        const nextSeg = itinerary.segments[segIndex + 1];

                        return (
                          <div
                            key={segIndex}
                            className={`relative z-10 flex gap-3 ${
                              isLast ? "" : "mb-3"
                            }`}
                          >
                            <div className="flex flex-col items-center mt-1">
                              <div
                                className={`w-3 h-3 rounded-full border-2 bg-theme-bg relative z-20 ${
                                  isOutbound
                                    ? "border-theme-secondary"
                                    : "border-theme-accent"
                                }`}
                              ></div>
                            </div>

                            <div className="flex-1 min-w-0 bg-theme-bg p-3 rounded-lg border border-theme-secondary/20 shadow-sm relative">
                              {/* --- START OF RESPONSIVE FIX --- */}
                              <div className="flex justify-between items-start gap-2">
                                {/* Departure side: added min-w-0 and break-words */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-lg font-black text-theme-text leading-none">
                                    {formatTime(seg.departure_time)}
                                  </p>
                                  <p className="text-xs font-bold text-theme-text/70 mt-0.5 break-words">
                                    {seg.departure_airport_name || "Airport"}{" "}
                                    <span className="whitespace-nowrap">
                                      ({seg.departure_airport})
                                    </span>
                                  </p>
                                </div>

                                {/* Center section: added shrink-0 to prevent crushing */}
                                <div className="flex flex-col items-center px-1 shrink-0 mt-1">
                                  <span className="text-[10px] text-theme-muted font-bold tracking-widest uppercase mb-0.5 text-center">
                                    {seg.carrier_code} {seg.flight_number}
                                  </span>
                                  <div className="w-12 sm:w-20 h-[2px] bg-theme-surface mb-1"></div>
                                  <div className="flex items-center gap-1 text-xs font-bold text-theme-text/70">
                                    <span
                                      className="flex items-center gap-0.5 bg-theme-surface px-1 py-0.5 rounded"
                                      title="Personal item"
                                    >
                                      🎒 {seg.personal_item ?? 1}
                                    </span>
                                    <span
                                      className="flex items-center gap-0.5 bg-theme-surface px-1 py-0.5 rounded"
                                      title="Cabin bag"
                                    >
                                      💼 {seg.cabin_bags ?? 0}
                                    </span>
                                    <span
                                      className="flex items-center gap-0.5 bg-theme-surface px-1 py-0.5 rounded"
                                      title="Checked bag"
                                    >
                                      🧳 {seg.checked_bags ?? 0}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrival side: added min-w-0 and break-words */}
                                <div className="flex-1 min-w-0 text-right">
                                  <p className="text-lg font-black text-theme-text leading-none">
                                    {formatTime(seg.arrival_time)}
                                  </p>
                                  <p className="text-xs font-bold text-theme-text/70 mt-0.5 break-words">
                                    {seg.arrival_airport_name || "Airport"}{" "}
                                    <span className="whitespace-nowrap">
                                      ({seg.arrival_airport})
                                    </span>
                                  </p>
                                </div>
                              </div>
                              {/* --- END OF RESPONSIVE FIX --- */}

                              {!isLast && nextSeg && (
                                <div className="absolute left-1/2 -bottom-4 transform -translate-x-1/2 z-30">
                                  <span className="bg-theme-accent/20 text-theme-accent text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border border-theme-secondary/40 shadow-sm whitespace-nowrap">
                                    Layover:{" "}
                                    {getLayoverDuration(
                                      seg.arrival_time,
                                      nextSeg.departure_time
                                    )}
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
