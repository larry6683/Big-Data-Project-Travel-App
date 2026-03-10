// larry6683/big-data-project-travel-app/frontend/components/results/TripResults.tsx

import React, { useState, useEffect } from 'react';
import FlightCard from './FlightCard';
import StaysCard from './StayCard';
import WeatherCard from './WeatherCard';
import AttractionsCard from './AttractionCard';
import DrivingCard from './DrivingCard';
import ToursCard from './TourCard'; 
import { Loader2 } from 'lucide-react';

type TabOption = 'flights' | 'drive' | 'stays' | 'weather' | 'attractions' | 'tours';

// 🌟 Dedicated Loading Component for the fast-changing icons
const LoadingState = () => {
  const icons = ['✈️', '🚗', '🏨', '🎡', '🗺️', '☀️'];
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    // Cycle through the icons every 300 milliseconds
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center w-24 h-24 mb-4">
        <Loader2 className="absolute inset-0 w-full h-full text-blue-600 animate-spin" strokeWidth={1.5} />
        <div className="text-4xl drop-shadow-sm z-10 transition-opacity" style={{ transform: 'translateY(-2px)' }}>
          {icons[iconIndex]}
        </div>
      </div>
      <h3 className="text-xl font-black text-gray-800 mt-4 animate-pulse">Crafting your itinerary...</h3>
      <p className="text-gray-500 text-sm mt-2 text-center max-w-sm">
        Searching routes, checking hotel availability, and gathering the best local attractions.
      </p>
    </div>
  );
};

export default function TripResults({ data, loading }: { data: any, loading: boolean }) {
  const [activeTab, setActiveTab] = useState<TabOption>('flights');

  const showFlights = data?.rawParams?.travelMode === 'fly';
  const hasFlights = data?.flightData && data.flightData.length > 0;

  useEffect(() => {
    if (data && !loading) {
      // Check if we have a saved tab in sessionStorage first
      const savedTab = sessionStorage.getItem('active_tab') as TabOption | null;
      
      if (savedTab) {
        setActiveTab(savedTab);
      } else if (showFlights && hasFlights) {
        setActiveTab('flights');
      } else {
        setActiveTab('drive');
      }
    }
  }, [data, loading, showFlights, hasFlights]);

  // Handle saving to sessionStorage when a tab is clicked
  const handleTabChange = (tabId: TabOption) => {
    setActiveTab(tabId);
    sessionStorage.setItem('active_tab', tabId);
  };

  if (!data && !loading) return null;

  if (loading) {
    return <LoadingState />;
  }

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
      
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm pt-2 mb-4 border-b border-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.02)] -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabOption)}
                className={`flex-1 flex flex-col items-center py-3 transition-all relative group`}
              >
                <span className={`text-lg mb-1 group-hover:scale-110 transition-transform ${isActive ? 'grayscale-0' : 'grayscale opacity-70'}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                
                {isActive && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-blue-600 rounded-t-full shadow-[0_-4px_10px_rgba(37,99,235,0.3)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full min-h-[400px]">
        {activeTab === 'flights' && (
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
          <ToursCard tours={data?.toursData || []} />
        )}
        
        {activeTab === 'weather' && (
          <WeatherCard weather={data?.weather} />
        )}
      </div>
    </div>
  );
}