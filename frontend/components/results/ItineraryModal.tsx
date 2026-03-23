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

  const { user } = useAuth();

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

      // Reset share state when opened
      setShowEmailInput(false);
      setEmail("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const flight = selections?.flights?.[0];
  const stay = selections?.stays?.[0];
  const totalCost = (flight?.price || 0) + (stay?.offerDetails?.price || 0);

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
      month: "long",
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
        attractions: selections?.attractions || [],
        activities: selections?.tours || selections?.activities || [],
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
        attractions: selections?.attractions || [],
        activities: selections?.tours || selections?.activities || [],
      };

      // Assuming travelApi.sharePdf was added to your api.ts file
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Your Custom Itinerary
            </h2>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
              {rawParams?.source?.name || "Origin"} →{" "}
              {rawParams?.destination?.name || "Destination"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 shadow-sm"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col gap-4">
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
                icon={<DollarSign size={18} className="text-emerald-600" />}
                label="Est. Total Cost"
                value={`$${totalCost.toFixed(2)}`}
                highlight
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-6">
              <section>
                <SectionTitle
                  icon={<Plane size={20} />}
                  title="Selected Flight"
                />
                {flight ? (
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-black text-gray-900">
                        {flight.airline_name}
                      </span>
                      <span className="text-blue-600 font-bold">
                        ${(flight.price || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex-1">
                        <p className="font-bold">
                          {
                            flight.itineraries?.[0]?.segments?.[0]
                              ?.departure_airport
                          }
                        </p>
                      </div>
                      <div className="h-px flex-1 bg-gray-300 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-2">
                          ✈️
                        </div>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-bold">
                          {
                            flight.itineraries?.[0]?.segments?.slice(-1)[0]
                              ?.arrival_airport
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptySelection text="No flight selected" />
                )}
              </section>

              <section>
                <SectionTitle
                  icon={<Hotel size={20} />}
                  title="Selected Stay"
                />
                {stay ? (
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-gray-900">
                          {stay.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin size={12} /> {stay.address?.lines?.join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-600 font-black">
                          ${(stay.offerDetails?.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptySelection text="No hotel selected" />
                )}
              </section>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-4">
          <div className="flex gap-3">
            <button
              onClick={handleExportPdf}
              disabled={isExporting || isSharing}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                isExporting || isSharing
                  ? "bg-gray-400 text-white cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
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
              disabled={isExporting || isSharing}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 ${
                (isExporting || isSharing) && "opacity-50 cursor-not-allowed"
              }`}
            >
              <Share2 size={18} />
              Share
            </button>
          </div>

          {showEmailInput && (
            <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button
                onClick={handleSharePdf}
                disabled={isSharing || !email}
                className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 shadow-md"
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
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">{icon}</div>
      <h3 className="font-black text-gray-800 uppercase tracking-wider text-xs">
        {title}
      </h3>
    </div>
  );
}

function SummaryCard({ icon, label, value, highlight }: any) {
  return (
    <div
      className={`p-4 rounded-2xl border ${
        highlight
          ? "bg-emerald-50 border-emerald-100"
          : "bg-white border-gray-100"
      }`}
    >
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}{" "}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p
        className={`font-black text-sm ${
          highlight ? "text-emerald-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptySelection({ text }: { text: string }) {
  return (
    <div className="p-4 border-2 border-dashed border-gray-100 rounded-2xl text-center text-xs text-gray-400 font-bold italic">
      {text}
    </div>
  );
}
