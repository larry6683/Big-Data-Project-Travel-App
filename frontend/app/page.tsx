// larry6683/big-data-project-travel-app/frontend/app/page.tsx

'use client'

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TripResults from '@/components/results/TripResults';
import dynamic from 'next/dynamic';
import { travelApi, TripSearchParams } from '@/services/api';

const DynamicMap = dynamic(() => import('@/components/map/TripMap'), { ssr: false });

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: TripSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const destinationData = await travelApi.getDestinationData(params);
      const transportPromise = params.travelMode === 'drive' 
        ? travelApi.getDriving(params) 
        : travelApi.getFlights(params);

      const [transportData, stays, weather, attractions] = await Promise.all([
        transportPromise,
        travelApi.getStays(params),
        travelApi.getWeather(params.destination, { start: params.startDate, end: params.endDate }),
        travelApi.getAttractions(params.destination, params.radius)
      ]);

      setTripData({ destinationData, travelMode: params.travelMode, transportData, stays, weather, attractions });
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
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 border border-red-100 mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            {tripData ? (
              <TripResults data={tripData} loading={loading} />
            ) : (
              // Empty state with no rounded corners
              <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-200 bg-white w-full">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                  {loading ? "Searching..." : "Enter a destination to start planning"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Fixed Map - Radius Removed */}
        <div className="hidden lg:block w-[40%] h-full border-l border-gray-100 bg-white">
          <div className="w-full h-full relative">
            {/* The DynamicMap inside will now be sharp and edge-to-edge */}
            <DynamicMap mapData={tripData?.destinationData} />
          </div>
        </div>

      </main>
    </div>
  );
}