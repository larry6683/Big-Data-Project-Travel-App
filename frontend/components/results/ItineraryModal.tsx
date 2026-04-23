"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Plane,
  Hotel,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Download,
  Share2,
  Loader2,
  Send,
  Car,
  Ticket,
  Sun,
  Camera,
  Save,
} from "lucide-react";
import { travelApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawParams: any;
  weatherData?: any;
}

export default function ItineraryModal({
  isOpen,
  onClose,
  rawParams,
  weatherData,
}: ItineraryModalProps) {
  const [selections, setSelections] = useState<any>({});
  const [isExporting, setIsExporting] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);

  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("trip_state");
      if (saved) {
        try {
          setSelections(JSON.parse(saved));
        } catch (e) {
          setSelections({});
        }
      } else {
        setSelections({});
      }

      setShowEmailInput(false);
      setEmail("");
      setIsSaved(false);
      setIsAlreadySaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const flight = Array.isArray(selections?.flights)
    ? selections.flights[0]
    : selections?.flights;

  let rawDrive = selections?.drive || selections?.driving;
  let drive = null;
  if (rawDrive) {
    if (Array.isArray(rawDrive)) {
      drive = rawDrive[0];
    } else if (rawDrive.data) {
      drive = rawDrive.data;
    } else {
      drive = rawDrive;
    }
  }

  const stay = Array.isArray(selections?.stays)
    ? selections.stays[0]
    : selections?.stays;
  const attractions = selections?.attractions || [];
  const tours = selections?.tours || selections?.activities || [];

  const isWeatherSelected = selections?.weather?.selected === true;

  const getFuelCost = () => {
    if (!drive) return 0;
    if (drive.distance_km) {
      const miles = drive.distance_km * 0.621371;
      const gallons = miles / 25;
      return gallons * 3.35;
    }
    const fuel = drive.fuelEstimate || drive.fuel_estimate || drive.price || 0;
    if (typeof fuel === "string") return Number(fuel.replace(/[^0-9.-]+/g, ""));
    return Number(fuel);
  };

  let displayDriveDuration = "N/A";
  if (drive?.duration_mins) {
    const hrs = Math.floor(drive.duration_mins / 60);
    const mins = Math.round(drive.duration_mins % 60);
    displayDriveDuration = `${hrs}h ${mins}m`;
  } else if (drive?.duration?.text || drive?.duration) {
    displayDriveDuration = drive.duration.text || drive.duration;
  }

  let displayDriveDistance = "Distance N/A";
  if (drive?.distance_km) {
    const miles = (drive.distance_km * 0.621371).toFixed(0);
    displayDriveDistance = `${miles} Mi`;
  } else if (drive?.distance?.text || drive?.distance) {
    displayDriveDistance = drive.distance.text || drive.distance;
  }

  let totalCost = 0;
  if (flight) {
    totalCost += Number(flight.price?.total || flight.price || 0);
  } else if (drive) {
    totalCost += getFuelCost();
  }

  if (stay) totalCost += Number(stay.offerDetails?.price || stay.price || 0);
  tours.forEach((t: any) => {
    if (t.price && t.price.amount) {
      totalCost += parseFloat(t.price.amount);
    }
  });

  let firstDayWeather = null;
  if (isWeatherSelected) {
    const activeWeatherData = selections?.weather?.data || weatherData;
    if (activeWeatherData?.days && activeWeatherData.days.length > 0) {
      firstDayWeather = activeWeatherData.days[0];
    } else if (
      activeWeatherData?.data?.days &&
      activeWeatherData.data.days.length > 0
    ) {
      firstDayWeather = activeWeatherData.data.days[0];
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const localDate = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    return localDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getLayoverTime = (arrivalStr: string, departureStr: string) => {
    if (!arrivalStr || !departureStr) return null;
    const arr = new Date(arrivalStr).getTime();
    const dep = new Date(departureStr).getTime();
    const diffMs = dep - arr;
    if (diffMs <= 0) return null;

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
    return `${diffMins}m`;
  };

  const getFullTripTitle = () => {
    const source =
      rawParams?.source?.name?.split(",")[0] || rawParams?.source?.city;
    const dest =
      rawParams?.destination?.name?.split(",")[0] ||
      rawParams?.destination?.city ||
      "Trip";
    return source ? `${source} to ${dest}` : dest;
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const cachedTripStr = sessionStorage.getItem("current_trip_results");
      const cachedTrip = cachedTripStr ? JSON.parse(cachedTripStr) : {};

      const pdfBlob = await travelApi.exportPdf({
        destination: getFullTripTitle(),
        username: user || "Traveler",
        check_in_date: rawParams?.startDate,
        check_out_date: rawParams?.endDate,
        weather: isWeatherSelected
          ? selections?.weather?.data || weatherData || cachedTrip.weather
          : null,
        flight: flight,
        drive: drive
          ? {
              distance: displayDriveDistance,
              duration: displayDriveDuration,
              fuelEstimate: getFuelCost(),
            }
          : null,
        hotel: stay,
        attractions: attractions,
        activities: tours,
      });

      if (pdfBlob) {
        const url = window.URL.createObjectURL(new Blob([pdfBlob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `${getFullTripTitle().replace(/\s+/g, "_")}.pdf`
        );
        document.body.appendChild(link);
        link.click();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF Itinerary.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    setIsSharing(true);
    try {
      const cachedTripStr = sessionStorage.getItem("current_trip_results");
      const cachedTrip = cachedTripStr ? JSON.parse(cachedTripStr) : {};

      const payload = {
        destination: getFullTripTitle(),
        username: user || "Traveler",
        check_in_date: rawParams?.startDate,
        check_out_date: rawParams?.endDate,
        weather: isWeatherSelected
          ? selections?.weather?.data || weatherData || cachedTrip.weather
          : null,
        flight: flight,
        drive: drive
          ? {
              distance: displayDriveDistance,
              duration: displayDriveDuration,
              fuelEstimate: getFuelCost(),
            }
          : null,
        hotel: stay,
        attractions: attractions,
        activities: tours,
      };

      await travelApi.sharePdf(payload, email);
      alert("Itinerary sent successfully!");
      setShowEmailInput(false);
      setEmail("");
    } catch (error) {
      console.error(error);
      alert("Failed to send itinerary to email.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!isLoggedIn) return;
    setIsSaving(true);
    setIsAlreadySaved(false);

    try {
      const tripDataToSave = {
        destination:
          rawParams?.destination?.city ||
          rawParams?.destination?.name ||
          "Trip",
        check_in_date: rawParams?.startDate,
        check_out_date: rawParams?.endDate,

        flight: flight
          ? {
              airline_name: flight.airline_name,
              price: flight.price?.total || flight.price,
              itineraries: (flight.itineraries || []).map((itin: any) => ({
                segments: (itin.segments || []).map((seg: any) => ({
                  departure_airport: seg.departure_airport,
                  arrival_airport: seg.arrival_airport,
                  departure_time: seg.departure_time,
                  arrival_time: seg.arrival_time,
                })),
              })),
            }
          : null,

        drive: drive
          ? {
              distance: displayDriveDistance,
              duration: displayDriveDuration,
              fuelEstimate: getFuelCost(),
            }
          : null,

        hotel: stay
          ? {
              name: stay.name,
              price: stay.offerDetails?.price || stay.price,
              address: { lines: stay.address?.lines || [] },
            }
          : null,

        attractions: attractions
          ? attractions.map((a: any) => ({ name: a.name }))
          : [],
        activities: tours
          ? tours.map((t: any) => ({ name: t.name || t.title }))
          : [],

        rawParams: {
          source: {
            name:
              rawParams?.source?.name?.split(",")[0] || rawParams?.source?.city,
          },
          startDate: rawParams?.startDate,
          endDate: rawParams?.endDate,
        },
      };

      const response = await travelApi.saveTrip(tripDataToSave);

      if (response && response.message === "Trip already saved!") {
        setIsAlreadySaved(true);
      } else {
        setIsSaved(true);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save the trip. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-theme-text/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-theme-bg w-full max-w-6xl max-h-[92vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-theme-surface">
        
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center bg-theme-bg border-b border-theme-surface shrink-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-theme-text tracking-tight">
              Your Custom Itinerary
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2.5 py-1 rounded-md bg-theme-surface text-theme-secondary text-[10px] font-black uppercase tracking-widest">
                {rawParams?.source?.name?.split(",")[0] || "Origin"}
              </span>
              <span className="text-theme-muted font-bold text-xs">➔</span>
              <span className="px-2.5 py-1 rounded-md bg-theme-primary/10 text-theme-primary text-[10px] font-black uppercase tracking-widest">
                {rawParams?.destination?.name?.split(",")[0] || "Destination"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-theme-surface hover:bg-theme-muted/20 rounded-full transition-colors border border-theme-surface shadow-sm shrink-0 active:scale-95"
          >
            <X size={20} className="text-theme-text" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            
            {/* LEFT COLUMN: Summary & Cost */}
            <div className="lg:col-span-1 flex flex-col gap-5">
              <SummaryCard
                icon={<Calendar size={18} />}
                label="Trip Dates"
                value={`${formatDate(rawParams?.startDate)} - ${formatDate(
                  rawParams?.endDate
                )}`}
              />
              <SummaryCard
                icon={<Users size={18} />}
                label="Travelers"
                value={`${rawParams?.adults || 0} Adults, ${
                  rawParams?.children || 0
                } Children`}
              />
              
              {/* Highlighted Cost Card */}
              <div className="p-6 rounded-3xl bg-theme-secondary border border-theme-secondary text-theme-bg shadow-xl">
                <div className="flex items-center gap-2 text-theme-bg/70 mb-2">
                  <DollarSign size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Est. Total Cost
                  </span>
                </div>
                <p className="font-black text-4xl tracking-tight text-theme-bg">
                  ${totalCost.toFixed(2)}
                </p>
              </div>

              {/* Weather Forecast */}
              {isWeatherSelected && firstDayWeather && (
                <div className="mt-2 p-5 rounded-3xl bg-theme-surface border border-theme-surface shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-text/70">
                      Arrival Weather
                    </span>
                    <Sun size={20} className="text-theme-accent" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-theme-text leading-none">
                      {Math.round(
                        firstDayWeather.max_temp ??
                          firstDayWeather.temperature_max ??
                          0
                      )}°
                    </span>
                    <span className="text-sm font-bold text-theme-muted mb-1">
                      / {Math.round(
                        firstDayWeather.min_temp ??
                          firstDayWeather.temperature_min ??
                          0
                      )}° F
                    </span>
                  </div>
                  <p className="text-xs font-black text-theme-text/80 mt-2 uppercase tracking-widest">
                    {firstDayWeather.weather ??
                      firstDayWeather.weather_description ??
                      "Clear skies"}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Itinerary Details */}
            <div className="lg:col-span-2 flex flex-col gap-10">
              
              {/* Transport Section */}
              <section>
                <SectionTitle icon={flight ? <Plane size={18} /> : <Car size={18} />} title="Transportation" />
                {flight ? (
                  <div className="bg-theme-bg rounded-3xl p-6 border border-theme-surface shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-theme-primary"></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
                      <span className="font-black text-2xl text-theme-text">
                        {flight.airline_name}
                      </span>
                      <span className="text-theme-primary font-black text-xl bg-theme-primary/10 px-4 py-1.5 rounded-xl inline-block w-fit">
                        ${Number(flight.price?.total || flight.price || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-5">
                      {(flight.itineraries || []).map((itin: any, idx: number) => {
                        const stops = itin.segments?.length ? itin.segments.length - 1 : 0;
                        const boundDate = itin.segments?.[0]?.departure_time
                          ? formatShortDate(itin.segments[0].departure_time)
                          : "";

                        return (
                          <div key={idx} className="bg-theme-surface/40 p-5 rounded-2xl border border-theme-surface">
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-theme-surface">
                              <span className="text-[11px] uppercase font-black text-theme-text/70 tracking-widest">
                                {idx === 0 ? "🛫 Outbound" : "🛬 Return"} {boundDate && `• ${boundDate}`}
                              </span>
                              <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md ${
                                stops === 0 ? "bg-theme-primary/10 text-theme-primary" : "bg-theme-accent/20 text-theme-accent"
                              }`}>
                                {stops === 0 ? "Direct" : `${stops} Stop(s)`}
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                              {(itin.segments || []).map((seg: any, sIdx: number) => {
                                let layoverStr = null;
                                if (sIdx > 0) {
                                  const prevSeg = itin.segments[sIdx - 1];
                                  layoverStr = getLayoverTime(prevSeg.arrival_time, seg.departure_time);
                                }

                                return (
                                  <React.Fragment key={sIdx}>
                                    {layoverStr && (
                                      <div className="flex items-center justify-center my-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary bg-theme-surface px-4 py-1.5 rounded-full border border-theme-surface drop-shadow-sm">
                                          ⏱ Layover: {layoverStr}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-4 text-theme-text/80 my-1 bg-theme-bg p-4 rounded-xl border border-theme-surface/50 shadow-sm">
                                      <div className="flex-1">
                                        <p className="font-black text-2xl text-theme-text">
                                          {formatTime(seg.departure_time)}
                                        </p>
                                        <p className="text-[11px] font-black text-theme-muted uppercase tracking-widest mt-1">
                                          {seg.departure_airport}
                                        </p>
                                      </div>
                                      <div className="h-[2px] flex-1 bg-theme-surface relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-theme-bg px-2 text-[10px]">
                                          ✈️
                                        </div>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <p className="font-black text-2xl text-theme-text">
                                          {formatTime(seg.arrival_time)}
                                        </p>
                                        <p className="text-[11px] font-black text-theme-muted uppercase tracking-widest mt-1">
                                          {seg.arrival_airport}
                                        </p>
                                      </div>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : drive ? (
                  <div className="bg-theme-bg rounded-3xl p-6 border border-theme-surface shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-theme-primary"></div>
                    <div className="flex justify-between items-center mb-5">
                      <span className="font-black text-2xl text-theme-text">
                        Road Trip
                      </span>
                      <span className="text-theme-primary font-black text-lg bg-theme-primary/10 px-4 py-1.5 rounded-xl">
                        {displayDriveDuration}
                      </span>
                    </div>
                    <div className="flex justify-between items-end bg-theme-surface/40 p-5 rounded-2xl border border-theme-surface">
                      <div>
                        <p className="font-black text-lg text-theme-text flex items-center gap-2">
                          <span>{drive?.sourceName || rawParams?.source?.name?.split(",")[0] || "Origin"}</span>
                          <span className="text-theme-muted text-sm">➔</span>
                          <span>{drive?.destinationName || rawParams?.destination?.name?.split(",")[0] || "Destination"}</span>
                        </p>
                        <p className="text-[11px] text-theme-muted font-black mt-2 uppercase tracking-widest">
                          Total Distance: {displayDriveDistance}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-theme-primary font-black text-2xl">
                          ${getFuelCost().toFixed(2)}
                        </p>
                        <p className="text-[10px] text-theme-muted font-black uppercase tracking-widest mt-1">
                          Fuel Estimate
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptySelection text="No transportation selected" />
                )}
              </section>

              {/* Stay Section */}
              <section>
                <SectionTitle icon={<Hotel size={18} />} title="Accommodation" />
                {stay ? (
                  <div className="bg-theme-bg rounded-3xl p-6 border border-theme-surface shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-theme-secondary"></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <h4 className="font-black text-xl text-theme-text leading-tight mb-2">
                          {stay.name}
                        </h4>
                        <p className="text-[11px] text-theme-text/60 font-black uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin size={14} className="text-theme-muted" />{" "}
                          <span className="line-clamp-1">{stay.address?.lines?.join(", ")}</span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0 bg-theme-surface/40 px-4 py-3 rounded-2xl border border-theme-surface">
                        <p className="text-theme-secondary font-black text-2xl">
                          ${Number(stay.offerDetails?.price || stay.price || 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-theme-muted font-black uppercase tracking-widest mt-1">
                          Total Stay
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptySelection text="No hotel selected" />
                )}
              </section>

              {/* Attractions Section */}
              <section>
                <SectionTitle icon={<Camera size={18} />} title="Planned Attractions" />
                {attractions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {attractions.map((attr: any, idx: number) => (
                      <div key={idx} className="bg-theme-bg rounded-2xl p-4 border border-theme-surface shadow-sm flex items-center gap-4 hover:border-theme-muted transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-theme-surface flex items-center justify-center shrink-0 group-hover:bg-theme-primary/10 transition-colors">
                          <MapPin size={18} className="text-theme-secondary group-hover:text-theme-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-base text-theme-text truncate">
                            {attr.name}
                          </h5>
                          <p className="text-[10px] text-theme-muted font-black uppercase tracking-widest truncate mt-1">
                            {attr.category || attr.kinds?.split(",")[0]?.replace(/_/g, " ") || "Point of Interest"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptySelection text="No attractions added" />
                )}
              </section>

              {/* Tours & Activities Section */}
              <section>
                <SectionTitle icon={<Ticket size={18} />} title="Tours & Activities" />
                {tours.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {tours.map((tour: any, idx: number) => (
                      <div key={idx} className="bg-theme-bg rounded-2xl p-5 border border-theme-surface shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-lg text-theme-text line-clamp-2 leading-snug">
                            {tour.name || tour.title}
                          </h5>
                          {tour.rating && (
                            <div className="mt-2 inline-flex items-center gap-1.5 bg-theme-accent/10 px-2.5 py-1 rounded-md">
                              <span className="text-theme-accent text-xs">★</span>
                              <p className="text-[10px] text-theme-text/80 font-black uppercase tracking-widest">
                                {tour.rating} Rating
                              </p>
                            </div>
                          )}
                        </div>
                        {tour.price && tour.price.amount && (
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-theme-primary font-black text-2xl">
                              ${parseFloat(tour.price.amount).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-theme-muted font-black uppercase tracking-widest mt-1">
                              Per Person
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptySelection text="No tours or activities booked" />
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:p-8 border-t border-theme-surface bg-theme-surface/30 shrink-0 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-4">
            
            {/* Primary Action: Save */}
            {isLoggedIn && (
              <button
                onClick={handleSaveTrip}
                disabled={isSaving || isSaved || isAlreadySaved || isExporting || isSharing}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] ${
                  isSaving || isSaved || isAlreadySaved || isExporting || isSharing
                    ? "bg-theme-surface text-theme-muted cursor-not-allowed shadow-none border border-theme-surface"
                    : "bg-theme-secondary text-theme-bg shadow-xl hover:opacity-95"
                }`}
              >
                {isSaving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : isAlreadySaved ? (
                  <Save size={20} className="text-theme-accent" />
                ) : isSaved ? (
                  <Save size={20} className="text-theme-primary" />
                ) : (
                  <Save size={20} />
                )}
                {isSaving ? "Saving..." : isAlreadySaved ? "Already Saved" : isSaved ? "Saved!" : "Save Trip"}
              </button>
            )}

            {/* Primary Action: Download */}
            <button
              onClick={handleExportPdf}
              disabled={isExporting || isSharing || isSaving}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] ${
                isExporting || isSharing || isSaving
                  ? "bg-theme-surface text-theme-muted cursor-not-allowed shadow-none border border-theme-surface"
                  : "bg-theme-primary text-theme-bg shadow-xl hover:opacity-95"
              }`}
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              {isExporting ? "Generating..." : "Download PDF"}
            </button>

            {/* Secondary Action: Share */}
            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              disabled={isExporting || isSharing || isSaving}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-[15px] transition-all active:scale-[0.98] bg-theme-bg border border-theme-surface text-theme-text shadow-sm hover:border-theme-muted hover:shadow-md ${
                (isExporting || isSharing || isSaving) && "opacity-50 cursor-not-allowed hover:border-theme-surface hover:shadow-sm"
              }`}
            >
              <Share2 size={20} />
              Share
            </button>
          </div>

          {/* Email Input Expansion */}
          {showEmailInput && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-4 rounded-2xl border border-theme-surface bg-theme-bg text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all font-bold text-sm shadow-inner"
              />
              <button
                onClick={handleSharePdf}
                disabled={isSharing || !email}
                className="px-8 py-4 bg-theme-text text-theme-bg font-black text-sm rounded-2xl hover:bg-theme-text/80 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
              >
                {isSharing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// SLEEK UI SUB-COMPONENTS
// ---------------------------

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 bg-theme-secondary text-theme-bg rounded-xl shadow-md">
        {icon}
      </div>
      <h3 className="font-black text-theme-text uppercase tracking-widest text-[13px]">
        {title}
      </h3>
    </div>
  );
}

function SummaryCard({ icon, label, value }: any) {
  return (
    <div className="p-5 rounded-3xl bg-theme-surface border border-theme-surface shadow-sm">
      <div className="flex items-center gap-2 text-theme-text/60 mb-2">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="font-black text-lg leading-snug text-theme-text">
        {value}
      </p>
    </div>
  );
}

function EmptySelection({ text }: { text: string }) {
  return (
    <div className="p-6 border-2 border-dashed border-theme-surface bg-theme-bg rounded-3xl text-center flex items-center justify-center min-h-[100px]">
      <span className="text-[11px] text-theme-muted font-black tracking-widest uppercase">
        {text}
      </span>
    </div>
  );
}