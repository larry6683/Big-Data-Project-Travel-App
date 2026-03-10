// larry6683/big-data-project-travel-app/frontend/components/results/AttractionsCard.tsx

import React, { useState, useEffect } from 'react';

export default function AttractionsCard({ attractions }: { attractions: any[] }) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.attractions) {
          setSelectedKeys(tripState.attractions.map((a: any) => a._selectionKey));
        } else {
          setSelectedKeys([]);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [attractions]);

  const toggleAttractionSelection = (item: any, uniqueKey: string) => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    if (!tripState.attractions) tripState.attractions = [];

    const isSelected = selectedKeys.includes(uniqueKey);

    if (isSelected) {
      tripState.attractions = tripState.attractions.filter((a: any) => a._selectionKey !== uniqueKey);
      setSelectedKeys((prev) => prev.filter((k) => k !== uniqueKey));
    } else {
      const itemToSave = { ...item, _selectionKey: uniqueKey };
      tripState.attractions.push(itemToSave);
      setSelectedKeys((prev) => [...prev, uniqueKey]);
    }

    localStorage.setItem('trip_state', JSON.stringify(tripState));
  };

  if (!attractions || attractions.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold italic">
        No attractions found within the requested radius.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-4">📸 Nearby Attractions</h3>
      
      <div className="flex flex-col gap-3">
        {attractions.slice(0, 12).map((poi, idx) => {
          const uniqueKey = poi.id || `attraction-${idx}`;
          const isSelected = selectedKeys.includes(uniqueKey);
          const name = poi.name || poi.tags?.name || 'Interesting Place';
          const category = poi.category || poi.tags?.tourism || poi.tags?.amenity || 'Activity';
          
          return (
            <div 
              key={uniqueKey} 
              className={`border rounded-xl p-4 transition-all duration-300 ease-in-out origin-center flex flex-row items-center justify-between gap-4 ${
                isSelected ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-100/10' : 'bg-white hover:shadow-md'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="font-bold text-gray-800 leading-tight" title={name}>{name}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-gray-200/60 text-blue-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                    {category.replace(/_/g, ' ')}
                  </span>
                  
                  {poi.distance && (
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="text-gray-300">•</span> 📍 {(poi.distance / 1609.34).toFixed(1)} miles away
                    </span>
                  )}
                </div>
              </div>
        
              <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm shrink-0">
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => toggleAttractionSelection(poi, uniqueKey)} 
                  className="w-4 h-4 accent-indigo-600 cursor-pointer transition-transform duration-300 hover:scale-110" 
                />
          <span className="text-xs font-bold text-gray-700 select-none w-[56px] inline-block text-center">
                  {isSelected ? 'Selected' : 'Select'}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}