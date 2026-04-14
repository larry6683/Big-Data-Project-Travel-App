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
              className={`border rounded-xl p-4 transition-all duration-300 ease-in-out origin-center flex flex-row items-center justify-between gap-4 ${
                isSelected ? 'border-theme-primary ring-1 ring-theme-primary bg-theme-bg/20 shadow-sm' : 'border-theme-surface bg-theme-bg/10 hover:border-theme-muted hover:shadow-md'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="font-bold text-theme-text leading-tight" title={name}>{name}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-theme-surface text-theme-primary text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                    {category.replace(/_/g, ' ')}
                  </span>
                  
                  {poi.distance && (
                    <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1">
                      <span className="text-theme-muted/60">•</span> 📍 {(poi.distance / 1609.34).toFixed(1)} miles away
                    </span>
                  )}
                </div>
              </div>
        
              <label className="flex items-center gap-2 cursor-pointer bg-theme-bg text-theme-text px-4 py-2 rounded-lg hover:bg-theme-surface border border-theme-surface transition-colors shadow-sm shrink-0">
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => toggleAttractionSelection(poi, uniqueKey)} 
                  className="w-4 h-4 accent-theme-primary cursor-pointer transition-transform duration-300 hover:scale-110" 
                />
          <span className="text-xs font-bold text-theme-text/80 select-none w-[56px] inline-block text-center">
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