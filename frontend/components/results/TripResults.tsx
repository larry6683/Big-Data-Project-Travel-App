// larry6683/big-data-project-travel-app/frontend/components/results/TripResults.tsx

import React, { useState, useEffect } from 'react';
import FlightCard from './FlightCard';
import StaysCard from './StayCard';
import WeatherCard from './WeatherCard';
import AttractionsCard from './AttractionsCard';
import DrivingCard from './DrivingCard';

type TabOption = 'flights' | 'drive' | 'stays' | 'weather' | 'attractions' | 'tours';

export default function TripResults({ data, loading }: { data: any, loading: boolean }) {
  const [activeTab, setActiveTab] = useState<TabOption>('flights');

  // Safely check the travel mode passed directly from page.tsx
  const showFlights = data?.travelMode === 'fly';

  // Reset the active tab whenever a new search completes
  useEffect(() => {
    if (data && !loading) {
      if (showFlights && activeTab === 'drive') {
        setActiveTab('flights');
      } else if (!showFlights && activeTab === 'flights') {
        setActiveTab('drive');
      }
    }
  }, [data, loading, showFlights]);

  if (!data && !loading) return null;

  // Conditionally set the first transport tab
  const transportTab = showFlights 
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
      {/* MODERN FULL-WIDTH TABS */}
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
                
                {/* THE ACTIVE UNDERLINE */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full shadow-[0_-4px_10px_rgba(37,99,235,0.3)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="w-full min-h-[400px]">
        {activeTab === 'flights' && (
          <FlightCard flights={data?.transportData || []}/>
        )}

        {activeTab === 'drive' && (
          <DrivingCard drivingData={data?.drivingData || {}} />
        )}
        
        {activeTab === 'stays' && (
          <StaysCard stays={data?.stays || []} />
        )}
        
        {activeTab === 'attractions' && (
          <AttractionsCard attractions={data?.attractions || []} />
        )}

        {activeTab === 'tours' && (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
            <span className="text-4xl block mb-4">🗺️</span>
            <h3 className="text-lg font-black text-gray-800">Local Tours & Experiences</h3>
            <p className="text-gray-500 text-sm mt-1">Guided tours coming soon for {data?.destinationData?.name || 'this destination'}.</p>
          </div>
        )}
        
        {activeTab === 'weather' && (
          <WeatherCard weather={data?.weather} />
        )}
      </div>
    </div>
  );
}