// frontend/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/search/Sidebar";
import TripResults from "@/components/results/TripResults";
import Navbar from "@/components/Navbar";
import ItineraryModal from "@/components/results/ItineraryModal";
import dynamic from "next/dynamic";
import { travelApi, TripSearchParams } from "@/services/api";

const DynamicMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
});

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);

  useEffect(() => {
    sessionStorage.removeItem("current_trip_data");
    sessionStorage.removeItem("route_data_Origin_Destination");

    const cachedTrip = sessionStorage.getItem("current_trip_results");
    if (cachedTrip) {
      try {
        setTripData(JSON.parse(cachedTrip));
      } catch (err) {
        console.error("Failed to parse cached trip data", err);
      }
    }
  }, []);

  const handleSearch = async (params: TripSearchParams) => {
    setLoading(true);
    setError(null);
    setSidebarOpen(false);

    sessionStorage.removeItem("active_tab");
    sessionStorage.removeItem("drive_intermediates_open");
    sessionStorage.removeItem("stay_dropdown_state");
    localStorage.removeItem("trip_state");

    try {
      const isDrive = params.travelMode === "drive";
      const transportPromise = isDrive
        ? travelApi.getDriving(params)
        : travelApi.getFlights(params);

      // 1. Fetch the base data
      let [transportResponse, rawStays, weather, attractions, toursData] =
        await Promise.all([
          transportPromise,
          travelApi.getStays(params),
          travelApi.getWeather(params.destination, {
            start: params.startDate,
            end: params.endDate,
          }),
          travelApi.getAttractions(params.destination, params.radius),
          travelApi.getTours(params.destination, params.radius),
        ]);

      // 🌟 NEW: Pre-fetch hotel offers during the main loading screen
      let processedStays = rawStays;
      if (rawStays && rawStays.length > 0) {
        const topStays = rawStays.slice(0, 10);
        const offers: any[] = [];

        // Batch requests in chunks of 3 to prevent API rate limit errors
        for (let i = 0; i < topStays.length; i += 3) {
          const chunk = topStays.slice(i, i + 3);
          const chunkOffers = await Promise.all(
            chunk.map((stay: any) => {
              const hId = stay.hotel_id || stay.hotelId || stay.id;
              // Catch individual errors so one failed hotel doesn't break the app
              return travelApi
                .getHotelOffer(hId, params)
                .catch(() => ({ unavailable: true }));
            })
          );
          offers.push(...chunkOffers);

          // Small delay between chunks to respect API rate limits
          if (i + 3 < topStays.length)
            await new Promise((r) => setTimeout(r, 200));
        }

        // Attach the fetched offers directly to the stay objects
        processedStays = rawStays.map((stay: any, index: number) => {
          if (index < 10) {
            const offer = offers[index];
            return {
              ...stay,
              roomDetails:
                !offer || offer.error ? { unavailable: true } : offer,
            };
          }
          return stay;
        });
      }

      let finalFlightData = null;
      let finalDriveData = null;

      if (isDrive) {
        finalDriveData = transportResponse;
      } else {
        if (transportResponse && transportResponse.length > 0) {
          finalFlightData = transportResponse;
        } else {
          finalDriveData = await travelApi.getDriving(params);
        }
      }

      // 2. Use the processedStays array here instead of raw stays
      const newTripData: any = {
        rawParams: params,
        flightData: finalFlightData,
        drivingData: finalDriveData,
        stays:
          processedStays && processedStays.length > 0 ? processedStays : null,
        weather: weather && Object.keys(weather).length > 0 ? weather : null,
        attractions: attractions && attractions.length > 0 ? attractions : null,
        toursData: toursData && toursData.length > 0 ? toursData : null,
      };

      setTripData(newTripData);
      sessionStorage.setItem(
        "current_trip_results",
        JSON.stringify(newTripData)
      );
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">
      {/* Itinerary Modal Popup */}
      <ItineraryModal
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
        rawParams={tripData?.rawParams}
        weatherData={tripData?.weather}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          onSearch={handleSearch}
          onSearchStart={() => {
            setTripData(null);
            setLoading(true);
            setSidebarOpen(false);
          }}
          loading={loading}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          mapOpen={mapOpen}
          onMapToggle={() => setMapOpen((v) => !v)}
        />

        <div className="flex flex-1 overflow-hidden">
          <div
            className={`flex-1 h-full overflow-y-auto custom-scrollbar bg-gray-50/30 ${
              mapOpen ? "hidden md:block" : ""
            }`}
          >
            <div className="p-4 md:p-6 w-full relative">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  Trip Planner
                </h1>

                {/* 🌟 Button now logic: Render if we have data. The Modal handle empty selection UI. */}
                {tripData && !loading && (
                  <button
                    onClick={() => setIsItineraryOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Generate Itinerary
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 border border-red-100 rounded-xl mb-6 text-sm font-bold">
                  {error}
                </div>
              )}

              {tripData || loading ? (
                <TripResults data={tripData} loading={loading} />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 md:py-32 border-2 border-dashed border-gray-200 bg-white w-full rounded-2xl">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs text-center px-4">
                    <span className="lg:hidden">
                      Tap the menu icon to start planning
                    </span>
                    <span className="hidden lg:inline">
                      Enter a destination to start planning
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className={`h-full border-l border-gray-100 bg-white ${
              mapOpen ? "flex-1 w-full" : "hidden"
            } md:flex md:flex-none md:w-[40vw] lg:w-[30vw]`}
          >
            <div className="w-full h-full relative">
              <DynamicMap mapData={tripData?.rawParams?.destination} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
