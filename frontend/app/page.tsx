// larry6683/big-data-project-travel-app/frontend/app/page.tsx

'use client'

import { useState } from 'react';
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

  const handleSearch = async (params: TripSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const destinationData = await travelApi.getDestinationData(params);
      
      const isDrive = params.travelMode === 'drive';
      const transportPromise = isDrive 
        ? travelApi.getDriving(params) 
        : travelApi.getFlights(params);

      const [transportResponse, stays, weather, attractions] = await Promise.all([
        transportPromise,
        travelApi.getStays(params),
        travelApi.getWeather(params.destination, { start: params.startDate, end: params.endDate }),
        travelApi.getAttractions(params.destination, params.radius)
      ]);

      setTripData({ 
        destinationData, 
        travelMode: params.travelMode, 
        transportData: !isDrive ? transportResponse : null, // Store flights here
        drivingData: isDrive ? transportResponse : null,    // Store driving here
        stays, 
        weather, 
        attractions,
        rawParams: params // Keep original params for the PDF generator
      });
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!tripData || !tripData.rawParams) return;
    setIsExporting(true);
    
    try {
      // Build the payload matching your backend TripGenerateRequest schema
      const payload = {
        username: "Traveler", // You can update this if you add user accounts later
        destination: tripData.rawParams.destination.city || tripData.rawParams.destination.name || "Destination",
        check_in_date: tripData.rawParams.startDate,
        check_out_date: tripData.rawParams.endDate,
        flight: tripData.transportData?.[0] || null, // Pass the first flight option if available
        hotel: tripData.stays?.[0] || null           // Pass the first hotel option if available
      };

      const blob = await travelApi.exportPdf(payload);
      
      if (blob) {
        // Create a temporary URL for the downloaded blob and force a click
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${payload.destination.replace(/\s+/g, '_')}_Itinerary.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to generate PDF. Please try again.");
      }
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("An error occurred while generating the PDF.");
    } finally {
      setIsExporting(false);
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
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {isExporting ? "Generating..." : "Export PDF"}
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 border border-red-100 rounded-xl mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            {tripData ? (
              <TripResults data={tripData} loading={loading} />
            ) : (
              <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-200 bg-white w-full rounded-2xl">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                  {loading ? "Searching..." : "Enter a destination to start planning"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Fixed Map */}
        <div className="hidden lg:block w-[40%] h-full border-l border-gray-100 bg-white">
          <div className="w-full h-full relative">
            <DynamicMap mapData={tripData?.destinationData} />
          </div>
        </div>

      </main>
    </div>
  );
}