"use client";
import React, { useState, useEffect } from "react";
import FlightCard from "./FlightCard";
import StaysCard from "./StayCard";
import WeatherCard from "./WeatherCard";
import AttractionsCard from "./AttractionCard";
import DrivingCard from "./DriveCard";
import ToursCard from "./TourCard";

type TabOption =
  | "flights"
  | "drive"
  | "stays"
  | "weather"
  | "attractions"
  | "tours";

const LoadingState = () => {
  const icons = ["✈️", "🚗", "🏨", "🎡", "🗺️", "☀️"];
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col items-center justify-center p-8 bg-theme-bg rounded-2xl border border-theme-surface shadow-sm animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-theme-surface">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_75%,var(--color-theme-primary)_100%)] animate-[spin_1.5s_linear_infinite]"></div>
        </div>
        <div className="absolute inset-[3px] bg-theme-bg rounded-[13px]"></div>
        <div className="z-10 text-4xl drop-shadow-sm transition-transform scale-110">
          {icons[iconIndex]}
        </div>
      </div>
      <h3 className="text-xl font-black text-theme-text mt-4 animate-pulse">
        Crafting your itinerary...
      </h3>
      <p className="text-theme-text/70 text-sm mt-2 text-center max-w-sm">
        Searching routes, checking hotel availability, and gathering the best
        for you...
      </p>
    </div>
  );
};

export default function TripResults({
  data,
  loading,
}: {
  data: any;
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabOption>("flights");

  const showFlights = data?.rawParams?.travelMode === "fly";
  const hasFlights = data?.flightData && data.flightData.length > 0;

  useEffect(() => {
    if (data && !loading) {
      const savedTab = sessionStorage.getItem("active_tab") as TabOption | null;
      if (savedTab) {
        setActiveTab(savedTab);
      } else if (showFlights && hasFlights) {
        setActiveTab("flights");
      } else {
        setActiveTab("drive");
      }
    }
  }, [data, loading, showFlights, hasFlights]);

  const handleTabChange = (tabId: TabOption) => {
    setActiveTab(tabId);
    sessionStorage.setItem("active_tab", tabId);
  };

  if (!data && !loading) return null;
  if (loading) return <LoadingState />;

  const transportTab =
    showFlights && hasFlights
      ? { id: "flights", label: "Flights", icon: "✈️" }
      : { id: "drive", label: "Drive", icon: "🚗" };

  const tabs = [
    transportTab,
    { id: "stays", label: "Stays", icon: "🏨" },
    { id: "attractions", label: "Attractions", icon: "🎡" },
    { id: "tours", label: "Tours", icon: "🗺️" },
    { id: "weather", label: "Weather", icon: "☀️" },
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky top-0 z-20 bg-theme-bg backdrop-blur-sm pt-1 mb-4 border-b border-theme-surface">
        <div className="flex w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabOption)}
                className={`flex-1 flex flex-col items-center py-3 transition-all relative group`}
              >
                <span
                  className={`text-lg mb-1 group-hover:scale-110 transition-transform ${
                    isActive ? "grayscale-0" : "grayscale opacity-70"
                  }`}
                >
                  {tab.icon}
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${
                    isActive ? "text-theme-primary" : "text-theme-muted"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-theme-primary rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CHANGED: Removed h-[calc(100vh-220px)] and overflow-y-auto to allow natural growth */}
      <div className="w-full pb-8">
        {activeTab === "flights" && (
          <FlightCard flights={data?.flightData || []} />
        )}
        {activeTab === "drive" && (
          <div className="flex flex-col gap-4">
            {showFlights && !hasFlights && (
              <div className="p-4 bg-theme-muted/20 text-theme-primary rounded-xl border border-theme-muted flex items-center gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-sm font-medium">
                  We couldn't find any flights for this route, so we're showing
                  you the best driving route instead!
                </p>
              </div>
            )}
            <DrivingCard drivingData={data?.drivingData || {}} />
          </div>
        )}
        {activeTab === "stays" && (
          <StaysCard stays={data?.stays || []} searchParams={data?.rawParams} />
        )}
        {activeTab === "attractions" && (
          <AttractionsCard attractions={data?.attractions || []} />
        )}
        {activeTab === "tours" && <ToursCard tours={data?.toursData || []} />}
        {activeTab === "weather" && <WeatherCard weather={data?.weather} />}
      </div>
    </div>
  );
}