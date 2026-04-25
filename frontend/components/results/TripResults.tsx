"use client";
import React, { useState, useEffect } from "react";
import FlightCard from "./FlightCard";
import StaysCard from "./StayCard";
import DrivingCard from "./DriveCard";
import ToursCard from "./TourCard";
import WeatherCard from "./WeatherCard";
import AttractionsCard from "./AttractionCard";

type TabOption = "summary" | "flights" | "drive" | "stays" | "tours";

// --- NEW: Minimalist Branded Loading State ---
const LoadingState = () => {
  return (
    // Takes up the full available height between the hidden header and the visible footer
    <div className="w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-theme-bg animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Rotating text-color circle */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-theme-text border-l-theme-text animate-[spin_1s_linear_infinite]"></div>
        
        {/* Static primary-color logo in center */}
        <svg viewBox="0 0 270 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-theme-primary drop-shadow-sm">
          <g className="origin-[60px_120px] scale-[1.3]">
            <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 120 120 C 180 20, 180 20, 200 140" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />        
          </g>
        </svg>
      </div>
    </div>
  );
};

const Typewriter = ({ text, delay = 30, className = "" }: { text: string, delay?: number, className?: string }) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-pulse border-r-2 border-theme-primary ml-1"></span>
    </span>
  );
};

const SummaryTab = ({ data }: { data: any }) => {
  const destination = data?.rawParams?.destination?.name || data?.rawParams?.destination || "your destination";
  const weather = data?.weather;
  const attractions = data?.attractions || [];

  // Robustly parse the weather regardless of the API provider (OpenWeather, WeatherAPI, VisualCrossing, etc.)
  const temp = weather?.current?.temp_f 
    ?? weather?.main?.temp 
    ?? weather?.currentConditions?.temp 
    ?? weather?.temperature 
    ?? weather?.temp 
    ?? "--";
    
  const condition = weather?.current?.condition?.text 
    ?? weather?.weather?.[0]?.description 
    ?? weather?.currentConditions?.conditions 
    ?? weather?.condition 
    ?? "Awaiting Forecast";

  // Check backend for ideal month, or fallback
  const idealMonth = weather?.ideal_month ?? data?.destinationInfo?.ideal_month ?? "September";

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="p-6 md:p-8 bg-theme-surface/30 rounded-3xl border border-theme-surface shadow-sm">
        <h2 className="text-2xl md:text-3xl font-black text-theme-text mb-3">
          <Typewriter text={`Welcome to ${destination}.`} delay={50} />
        </h2>
        <p className="text-theme-muted font-medium text-sm md:text-base h-[40px] md:h-[24px]">
          <Typewriter text={`Get ready for an unforgettable journey. Here is a quick snapshot of the local atmosphere and top sights.`} delay={20} />
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-bg to-theme-surface border border-theme-surface p-6 md:p-8 shadow-xl">
        <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none">
          <span className="text-[150px]">☁️</span>
        </div>
        
        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-theme-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse"></span>
          Atmospheric Forecast
        </h3>
        
        <div className="flex items-end gap-3 md:gap-4 relative z-10">
          <div className="text-5xl md:text-7xl font-black text-theme-text tracking-tighter">
            {typeof temp === "number" ? Math.round(temp) : temp}°
          </div>
          <div className="pb-1 md:pb-2 text-theme-muted font-bold text-sm md:text-lg capitalize">{condition}</div>
        </div>
        
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-primary/10 text-theme-primary text-xs font-black border border-theme-primary/20 backdrop-blur-md">
          ✨ Ideal Month to Visit: {idealMonth}
        </div>
      </div>

      <div className="mt-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-theme-text mb-4 ml-2">Must-See Sights</h3>
        <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
        
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar scroll-smooth">
          {attractions.length > 0 ? (
            attractions.map((attr: any, i: number) => {
              const image = attr.photo || attr.thumbnail || attr.image_url;
              return (
                <div key={i} className="min-w-[260px] max-w-[260px] sm:min-w-[300px] sm:max-w-[300px] snap-center bg-theme-bg border border-theme-surface rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col cursor-grab active:cursor-grabbing">
                  <div className="w-full h-40 bg-theme-surface rounded-xl mb-3 overflow-hidden relative flex-shrink-0">
                    {image ? (
                      <img src={image} alt={attr.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎡</div>
                    )}
                  </div>
                  <h4 className="font-bold text-theme-text truncate text-sm md:text-base">{attr.name}</h4>
                  <p className="text-xs text-theme-muted mt-1 line-clamp-2">
                    {attr.description || (attr.types ? attr.types.join(", ").replace(/_/g, " ") : "Popular Attraction")}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-theme-muted p-4 border border-theme-surface border-dashed rounded-xl w-full text-center">
              No top attractions found for this specific area.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TripResults({ data, loading }: { data: any; loading: boolean }) {
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

  if (loading) return <LoadingState />;
  if (!data) return null;

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
        {activeTab === "summary" && <SummaryTab data={data} />}
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
    </div>
  );
}