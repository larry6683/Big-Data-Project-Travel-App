"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SearchBar from "@/components/search/Searchbar";
import TripResults from "@/components/results/TripResults";
import Navbar from "@/components/Navbar";
import ItineraryModal from "@/components/results/ItineraryModal";
import { TripSearchParams } from "@/services/api";
import { fetchTripData } from "@/services/tripSearch";

const DynamicMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
});

export default function Results() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);

  useEffect(() => {
    const cachedTrip = sessionStorage.getItem("current_trip_results");
    if (cachedTrip) {
      try {
        setTripData(JSON.parse(cachedTrip));
      } catch (err) {
        console.error("Failed to parse cached trip data", err);
      }
    } else {
      router.push("/");
    }
    setLoading(false);
  }, [router]);

  const handleSearch = async (params: TripSearchParams) => {
    setLoading(true);
    setError(null);

    // Mobile specific: auto close header on search
    if (window.innerWidth < 1024) {
      setSearchOpen(false);
    }

    sessionStorage.removeItem("active_tab");
    sessionStorage.removeItem("drive_intermediates_open");
    sessionStorage.removeItem("stay_dropdown_state");
    localStorage.removeItem("trip_state");

    try {
      const newTripData = await fetchTripData(params);
      setTripData(newTripData);
      sessionStorage.setItem("current_trip_results", JSON.stringify(newTripData));
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-theme-bg overflow-hidden">
      <ItineraryModal
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
        rawParams={tripData?.rawParams}
        weatherData={tripData?.weather}
      />

      <Navbar
        onMenuClick={() => setSearchOpen(!searchOpen)}
        menuOpen={searchOpen}
        mapOpen={mapOpen}
        onMapToggle={() => setMapOpen(!mapOpen)}
      />

      {/* Compact Mode: flex-shrink-0 locks it to the top row */}
      <div 
        className={`w-full z-20 flex-shrink-0 relative transition-all duration-300 ease-in-out lg:max-h-[800px] lg:opacity-100 lg:overflow-visible lg:border-b lg:border-theme-surface ${
          searchOpen ? 'max-h-[800px] opacity-100 border-b border-theme-surface' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <SearchBar
          onSearch={handleSearch}
          onSearchStart={() => {
            setTripData(null);
            setLoading(true);
          }}
          loading={loading}
          isCompact={true}
        />
      </div>

      <main className="flex-1 flex overflow-hidden min-w-0 bg-theme-bg/20">
        <div
          className={`flex-1 h-full overflow-y-auto custom-scrollbar ${
            mapOpen && !loading ? "hidden md:block" : ""
          }`}
        >
          <div className="p-4 md:p-6 w-full relative max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-black text-theme-text tracking-tight">
                Trip Planner
              </h1>

              {tripData && !loading && (
                <button
                  onClick={() => setIsItineraryOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-theme-primary hover:bg-theme-secondary text-theme-bg text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                  Generate Itinerary
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 border border-red-100 rounded-xl mb-6 text-sm font-bold shadow-sm">
                {error}
              </div>
            )}

            {tripData || loading ? (
              <TripResults data={tripData} loading={loading} />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 md:py-32 border-2 border-dashed border-theme-surface bg-theme-bg w-full rounded-2xl shadow-sm">
                <p className="text-theme-muted font-bold uppercase tracking-widest text-xs text-center px-4">
                  Loading your trip details...
                </p>
              </div>
            )}
          </div>
        </div>

        {!loading && tripData && (
          <div
            className={`h-full border-l border-theme-surface bg-theme-bg ${
              mapOpen ? "flex-1 w-full" : "hidden"
            } md:flex md:flex-none md:w-[40vw] lg:w-[35vw]`}
          >
            <div className="w-full h-full relative">
              <DynamicMap mapData={tripData?.rawParams?.destination} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}