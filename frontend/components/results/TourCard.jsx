import React, { useState, useEffect } from 'react';

export default function ToursCard({ tours }) {
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.tours) {
          setSelectedKeys(tripState.tours.map((t) => t._selectionKey));
        } else {
          setSelectedKeys([]);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [tours]);

  const toggleTourSelection = (item, uniqueKey) => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    if (!tripState.tours) tripState.tours = [];

    const isSelected = selectedKeys.includes(uniqueKey);

    if (isSelected) {
      tripState.tours = tripState.tours.filter((t) => t._selectionKey !== uniqueKey);
      setSelectedKeys((prev) => prev.filter((k) => k !== uniqueKey));
    } else {
      const itemToSave = { ...item, _selectionKey: uniqueKey };
      tripState.tours.push(itemToSave);
      setSelectedKeys((prev) => [...prev, uniqueKey]);
    }

    localStorage.setItem('trip_state', JSON.stringify(tripState));
  };

  if (!tours || tours.length === 0) {
    return (
      <div className="p-8 text-center bg-theme-surface border border-dashed border-theme-surface rounded-2xl text-theme-text/70 font-bold italic">
        No specific tours or guided experiences found for this destination.
      </div>
    );
  }

  return (
    <div className="bg-theme-bg rounded-xl p-2">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {tours.map((tour, idx) => {
          const uniqueKey = tour.id || `tour-${idx}`;
          const isSelected = selectedKeys.includes(uniqueKey);

          return (
            <div 
              key={uniqueKey} 
              className={`group border rounded-xl p-5 transition-all duration-200 flex flex-col gap-4 ${isSelected ? 'border-theme-primary ring-2 ring-theme-primary bg-theme-primary/5 shadow-sm' : 'border-theme-surface bg-theme-bg hover:border-theme-muted hover:shadow-lg shadow-sm'}`}
            >
              
              {tour.picture_url ? (
                <div className="w-full h-44 md:h-52 rounded-xl shrink-0 shadow-sm border border-theme-surface overflow-hidden">
                  <img 
                    src={tour.picture_url} 
                    alt={tour.name} 
                    className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-500 ease-out" 
                  />
                </div>
              ) : (
                <div className="w-full h-44 md:h-52 bg-theme-surface/50 text-theme-secondary flex items-center justify-center rounded-xl shrink-0 shadow-sm text-5xl border border-theme-surface overflow-hidden">
                  <div className="scale-105 group-hover:scale-100 transition-transform duration-500 ease-out">
                    🎟️
                  </div>
                </div>
              )}
              
              <div className="flex flex-col flex-1 justify-between overflow-hidden">
                <div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <h4 className="font-extrabold text-theme-text text-lg leading-tight mb-1 flex-1" title={tour.name}>
                      {tour.name}
                    </h4>

                    <button 
                      onClick={() => toggleTourSelection(tour, uniqueKey)} 
                      className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm shrink-0 active:scale-95 w-full sm:w-auto ${
                        isSelected 
                          ? "bg-theme-primary text-theme-bg" 
                          : "bg-theme-secondary text-theme-bg hover:bg-theme-secondary/90"
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-theme-text/70 line-clamp-3 leading-relaxed mt-3" title={tour.short_description}>
                    {tour.short_description || "Experience the best of the local culture and sights with this guided activity."}
                  </p>
                </div>
                
                <div className="flex w-full items-center justify-between pt-4 mt-5 border-t border-theme-surface">
                  
                  <div className="flex flex-col">
                    <span className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-0.5">
                      Duration
                    </span>
                    <span className="text-sm font-bold text-theme-text">
                      {tour.minimum_duration ? `⏱️ ${tour.minimum_duration}` : 'Flexible'}
                    </span>
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-0.5">
                      Price
                    </span>
                    <span className="text-lg font-black text-theme-primary">
                      {tour.price ? `${tour.currency === 'USD' ? '$' : tour.currency === 'EUR' ? '€' : tour.currency}${tour.price}` : 'Free'}
                    </span>
                  </div>

                </div>
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}