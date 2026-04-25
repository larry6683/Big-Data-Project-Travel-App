import React from 'react';

export default function WeatherCard({ weather }: { weather: any }) {
  const getWeatherIcon = (d: string) => { 
    const desc = d.toLowerCase(); 
    if (desc.includes('clear') || desc.includes('sun')) return '☀️'; 
    if (desc.includes('cloud')) return '☁️'; 
    if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️'; 
    if (desc.includes('thunder') || desc.includes('storm')) return '⛈️'; 
    if (desc.includes('snow')) return '❄️'; 
    return '⛅'; 
  };
  
  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

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
    <div className="rounded-3xl border border-theme-surface bg-theme-bg hover:shadow-xl hover:border-theme-muted transition-all duration-200 overflow-hidden">
      
      <div className="p-6 md:p-8 flex justify-between items-center border-b border-theme-surface bg-theme-surface/20">
        <h3 className="text-3xl font-black text-theme-text tracking-tight">Trip Forecast</h3>
        {/* Replaced the Select button with an auto-included badge */}
        <div className="px-4 py-2 bg-theme-primary/10 text-theme-primary rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest border border-theme-primary/20">
          ✨ Auto-Included in Itinerary
        </div>
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