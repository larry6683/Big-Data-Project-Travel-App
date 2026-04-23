import React, { useState, useEffect } from 'react';

export default function ToursCard({ tours }) {
  const [selectedKeys, setSelectedKeys] = useState([]);
  useEffect(() => { const tripStateStr = localStorage.getItem('trip_state'); if (tripStateStr) { try { const t = JSON.parse(tripStateStr); if (t.tours) setSelectedKeys(t.tours.map((x) => x._selectionKey)); } catch (e) {} } }, [tours]);
  const toggleTourSelection = (item, key) => { const tripStateStr = localStorage.getItem('trip_state'); let t = tripStateStr ? JSON.parse(tripStateStr) : {}; if (!t.tours) t.tours = []; if (selectedKeys.includes(key)) { t.tours = t.tours.filter((x) => x._selectionKey !== key); setSelectedKeys(p => p.filter(k => k !== key)); } else { t.tours.push({ ...item, _selectionKey: key }); setSelectedKeys(p => [...p, key]); } localStorage.setItem('trip_state', JSON.stringify(t)); };

  // THE FIX: Return the sleek empty state instead of null
  if (!tours || tours.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-surface bg-theme-surface/10 rounded-3xl text-center flex items-center justify-center min-h-[120px]">
        <span className="text-xs text-theme-muted font-black tracking-widest uppercase">
          No tours or activities found for this location.
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {tours.map((tour, idx) => {
        const uniqueKey = tour.id || `tour-${idx}`;
        const isSelected = selectedKeys.includes(uniqueKey);

        return (
          <div key={uniqueKey} className={`group border rounded-3xl p-6 transition-all duration-200 flex flex-col gap-5 ${isSelected ? 'border-theme-primary ring-2 ring-theme-primary bg-theme-primary/5 shadow-xl' : 'border-theme-surface bg-theme-bg hover:shadow-xl hover:border-theme-muted'}`}>
            
            {tour.picture_url ? (
              <div className="w-full h-56 rounded-2xl shrink-0 shadow-sm border border-theme-surface overflow-hidden relative">
                <img src={tour.picture_url} alt={tour.name} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 ease-out" />
              </div>
            ) : (
              <div className="w-full h-56 bg-theme-surface text-theme-secondary flex items-center justify-center rounded-2xl shrink-0 text-5xl">🎟️</div>
            )}
            
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <h4 className="font-black text-theme-text text-2xl leading-tight mb-3">{tour.name}</h4>
                <p className="text-sm text-theme-text/70 line-clamp-3 leading-relaxed font-medium">
                  {tour.short_description || "Experience the best of the local culture and sights with this guided activity."}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-theme-surface">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Price</span>
                  <span className="text-3xl font-black text-theme-primary">
                    {tour.price ? `${tour.currency === 'USD' ? '$' : tour.currency === 'EUR' ? '€' : tour.currency}${tour.price}` : 'Free'}
                  </span>
                </div>
                <button onClick={() => toggleTourSelection(tour, uniqueKey)} className={`px-8 py-3.5 rounded-2xl font-black text-[15px] transition-all shadow-md active:scale-[0.98] ${isSelected ? "bg-theme-primary text-theme-bg" : "bg-theme-secondary text-theme-bg hover:opacity-90"}`}>
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}