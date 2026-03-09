// larry6683/big-data-project-travel-app/frontend/app/page.tsx

'use client'

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TripResults from '@/components/results/TripResults';
import dynamic from 'next/dynamic';
import { travelApi, TripSearchParams } from '@/services/api';
import { Download, Loader2 } from 'lucide-react';

const DynamicMap = dynamic(() => import('@/components/map/TripMap'), { ssr: false });

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.removeItem('current_trip_data');
    sessionStorage.removeItem('route_data_Origin_Destination');
    
    const cachedTrip = sessionStorage.getItem('current_trip_results');
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
    
    // 🧹 PRE-CLEANUP: Clear any selected flights/drives from previous searches
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        tripState.flights = [];
        tripState.drive = null;
        localStorage.setItem('trip_state', JSON.stringify(tripState));
      } catch (e) {
        console.error("Failed to clear trip_state", e);
      }
    }

    try {
      const isDrive = params.travelMode === 'drive';
      const transportPromise = isDrive 
        ? travelApi.getDriving(params) 
        : travelApi.getFlights(params);

      let [transportResponse, stays, weather, attractions, toursData] = await Promise.all([
        transportPromise,
        travelApi.getStays(params),
        travelApi.getWeather(params.destination, { start: params.startDate, end: params.endDate }),
        travelApi.getAttractions(params.destination, params.radius),
        travelApi.getTours(params.destination, params.radius) 
      ]);

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

      // ✨ EXPLICIT NULL CHECKS: Force empty arrays/objects to be saved as null
      const newTripData: any = { 
        rawParams: params, 
        flightData: finalFlightData, 
        drivingData: finalDriveData,
        stays: stays && stays.length > 0 ? stays : null, 
        weather: weather && Object.keys(weather).length > 0 ? weather : null, 
        attractions: attractions && attractions.length > 0 ? attractions : null,
        toursData: toursData && toursData.length > 0 ? toursData : null 
      };

      setTripData(newTripData);
      sessionStorage.setItem('current_trip_results', JSON.stringify(newTripData));

    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white overflow-hidden">
      <Sidebar onSearch={handleSearch} loading={loading} />

      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: Results Area */}
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-gray-50/30">
          <div className="p-6 w-full"> 
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Trip Planner</h1>
              
              {/* PDF EXPORT BUTTON */}
              {tripData && (
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
Generate Itenirary
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
              <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-200 bg-white w-full rounded-2xl">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                  Enter a destination to start planning
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Fixed Map */}
        <div className="hidden lg:block w-[30vw] h-full border-l border-gray-100 bg-white">
          <div className="w-full h-full relative">
            <DynamicMap mapData={tripData?.rawParams?.destination} />
          </div>
        </div>

      </main>
    </div>
  );
}