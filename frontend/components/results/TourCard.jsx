// larry6683/big-data-project-travel-app/frontend/components/results/ToursCard.jsx

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
      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold italic">
        No specific tours or guided experiences found for this destination.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-4">🗺️ Local Tours & Experiences</h3>
      
      {/* Changed to flex-col to stack rows vertically (one per row) */}
      <div className="flex flex-col gap-4">
        {tours.map((tour, idx) => {
          const uniqueKey = tour.id || `tour-${idx}`;
          const isSelected = selectedKeys.includes(uniqueKey);

          return (
            <div 
              key={uniqueKey} 
              className={`border rounded-xl p-4 transition-colors shadow-sm flex flex-col sm:flex-row gap-4 ${isSelected ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-100/10' : 'bg-white hover:shadow-md'}`}
            >
              
              {/* Tour Image or Placeholder */}
              {tour.picture_url ? (
                <img src={tour.picture_url} alt={tour.name} className="w-full sm:w-28 sm:h-28 object-cover rounded-lg shrink-0 shadow-sm border border-gray-200" />
              ) : (
                <div className="w-full sm:w-28 sm:h-28 h-32 bg-indigo-100 text-indigo-400 flex items-center justify-center rounded-lg shrink-0 shadow-sm text-3xl border border-indigo-200">
                  🎟️
                </div>
              )}
              
              <div className="flex flex-col flex-1 justify-between overflow-hidden">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-800 text-base leading-tight mb-1" title={tour.name}>
                      {tour.name}
                    </h4>

              <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm shrink-0">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleTourSelection(tour, uniqueKey)} 
                    className="w-4 h-4 accent-indigo-600 cursor-pointer" 
                  />
          <span className="text-xs font-bold text-gray-700 select-none w-[56px] inline-block text-center">
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </label>

                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mt-1" title={tour.short_description}>
                    {tour.short_description || "Experience the best of the local culture and sights with this guided activity."}
                  </p>
                </div>
                
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-200/60">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {tour.minimum_duration ? `⏱️ ${tour.minimum_duration}` : 'Flexible duration'}
                  </span>
                  
                  {tour.price && (
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-base">
                      {tour.currency === 'USD' ? '$' : tour.currency === 'EUR' ? '€' : tour.currency}
                      {tour.price}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}