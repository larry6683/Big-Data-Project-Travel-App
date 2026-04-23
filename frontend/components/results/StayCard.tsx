import React, { useState, useEffect } from "react";

const getNumNights = (start?: string, end?: string) => {
  if (!start || !end) return 1;
  return Math.max(1, Math.ceil(Math.abs(new Date(end).getTime() - new Date(start).getTime()) / 86400000));
};

const formatAddress = (address: any) => {
  if (!address) return "Location unavailable";
  if (typeof address === "string") return address;
  const parts = [address.lines?.join(", "), address.cityName, address.stateCode, address.countryCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
};

const StayRow = ({ stay, uniqueKey, isSelected, toggleStaySelection, searchParams }: any) => {
  const offer = stay.roomDetails;
  const isUnavailable = offer?.unavailable || !offer || (offer.rooms && offer.rooms.length === 0);
  const numNights = getNumNights(searchParams?.startDate, searchParams?.endDate);

  return (
    <div className={`rounded-3xl overflow-hidden transition-all duration-200 border relative ${isSelected ? 'border-theme-primary ring-2 ring-theme-primary bg-theme-bg shadow-xl' : 'border-theme-surface bg-theme-bg hover:shadow-xl hover:border-theme-muted'}`}>
      {isSelected && <div className="absolute top-0 left-0 w-2 h-full bg-theme-primary z-10"></div>}
      
      <div className={`p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-theme-surface ${isSelected ? 'bg-theme-primary/5' : 'bg-theme-surface/20'}`}>
        <div className="flex flex-col">
          <h4 className="font-black text-2xl text-theme-text leading-tight mb-2">
            {stay.name || stay.hotel?.name || "Hotel"}
          </h4>
          <p className="text-[11px] text-theme-muted font-black uppercase tracking-widest">
            📍 {formatAddress(stay.address)}
          </p>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            {!isUnavailable && offer ? (
              <div className="text-right">
                <p className="text-4xl font-black text-theme-primary tracking-tight">
                  ${offer.price?.toFixed(2)}
                </p>
                <p className="text-[10px] text-theme-muted font-black uppercase tracking-widest mt-1">Total Stay</p>
              </div>
            ) : (
              <span className="text-theme-accent bg-theme-accent/10 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-theme-accent/20">
                Sold Out
              </span>
            )}
            <button 
              disabled={isUnavailable} 
              onClick={() => { if (!isUnavailable) toggleStaySelection(stay, uniqueKey); }} 
              className={`px-8 py-4 rounded-2xl font-black text-[15px] transition-all shadow-md shrink-0 active:scale-[0.98] ${isUnavailable ? "opacity-40 cursor-not-allowed bg-theme-surface text-theme-text/50" : isSelected ? "bg-theme-primary text-theme-bg" : "bg-theme-secondary text-theme-bg hover:opacity-90"}`}
            >
              {isUnavailable ? "Unavailable" : isSelected ? "Selected" : "Select"}
            </button>
        </div>
      </div>

      {offer?.rooms && !isUnavailable && (
        <div className="p-4 flex flex-col gap-3 bg-theme-surface/10">
          {offer.rooms.map((room: any, i: number) => (
            <div key={i} className="flex flex-col sm:flex-row justify-between bg-theme-bg p-5 rounded-2xl border border-theme-surface shadow-sm gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-black text-theme-text">
                  {room.category || "Standard Room"}
                </p>
                <div className="flex gap-2">
                  <span className="bg-theme-surface px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-theme-text shadow-sm">{room.bed_type || "Standard Bed"}</span>
                  <span className="bg-theme-surface px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-theme-text shadow-sm">{room.beds_count || 1} Bed(s)</span>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 flex flex-col justify-center">
                  <p className="text-2xl font-black text-theme-secondary tracking-tight">
                    ${(room.price / numNights).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-theme-muted font-black uppercase tracking-widest mt-1">/ night</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StaysCard({ stays, searchParams }: { stays: any[]; searchParams?: any; }) {
  const [selectedStayKeys, setSelectedStayKeys] = useState<string[]>([]);
  
  useEffect(() => { 
    const tripState = localStorage.getItem("trip_state"); 
    if (tripState) { 
      try { 
        const parsed = JSON.parse(tripState); 
        if (parsed.stays) setSelectedStayKeys(parsed.stays.map((s: any) => s._selectionKey)); 
      } catch (e) {} 
    } 
  }, [stays]);

  const toggleStaySelection = (stay: any, uniqueKey: string) => { 
    const tripStateStr = localStorage.getItem("trip_state"); 
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {}; 
    const isSelected = selectedStayKeys.includes(uniqueKey); 
    if (isSelected) { 
      tripState.stays = []; 
      setSelectedStayKeys([]); 
    } else { 
      tripState.stays = [ { ...stay, _selectionKey: uniqueKey, offerDetails: stay.roomDetails } ]; 
      setSelectedStayKeys([uniqueKey]); 
    } 
    localStorage.setItem("trip_state", JSON.stringify(tripState)); 
        // Event this to show on the Map
window.dispatchEvent(new Event("trip_state_changed"));
  };

  if (!stays || stays.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-surface bg-theme-surface/10 rounded-3xl text-center flex items-center justify-center min-h-[120px]">
        <span className="text-xs text-theme-muted font-black tracking-widest uppercase">
          No accommodations found for these dates.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {stays.slice(0, 12).map((stay, idx) => {
        const uniqueKey = stay.hotel_id || stay.hotelId || stay.id || `stay-${idx}`;
        return <StayRow key={uniqueKey} stay={stay} uniqueKey={uniqueKey} isSelected={selectedStayKeys.includes(uniqueKey)} toggleStaySelection={toggleStaySelection} searchParams={searchParams} />;
      })}
    </div>
  );
}