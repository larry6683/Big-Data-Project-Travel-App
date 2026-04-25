"use client";
import React, { useState, useEffect } from "react";
import FlightCard from "./FlightCard";
import StaysCard from "./StayCard";
import DrivingCard from "./DriveCard";
import ToursCard from "./TourCard";
import SummaryCard from "./SummaryCard";

type TabOption = "summary" | "flights" | "drive" | "stays" | "tours";

interface TripResultsProps {
  data: any;
  loading: boolean;
  error?: string | null;
  onOpenItinerary: () => void;
}

// --- Minimalist Branded Loading State ---
const LoadingState = () => {
  return (
    <div className="w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-theme-bg animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center w-28 h-28">
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-theme-text border-l-theme-text animate-[spin_1s_linear_infinite]"></div>
        <svg viewBox="0 0 270 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-theme-primary drop-shadow-sm">
          <g className="origin-[60px_120px] scale-[1.3]">
            <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 120 120 C 180 20, 180 20, 200 140" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />        
          </g>
        </svg>
      </div>
      <p className="text-theme-muted font-bold uppercase tracking-widest text-xs text-center mt-6">
        Curating your journey...
      </p>
    </div>
  );
};

export default function TripResults({ data, loading, error, onOpenItinerary }: TripResultsProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("summary");

  const showFlights = data?.rawParams?.travelMode === "fly";
  const hasFlights = data?.flightData && data.flightData.length > 0;

  useEffect(() => {
    if (data && !loading) {
      const savedTab = sessionStorage.getItem("active_tab") as TabOption | null;
      if (savedTab) setActiveTab(savedTab);
      else setActiveTab("summary");
    }
  }, [data, loading]);

  const handleTabChange = (tabId: TabOption) => {
    setActiveTab(tabId);
    sessionStorage.setItem("active_tab", tabId);
  };

  const transportTab = showFlights && hasFlights
    ? { id: "flights", label: "Flights", icon: "✈️" }
    : { id: "drive", label: "Drive", icon: "🚗" };

  const tabs = [
    { id: "summary", label: "Summary", icon: "✨" },
    transportTab,
    { id: "stays", label: "Stays", icon: "🏨" },
    { id: "tours", label: "Tours", icon: "🗺️" },
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION (Moved from page.tsx) */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight">
          Trip Planner
        </h1>

        {data && !loading && (
          <button
            onClick={onOpenItinerary}
            className="flex items-center gap-2 px-4 py-2 bg-theme-primary hover:bg-theme-secondary text-theme-bg text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Generate Itinerary
          </button>
        )}
      </div>

      {/* ERROR SECTION (Moved from page.tsx) */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 border border-red-100 rounded-xl mb-6 text-sm font-bold shadow-sm">
          {error}
        </div>
      )}

      {/* RENDER LOGIC */}
      {loading ? (
        <LoadingState />
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-24 md:py-32 border-2 border-dashed border-theme-surface bg-theme-bg w-full rounded-2xl shadow-sm">
          <p className="text-theme-muted font-bold uppercase tracking-widest text-xs text-center px-4">
            Awaiting your search details...
          </p>
        </div>
      ) : (
        <>
          <div className="sticky top-0 z-20 bg-theme-bg backdrop-blur-sm pt-1 mb-4 border-b border-theme-surface">
            <div className="flex w-full overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as TabOption)}
                    className={`flex-1 min-w-[70px] flex flex-col items-center py-3 transition-all relative group`}
                  >
                    <span className={`text-lg mb-1 group-hover:scale-110 transition-transform ${isActive ? "grayscale-0" : "grayscale opacity-70"}`}>
                      {tab.icon}
                    </span>
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isActive ? "text-theme-primary" : "text-theme-muted"}`}>
                      {tab.label}
                    </span>
                    {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-theme-primary rounded-t-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full pb-8">
            {activeTab === "summary" && <SummaryCard data={data} />}
            {activeTab === "flights" && <FlightCard flights={data?.flightData || []} />}
            {activeTab === "drive" && (
              <div className="flex flex-col gap-4">
                {showFlights && !hasFlights && (
                  <div className="p-4 bg-theme-muted/20 text-theme-primary rounded-xl border border-theme-muted flex items-center gap-3">
                    <span className="text-xl">ℹ️</span>
                    <p className="text-sm font-medium">We couldn't find any flights, so we're showing you the best driving route instead!</p>
                  </div>
                )}
                <DrivingCard drivingData={data?.drivingData || {}} />
              </div>
            )}
            {activeTab === "stays" && <StaysCard stays={data?.stays || []} searchParams={data?.rawParams} />}
            {activeTab === "tours" && <ToursCard tours={data?.toursData || []} />}
          </div>
        </>
      )}
    </div>
  );
}