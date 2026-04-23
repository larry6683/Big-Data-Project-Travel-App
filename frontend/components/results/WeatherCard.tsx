import React, { useState, useEffect } from 'react';

export default function WeatherCard({ weather }: { weather: any }) {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  useEffect(() => { const tripStateStr = localStorage.getItem('trip_state'); if (tripStateStr) { try { const tripState = JSON.parse(tripStateStr); setIsSelected(tripState.weather?.selected === true); } catch (e) {} } }, [weather]);
  const toggleWeatherSelection = () => { const tripStateStr = localStorage.getItem('trip_state'); let tripState = tripStateStr ? JSON.parse(tripStateStr) : {}; const newSelected = !isSelected; setIsSelected(newSelected); tripState.weather = newSelected ? { selected: true, data: weather } : null; localStorage.setItem('trip_state', JSON.stringify(tripState)); };
  const getWeatherIcon = (d: string) => { const desc = d.toLowerCase(); if (desc.includes('clear') || desc.includes('sun')) return '☀️'; if (desc.includes('cloud')) return '☁️'; if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️'; if (desc.includes('thunder') || desc.includes('storm')) return '⛈️'; if (desc.includes('snow')) return '❄️'; return '⛅'; };
  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

  // THE FIX: Return the sleek empty state instead of null
  if (!weather || !weather.days || weather.days.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-surface bg-theme-surface/10 rounded-3xl text-center flex items-center justify-center min-h-[120px]">
        <span className="text-xs text-theme-muted font-black tracking-widest uppercase">
          Weather forecast is currently unavailable.
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border transition-all duration-200 relative overflow-hidden ${isSelected ? 'border-theme-primary ring-2 ring-theme-primary bg-theme-bg shadow-xl' : 'border-theme-surface bg-theme-bg hover:shadow-xl hover:border-theme-muted'}`}>
      {isSelected && <div className="absolute top-0 left-0 w-2 h-full bg-theme-primary z-10"></div>}
      
      <div className={`p-6 md:p-8 flex justify-between items-center border-b border-theme-surface ${isSelected ? 'bg-theme-primary/5' : 'bg-theme-surface/20'}`}>
        <h3 className="text-3xl font-black text-theme-text tracking-tight">Trip Forecast</h3>
        <button onClick={toggleWeatherSelection} className={`px-8 py-4 rounded-2xl font-black text-[15px] transition-all shadow-md shrink-0 active:scale-[0.98] ${isSelected ? "bg-theme-primary text-theme-bg" : "bg-theme-secondary text-theme-bg hover:opacity-90"}`}>
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
      
      <div className="p-6 md:p-8 flex flex-col gap-4">
        {weather.days.map((day: any, idx: number) => (
          <div key={idx} className="bg-theme-surface/30 rounded-2xl p-5 border border-theme-surface shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-5xl drop-shadow-md">{getWeatherIcon(day.weather)}</div>
              <div>
                <p className="font-black text-lg text-theme-text uppercase tracking-wider mb-1">{formatDate(day.date)}</p>
                <p className="text-[11px] text-theme-muted font-black uppercase tracking-widest">{day.weather}</p>
              </div>
            </div>
            <div className="flex items-center gap-8 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-theme-accent font-black uppercase tracking-widest block mb-1">High</span>
                <span className="font-black text-theme-text text-3xl">{Math.round(day.max_temp)}°</span>
              </div>
              <div className="text-right border-l border-theme-surface pl-8">
                <span className="text-[10px] text-theme-muted font-black uppercase tracking-widest block mb-1">Low</span>
                <span className="font-black text-theme-muted text-3xl">{Math.round(day.min_temp)}°</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}