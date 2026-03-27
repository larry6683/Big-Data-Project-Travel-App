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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract selected items
  const flight = selections?.flights?.[0];
  const drive = selections?.drive?.[0];
  const stay = selections?.stays?.[0];
  const attractions = selections?.attractions || [];
  const tours = selections?.tours || selections?.activities || [];

  // Calculate Total Cost
  let totalCost = 0;
  if (flight) totalCost += flight.price || 0;
  if (stay) totalCost += stay.offerDetails?.price || 0;
  tours.forEach((t: any) => {
    if (t.price && t.price.amount) {
      totalCost += parseFloat(t.price.amount);
    }
  });

  // Extract first day weather for summary
  let firstDayWeather = null;
  if (weatherData && Object.keys(weatherData).length > 0) {
    firstDayWeather = Object.values(weatherData)[0] as any;
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

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const cachedTripStr = sessionStorage.getItem("current_trip_results");
      const cachedTrip = cachedTripStr ? JSON.parse(cachedTripStr) : {};

      const pdfBlob = await travelApi.exportPdf({
        destination:
          rawParams?.destination?.city ||
          rawParams?.destination?.name ||
          "Trip",
        username: user || "Traveler",
        check_in_date: rawParams?.startDate,
        check_out_date: rawParams?.endDate,
        weather: weatherData || cachedTrip.weather,
        flight: flight,
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
          `${rawParams?.destination?.city || "Itinerary"}.pdf`
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
        destination:
          rawParams?.destination?.city ||
          rawParams?.destination?.name ||
          "Trip",
        username: user || "Traveler",
        check_in_date: rawParams?.startDate,
        check_out_date: rawParams?.endDate,
        weather: weatherData || cachedTrip.weather,
        flight: flight,
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

  // --- NEW: Save Trip Logic ---
  const handleSaveTrip = async () => {
    if (!isLoggedIn) return; // Failsafe
    setIsSaving(true);
    try {
      const cachedTripStr = sessionStorage.getItem("current_trip_results");
      const cachedTrip = cachedTripStr ? JSON.parse(cachedTripStr) : {};

      // Formatting data structure to save properly in the database
      const tripDataToSave = {
        destination:
          rawParams?.destination?.city ||
          rawParams?.destination?.name ||
          "Trip",
        check_in_date: rawParams?.startDate,
        check_out_date: rawParams?.endDate,
        weather: weatherData || cachedTrip.weather,
        flight: flight,
        hotel: stay,
        attractions: attractions,
        activities: tours,
        rawParams: rawParams,
        selections: selections,
      };

      await travelApi.saveTrip(tripDataToSave);
      setIsSaved(true);
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

              {firstDayWeather && (
                <div className="mt-2 p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-400/5 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/70">
                      Expected Weather
                    </span>
                    <Sun size={16} className="text-amber-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-theme-text">
                      {Math.round(firstDayWeather.temperature_max)}°
                    </span>
                    <span className="text-sm font-bold text-theme-muted mb-1">
                      / {Math.round(firstDayWeather.temperature_min)}° F
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-theme-text/70 mt-1 capitalize">
                    {firstDayWeather.weather_description || "Clear skies"}
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
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-black text-theme-text flex items-center gap-2">
                        {flight.airline_name}
                      </span>
                      <span className="text-theme-primary font-black">
                        ${(flight.price || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-theme-text/80">
                      <div className="flex-1">
                        <p className="font-bold text-lg">
                          {
                            flight.itineraries?.[0]?.segments?.[0]
                              ?.departure_airport
                          }
                        </p>
                      </div>
                      <div className="h-px flex-1 bg-theme-surface relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-theme-bg px-2 rounded-full border border-theme-surface text-xs">
                          ✈️
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-bold text-lg">
                          {
                            flight.itineraries?.[0]?.segments?.slice(-1)[0]
                              ?.arrival_airport
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : drive ? (
                  <div className="bg-theme-surface/40 rounded-2xl p-4 sm:p-5 border border-theme-surface">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-black text-theme-text flex items-center gap-2">
                        Road Trip
                      </span>
                      <span className="text-theme-primary font-black text-sm">
                        {drive.duration
                          ? Math.round(drive.duration / 3600) + " hrs drive"
                          : "N/A"}
                      </span>
                    </div>
                    <div className="text-sm text-theme-text/80">
                      <p className="font-bold">
                        {drive.sourceName ||
                          rawParams?.source?.name?.split(",")[0]}{" "}
                        →{" "}
                        {drive.destinationName ||
                          rawParams?.destination?.name?.split(",")[0]}
                      </p>
                      <p className="text-xs text-theme-muted font-bold mt-1 uppercase tracking-wider">
                        {drive.distance
                          ? Math.round(drive.distance / 1609.34) +
                            " miles total"
                          : ""}
                      </p>
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
                          ${(stay.offerDetails?.price || 0).toFixed(2)}
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
            {/* Conditional 'Save Trip' Button Rendered ONLY if user is logged in */}
            {isLoggedIn && (
              <button
                onClick={handleSaveTrip}
                disabled={isSaving || isSaved || isExporting || isSharing}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                  isSaving || isSaved || isExporting || isSharing
                    ? "bg-theme-surface text-theme-muted cursor-not-allowed shadow-none"
                    : "bg-theme-secondary text-theme-bg shadow-lg shadow-theme-secondary/20 hover:opacity-90"
                }`}
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isSaved ? (
                  <Save size={18} className="text-green-500" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? "Saving..." : isSaved ? "Saved!" : "Save Trip"}
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
