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
      <div className="p-8 text-center bg-theme-surface border border-dashed border-theme-muted rounded-2xl text-theme-text/70 font-bold italic">
        No attractions found within the requested radius.
      </div>
    );
  }

  return (
    <div className="bg-theme-bg rounded-xl p-2">
      <div className="flex flex-col gap-3">
        {attractions.slice(0, 12).map((poi, idx) => {
          const uniqueKey = poi.id || `attraction-${idx}`;
          const isSelected = selectedKeys.includes(uniqueKey);
          const name = poi.name || poi.tags?.name || 'Interesting Place';
          const category = poi.category || poi.tags?.tourism || poi.tags?.amenity || 'Activity';
          
          return (
            <div 
              key={uniqueKey} 
              className={`border rounded-xl p-4 sm:p-5 transition-all duration-300 ease-in-out origin-center flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isSelected ? 'border-theme-primary ring-2 ring-theme-primary bg-theme-primary/5 shadow-sm' : 'border-theme-surface bg-theme-bg hover:border-theme-muted hover:shadow-md'
              }`}
            >
              <div className="flex flex-col gap-2">
                <h4 className="font-extrabold text-lg text-theme-text leading-tight" title={name}>{name}</h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-block bg-theme-surface text-theme-secondary text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {category.replace(/_/g, ' ')}
                  </span>
                  
                  {poi.distance && (
                    <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-theme-muted/60">•</span> 📍 {(poi.distance / 1609.34).toFixed(1)} miles away
                    </span>
                  )}
                </div>
              </div>
        
              <button 
                onClick={() => toggleAttractionSelection(poi, uniqueKey)} 
                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm shrink-0 active:scale-95 w-full sm:w-auto ${
                  isSelected 
                    ? "bg-theme-primary text-theme-bg" 
                    : "bg-theme-secondary text-theme-bg hover:bg-theme-secondary/90"
                }`}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}