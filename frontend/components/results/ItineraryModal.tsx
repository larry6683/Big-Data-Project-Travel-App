// frontend/components/results/ItineraryModal.tsx
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

  // PDF Download State
  const [isExporting, setIsExporting] = useState(false);

  // PDF Share State
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // Save Trip State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);

  // Grab user and isLoggedIn from AuthContext
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

      // Reset states when opened
      setShowEmailInput(false);
      setEmail("");
      setIsSaved(false);
      setIsAlreadySaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract selected items
  const flight = Array.isArray(selections?.flights)
    ? selections.flights[0]
    : selections?.flights;

  // FIXED: Properly extract driving data by checking for the .data property
  let rawDrive = selections?.drive || selections?.driving;
  let drive = null;
  if (rawDrive) {
    if (Array.isArray(rawDrive)) {
      drive = rawDrive[0];
    } else if (rawDrive.data) {
      drive = rawDrive.data; // This is how DriveCard.tsx saves it!
    } else {
      drive = rawDrive;
    }
  }

  const stay = Array.isArray(selections?.stays)
    ? selections.stays[0]
    : selections?.stays;
  const attractions = selections?.attractions || [];
  const tours = selections?.tours || selections?.activities || [];

  // Check if Weather was actually selected on the home page
  const isWeatherSelected = selections?.weather?.selected === true;

  // Helper to calculate fuel cost dynamically (just like DriveCard.tsx)
  const getFuelCost = () => {
    if (!drive) return 0;
    if (drive.distance_km) {
      const miles = drive.distance_km * 0.621371;
      const gallons = miles / 25;
      return gallons * 3.35; // Standard fuel price used in DriveCard
    }
    // Fallback for older formats
    const fuel = drive.fuelEstimate || drive.fuel_estimate || drive.price || 0;
    if (typeof fuel === "string") return Number(fuel.replace(/[^0-9.-]+/g, ""));
    return Number(fuel);
  };

  // Safe display helpers for driving distance and duration
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

  // Calculate Total Cost
  let totalCost = 0;
  if (flight) {
    totalCost += Number(flight.price?.total || flight.price || 0);
  } else if (drive) {
    totalCost += getFuelCost(); // Adds driving fuel cost to the top total!
  }

  if (stay) totalCost += Number(stay.offerDetails?.price || stay.price || 0);
  tours.forEach((t: any) => {
    if (t.price && t.price.amount) {
      totalCost += parseFloat(t.price.amount);
    }
  });

  // Extract first day weather for summary ONLY if selected
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

        // Clean drive data saved into the database so the Saved Trips page can easily read it
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-theme-text/60 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-theme-bg w-full max-w-5xl max-h-[95vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 flex justify-between items-center bg-gradient-to-r from-theme-surface to-transparent border-b border-theme-surface shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-theme-text tracking-tight">
              Your Custom Itinerary
            </h2>
            <p className="text-xs sm:text-sm text-theme-text/60 font-bold uppercase tracking-widest mt-1 truncate max-w-xs sm:max-w-md">
              {rawParams?.source?.name?.split(",")[0] || "Origin"} →{" "}
              {rawParams?.destination?.name?.split(",")[0] || "Destination"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-theme-bg hover:bg-theme-surface rounded-full transition-colors border border-theme-surface shadow-sm shrink-0"
          >
            <X size={20} className="text-theme-muted" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Summary) */}
            <div className="lg:col-span-1 flex flex-col gap-4">
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
              <SummaryCard
                icon={<DollarSign size={18} className="text-theme-secondary" />}
                label="Est. Total Cost"
                value={`$${totalCost.toFixed(2)}`}
                highlight
              />

              {isWeatherSelected && firstDayWeather && (
                <div className="mt-2 p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">
                      Expected Weather
                    </span>
                    <Sun size={16} className="text-amber-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-theme-text">
                      {Math.round(
                        firstDayWeather.max_temp ??
                          firstDayWeather.temperature_max ??
                          0
                      )}
                      °
                    </span>
                    <span className="text-sm font-bold text-theme-muted mb-1">
                      /{" "}
                      {Math.round(
                        firstDayWeather.min_temp ??
                          firstDayWeather.temperature_min ??
                          0
                      )}
                      ° F
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-theme-text/70 mt-1 capitalize">
                    {firstDayWeather.weather ??
                      firstDayWeather.weather_description ??
                      "Clear skies"}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column (Details) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Transport Section */}
              <section>
                <SectionTitle
                  icon={flight ? <Plane size={18} /> : <Car size={18} />}
                  title="Transportation"
                />
                {flight ? (
                  <div className="bg-theme-surface/40 rounded-2xl p-4 sm:p-5 border border-theme-surface">
                    <div className="flex justify-between items-center mb-5">
                      <span className="font-black text-theme-text flex items-center gap-2">
                        {flight.airline_name}
                      </span>
                      <span className="text-theme-primary font-black">
                        $
                        {Number(
                          flight.price?.total || flight.price || 0
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {(flight.itineraries || []).map(
                        (itin: any, idx: number) => {
                          const stops = itin.segments?.length
                            ? itin.segments.length - 1
                            : 0;
                          const boundDate = itin.segments?.[0]?.departure_time
                            ? formatShortDate(itin.segments[0].departure_time)
                            : "";

                          return (
                            <div
                              key={idx}
                              className="bg-theme-bg p-3.5 rounded-xl border border-theme-surface/60"
                            >
                              <div className="flex justify-between items-center mb-3 pb-2 border-b border-theme-surface/40">
                                <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider">
                                  {idx === 0 ? "Outbound" : "Return"}{" "}
                                  {boundDate && `• ${boundDate}`}
                                </span>
                                <span
                                  className={`text-[10px] uppercase font-bold tracking-wider ${
                                    stops === 0
                                      ? "text-green-500"
                                      : "text-amber-500"
                                  }`}
                                >
                                  {stops === 0 ? "Direct" : `${stops} Stop(s)`}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2">
                                {(itin.segments || []).map(
                                  (seg: any, sIdx: number) => {
                                    let layoverStr = null;
                                    if (sIdx > 0) {
                                      const prevSeg = itin.segments[sIdx - 1];
                                      layoverStr = getLayoverTime(
                                        prevSeg.arrival_time,
                                        seg.departure_time
                                      );
                                    }

                                    return (
                                      <React.Fragment key={sIdx}>
                                        {layoverStr && (
                                          <div className="flex items-center justify-center my-1">
                                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                              Layover: {layoverStr}
                                            </span>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-theme-text/80 my-1">
                                          <div className="flex-1">
                                            <p className="font-black text-lg text-theme-text">
                                              {seg.departure_airport}
                                            </p>
                                            <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                                              {formatTime(seg.departure_time)}
                                            </p>
                                          </div>
                                          <div className="h-px flex-1 bg-theme-surface relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-theme-bg px-1 text-[10px]">
                                              ✈️
                                            </div>
                                          </div>
                                          <div className="flex-1 text-right">
                                            <p className="font-black text-lg text-theme-text">
                                              {seg.arrival_airport}
                                            </p>
                                            <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                                              {formatTime(seg.arrival_time)}
                                            </p>
                                          </div>
                                        </div>
                                      </React.Fragment>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ) : drive ? (
                  <div className="bg-theme-surface/40 rounded-2xl p-4 sm:p-5 border border-theme-surface">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-black text-theme-text flex items-center gap-2">
                        Road Trip Journey
                      </span>
                      <span className="text-theme-primary font-black text-sm">
                        {displayDriveDuration}
                      </span>
                    </div>
                    <div className="text-sm text-theme-text/80 flex justify-between items-end">
                      <div>
                        <p className="font-bold text-base text-theme-text">
                          {drive?.sourceName ||
                            rawParams?.source?.name?.split(",")[0] ||
                            "Origin"}{" "}
                          →{" "}
                          {drive?.destinationName ||
                            rawParams?.destination?.name?.split(",")[0] ||
                            "Destination"}
                        </p>
                        <p className="text-xs text-theme-muted font-bold mt-1 uppercase tracking-wider">
                          Distance: {displayDriveDistance}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-theme-primary font-black text-lg">
                          ${getFuelCost().toFixed(2)}
                        </p>
                        <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">
                          Fuel Est.
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
                <SectionTitle
                  icon={<Hotel size={18} />}
                  title="Accommodation"
                />
                {stay ? (
                  <div className="bg-theme-surface/40 rounded-2xl p-4 sm:p-5 border border-theme-surface">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-black text-theme-text leading-tight">
                          {stay.name}
                        </h4>
                        <p className="text-xs text-theme-text/60 mt-1.5 flex items-center gap-1 font-medium">
                          <MapPin size={12} className="shrink-0" />{" "}
                          <span className="line-clamp-1">
                            {stay.address?.lines?.join(", ")}
                          </span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-theme-primary font-black text-lg">
                          $
                          {Number(
                            stay.offerDetails?.price || stay.price || 0
                          ).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mt-0.5">
                          Total
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
                <SectionTitle
                  icon={<Camera size={18} />}
                  title="Planned Attractions"
                />
                {attractions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attractions.map((attr: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-theme-bg rounded-xl p-3 border border-theme-surface shadow-sm flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg bg-theme-surface flex items-center justify-center shrink-0">
                          <MapPin size={16} className="text-theme-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-theme-text truncate">
                            {attr.name}
                          </h5>
                          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider truncate mt-0.5">
                            {attr.category ||
                              attr.kinds?.split(",")[0]?.replace(/_/g, " ") ||
                              "Point of Interest"}
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
                <SectionTitle
                  icon={<Ticket size={18} />}
                  title="Tours & Activities"
                />
                {tours.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {tours.map((tour: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-theme-bg rounded-xl p-3 sm:p-4 border border-theme-surface shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm text-theme-text line-clamp-2 leading-snug">
                            {tour.name || tour.title}
                          </h5>
                          {tour.rating && (
                            <p className="text-[10px] text-theme-secondary font-black uppercase tracking-wider mt-1">
                              ★ {tour.rating} Rating
                            </p>
                          )}
                        </div>
                        {tour.price && tour.price.amount && (
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-theme-primary font-black">
                              ${parseFloat(tour.price.amount).toFixed(2)}
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
        <div className="p-4 sm:p-6 border-t border-theme-surface bg-theme-bg shrink-0 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {isLoggedIn && (
              <button
                onClick={handleSaveTrip}
                disabled={
                  isSaving ||
                  isSaved ||
                  isAlreadySaved ||
                  isExporting ||
                  isSharing
                }
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                  isSaving ||
                  isSaved ||
                  isAlreadySaved ||
                  isExporting ||
                  isSharing
                    ? "bg-theme-surface text-theme-muted cursor-not-allowed shadow-none"
                    : "bg-theme-secondary text-theme-bg shadow-lg shadow-theme-secondary/20 hover:opacity-90"
                }`}
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isAlreadySaved ? (
                  <Save size={18} className="text-yellow-500" />
                ) : isSaved ? (
                  <Save size={18} className="text-green-500" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving
                  ? "Saving..."
                  : isAlreadySaved
                  ? "Already Saved!"
                  : isSaved
                  ? "Saved!"
                  : "Save Trip"}
              </button>
            )}

            <button
              onClick={handleExportPdf}
              disabled={isExporting || isSharing || isSaving}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                isExporting || isSharing || isSaving
                  ? "bg-theme-surface text-theme-muted cursor-not-allowed shadow-none"
                  : "bg-theme-primary hover:bg-theme-secondary text-theme-bg shadow-lg shadow-theme-primary/20"
              }`}
            >
              {isExporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {isExporting ? "Generating PDF..." : "Download PDF"}
            </button>

            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              disabled={isExporting || isSharing || isSaving}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl font-black text-sm transition-all active:scale-95 bg-theme-bg border-2 border-theme-surface text-theme-text hover:bg-theme-surface ${
                (isExporting || isSharing || isSaving) &&
                "opacity-50 cursor-not-allowed"
              }`}
            >
              <Share2 size={18} />
              Share via Email
            </button>
          </div>

          {showEmailInput && (
            <div className="flex flex-col sm:flex-row gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-theme-surface bg-theme-bg text-theme-text placeholder:text-theme-muted focus:outline-none focus:border-theme-primary transition-colors font-medium text-sm"
              />
              <button
                onClick={handleSharePdf}
                disabled={isSharing || !email}
                className="px-6 py-3 bg-theme-text text-theme-bg font-black text-sm rounded-xl hover:bg-theme-text/80 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                {isSharing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <div className="p-1.5 bg-theme-surface text-theme-text rounded-lg border border-theme-surface/50 shadow-sm">
        {icon}
      </div>
      <h3 className="font-black text-theme-text uppercase tracking-widest text-[11px] sm:text-xs">
        {title}
      </h3>
    </div>
  );
}

function SummaryCard({ icon, label, value, highlight }: any) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-colors ${
        highlight
          ? "bg-theme-secondary/10 border-theme-secondary/30"
          : "bg-theme-bg border-theme-surface hover:bg-theme-surface/30"
      }`}
    >
      <div className="flex items-center gap-2 text-theme-muted mb-1.5">
        {icon}{" "}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p
        className={`font-black text-sm sm:text-base leading-snug ${
          highlight ? "text-theme-secondary" : "text-theme-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptySelection({ text }: { text: string }) {
  return (
    <div className="p-5 border-2 border-dashed border-theme-surface bg-theme-surface/10 rounded-2xl text-center text-xs text-theme-muted font-bold tracking-wide">
      {text}
    </div>
  );
}
