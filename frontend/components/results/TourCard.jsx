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
              id={`tour-card-${idx}`}
              className={`group border rounded-xl p-4 transition-all duration-200 flex flex-col gap-4 ${isSelected ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-bg/20 shadow-sm' : 'border-theme-surface bg-theme-bg/10 hover:border-theme-muted hover:shadow-md shadow-sm'}`}
            >
              
              {tour.picture_url ? (
                <div className="w-full h-40 md:h-48 rounded-lg shrink-0 shadow-sm border border-theme-surface overflow-hidden">
                  <img 
                    src={tour.picture_url} 
                    alt={tour.name} 
                    className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500 ease-out" 
                  />
                </div>
              ) : (
                <div className="w-full h-40 md:h-48 bg-theme-muted/20 text-theme-secondary flex items-center justify-center rounded-lg shrink-0 shadow-sm text-4xl border border-theme-muted overflow-hidden">
                  <div className="scale-110 group-hover:scale-100 transition-transform duration-500 ease-out">
                    🎟️
                  </div>
                </div>
              )}
              
              <div className="flex flex-col flex-1 justify-between overflow-hidden">
                <div>
                  
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <h4 className="font-bold text-theme-text text-base leading-tight mb-1 flex-1 min-w-[150px]" title={tour.name}>
                      {tour.name}
                    </h4>

                    <label htmlFor={`tour-select-${idx}`} className="flex items-center gap-2 cursor-pointer bg-theme-bg text-theme-text px-4 py-2 rounded-lg hover:bg-theme-surface border border-theme-surface transition-colors shadow-sm shrink-0">
                      <input 
                        type="checkbox" 
                        id={`tour-select-${idx}`} 
                        checked={isSelected} 
                        onChange={() => toggleTourSelection(tour, uniqueKey)} 
                        className="w-4 h-4 accent-theme-primary cursor-pointer" 
                      />
                      <span className="text-xs font-bold text-theme-text/80 select-none w-[56px] inline-block text-center">
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </label>
                  </div>
                  
                  <p className="text-sm text-theme-text/70 line-clamp-3 leading-relaxed mt-2" title={tour.short_description}>
                    {tour.short_description || "Experience the best of the local culture and sights with this guided activity."}
                  </p>
                </div>
                
                <div className="flex w-full items-center justify-center pt-3 mt-4 border-t border-theme-surface">
                  
                  <div className="flex-1 text-center border-r border-theme-surface">
                    <span className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-0.5">
                      Duration
                    </span>
                    <span className="text-sm font-semibold text-theme-text/80">
                      {tour.minimum_duration ? `⏱️ ${tour.minimum_duration}` : 'Flexible'}
                    </span>
                  </div>

                  <div className="flex-1 text-center">
                    <span className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-0.5">
                      Price
                    </span>
                    <span className="text-sm font-black text-theme-secondary">
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