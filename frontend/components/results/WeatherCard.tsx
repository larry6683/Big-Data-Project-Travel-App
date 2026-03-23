// larry6683/big-data-project-travel-app/frontend/components/results/WeatherCard.tsx

import React, { useState, useEffect } from 'react';

export default function WeatherCard({ weather }: { weather: any }) {
  const [isSelected, setIsSelected] = useState<boolean>(false);

  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        // Check if weather is saved as a selected object
        if (tripState.weather && tripState.weather.selected) {
          setIsSelected(true);
        } else {
          setIsSelected(false);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [weather]);

  const toggleWeatherSelection = () => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    
    const newSelected = !isSelected;
    setIsSelected(newSelected);

    // Save the entire weather data object just like the DrivingCard does
    tripState.weather = newSelected ? { selected: true, data: weather } : null;
    localStorage.setItem('trip_state', JSON.stringify(tripState));
  };

  if (!weather || !weather.days || weather.days.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold italic">
        Weather data is currently unavailable for these dates.
      </div>
    );
  }

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sun')) return '☀️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
    if (desc.includes('thunder') || desc.includes('storm')) return '⛈️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('mist') || desc.includes('fog')) return '🌫️';
    return '⛅';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 shadow-sm p-5 ${isSelected ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-100/10' : 'bg-white hover:shadow-md'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Trip Forecast</h3>
        
        {/* Main Selection Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm shrink-0">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={() => toggleWeatherSelection()} 
            className="w-4 h-4 accent-blue-600 cursor-pointer" 
          />
          <span className="text-xs font-bold text-gray-700 select-none w-[56px] inline-block text-center">
                          {isSelected ? 'Selected' : 'Select'}
          </span>
        </label>

      </div>
      
      {weather.overall_summary && (
        <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-600 text-sm font-medium">
          ℹ️ {weather.overall_summary}
        </div>
      )}

      {/* Changed to flex-col to stack rows vertically (one day per row) */}
      <div className="flex flex-col gap-3">
        {weather.days.map((day: any, idx: number) => (
          <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 transition-colors shadow-sm flex flex-row items-center justify-between gap-4">
            
            {/* Left Side: Icon & Date Details */}
            <div className="flex items-center gap-4">
              <div className="text-4xl drop-shadow-sm shrink-0">
                {getWeatherIcon(day.weather)}
              </div>
              <div className="flex flex-col">
                <p className="font-black text-sm text-gray-800 uppercase tracking-wider mb-1">
                  {formatDate(day.date)}
                </p>
                <p className="text-[11px] text-gray-500 font-bold uppercase leading-tight">
                  {day.weather}
                </p>
              </div>
            </div>
            
            {/* Right Side: High/Low Temperatures */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-red-400 font-bold uppercase mb-0.5">High</span>
                <span className="font-black text-red-600 text-lg sm:text-xl leading-none">
                  {Math.round(day.max_temp)}°
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-blue-400 font-bold uppercase mb-0.5">Low</span>
                <span className="font-black text-blue-600 text-lg sm:text-xl leading-none">
                  {Math.round(day.min_temp)}°
                </span>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}