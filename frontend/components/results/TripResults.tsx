// larry6683/big-data-project-travel-app/frontend/components/results/TripResults.tsx

import React, { useState, useEffect } from 'react';
import FlightCard from './FlightCard';
import StaysCard from './StayCard';
import WeatherCard from './WeatherCard';
import AttractionsCard from './AttractionsCard';
import DrivingCard from './DrivingCard';

type TabOption = 'flights' | 'drive' | 'stays' | 'weather' | 'attractions' | 'tours';

const TripSkeleton = () => {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center py-10 mb-2">
         <div className="relative w-16 h-16 mb-5">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">✈️</div>
         </div>
         <h3 className="text-xl font-black text-gray-800 tracking-tight">Crafting your perfect trip...</h3>
         <p className="text-sm font-bold text-gray-400 mt-1 animate-pulse">Analyzing routes, stays, and local weather</p>
      </div>

      <div className="flex w-full border-b border-gray-200 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center py-4 gap-2 opacity-40">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-16 h-2 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg animate-pulse shrink-0"></div>
            <div className="flex flex-col gap-3 flex-1 justify-center">
              <div className="w-1/3 h-4 bg-gray-100 rounded-full animate-pulse"></div>
              <div className="w-1/2 h-3 bg-gray-50 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col gap-2 items-end justify-center shrink-0">
              <div className="w-20 h-6 bg-gray-100 rounded-full animate-pulse"></div>
              <div className="w-12 h-3 bg-gray-50 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TripResults({ data, loading }: { data: any, loading: boolean }) {
  const [activeTab, setActiveTab] = useState<TabOption>('flights');

  const showFlights = data?.rawParams?.travelMode === 'fly';
  // ✨ RENAMED: Reading from flightData instead of transportData
  const hasFlights = data?.flightData && data.flightData.length > 0;

  useEffect(() => {
    if (data && !loading) {
      if (showFlights && hasFlights) {
        setActiveTab('flights');
      } else {
        setActiveTab('drive');
      }
    }
  }, [data, loading, showFlights, hasFlights]);

  if (loading) return <TripSkeleton />;
  if (!data && !loading) return null;

  const transportTab = (showFlights && hasFlights) 
    ? { id: 'flights', label: 'Flights', icon: '✈️' }
    : { id: 'drive', label: 'Drive', icon: '🚗' };

  const tabs = [
    transportTab,
    { id: 'stays', label: 'Stays', icon: '🏨' },
    { id: 'attractions', label: 'Attractions', icon: '🎡' },
    { id: 'tours', label: 'Tours', icon: '🗺️' },
    { id: 'weather', label: 'Weather', icon: '☀️' },
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mb-4">
        <div className="flex w-full border-b border-gray-200">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabOption)}
                className={`flex-1 flex flex-col items-center py-4 transition-all relative group`}
              >
                <span className={`text-lg mb-1 group-hover:scale-110 transition-transform ${isActive ? 'grayscale-0' : 'grayscale opacity-70'}`}>
                  {tab.icon}
                </span>
                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full shadow-[0_-4px_10px_rgba(37,99,235,0.3)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full min-h-[400px]">
        {activeTab === 'flights' && (
          // ✨ RENAMED: Passing flightData instead of transportData
          <FlightCard flights={data?.flightData || []}/>
        )}

        {activeTab === 'drive' && (
          <div className="flex flex-col gap-4">
            {showFlights && !hasFlights && (
              <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 flex items-center gap-3">
                <span className="text-xl">ℹ️</span>
                <p className="text-sm font-medium">
                  We couldn't find any flights for this route, so we're showing you the best driving route instead!
                </p>
              </div>
            )}
            <DrivingCard drivingData={data?.drivingData || {}} />
          </div>
        )}
        
        {activeTab === 'stays' && (
          <StaysCard stays={data?.stays || []} />
        )}
        
        {activeTab === 'attractions' && (
          <AttractionsCard attractions={data?.attractions || []} />
        )}

        {activeTab === 'tours' && (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-2xl mt-4">
            <span className="text-4xl block mb-4">🗺️</span>
            <h3 className="text-lg font-black text-gray-800">Local Tours & Experiences</h3>
            <p className="text-gray-500 text-sm mt-1">Guided tours coming soon for {data?.rawParams?.destination?.name || 'this destination'}.</p>
          </div>
        )}
        
        {activeTab === 'weather' && (
          <WeatherCard weather={data?.weather} />
        )}
      </div>
    </div>
  );
}