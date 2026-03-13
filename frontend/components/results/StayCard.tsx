// larry6683/big-data-project-travel-app/frontend/components/results/StayCard.tsx

import React, { useState, useEffect } from 'react';

export default function StayCard({ stays }: { stays: any[] }) {
  const [selectedStayKeys, setSelectedStayKeys] = useState<string[]>([]);

  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.stays && tripState.stays.length > 0) {
          const keys = tripState.stays.map((s: any) => s._selectionKey);
          setSelectedStayKeys(keys);
        } else {
          setSelectedStayKeys([]);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [stays]);

  const toggleStaySelection = (stay: any, uniqueKey: string) => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};

    const isSelected = selectedStayKeys.includes(uniqueKey);

    if (isSelected) {
      tripState.stays = [];
      setSelectedStayKeys([]);
      localStorage.setItem('trip_state', JSON.stringify(tripState));
    } else {
      // Save directly without fetching any secondary offers
      const stayToSave = { ...stay, _selectionKey: uniqueKey };
      tripState.stays = [stayToSave];
      setSelectedStayKeys([uniqueKey]);
      localStorage.setItem('trip_state', JSON.stringify(tripState));
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Location unavailable';
    if (typeof address === 'string') return address;
    
    const parts = [
      address.lines?.join(', '),
      address.cityName,
      address.stateCode,
      address.postalCode,
      address.countryCode
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
  };

  if (!stays || stays.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold italic">
        No specific hotels found for this destination.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex justify-between items-end border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">🏨 Available Hotels</h3>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
          Showing {Math.min(stays.length, 12)} of {stays.length}
        </p>
      </div>
      
      <div className="flex flex-col gap-3">
        {stays.slice(0, 12).map((stay, idx) => {
          const uniqueKey = stay.hotelId || (stay.hotel && stay.hotel.hotelId) || stay.id || `stay-${idx}`;
          const isSelected = selectedStayKeys.includes(uniqueKey);
          
          const hotelName = stay.name || (stay.hotel && stay.hotel.name) || 'Unknown Hotel';
          const hotelAddress = stay.address || (stay.hotel && stay.hotel.address) || null;

          return (
            <div 
              key={uniqueKey} 
              className={`border rounded-xl p-4 transition-colors shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 ${
                isSelected ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-100/10' : 'bg-white hover:shadow-md'
              }`}
            >
              <div className="flex flex-col flex-1 w-full text-left">
                <h4 className="font-extrabold text-lg text-gray-900 leading-tight mb-1">
                  {hotelName}
                </h4>
                <p className="text-sm text-gray-500 font-medium">
                  📍 {formatAddress(hotelAddress)}
                </p>
              </div>
              
              <div className="shrink-0">
                <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleStaySelection(stay, uniqueKey)} 
                    className="w-4 h-4 accent-blue-600 cursor-pointer" 
                  />
                  <span className="text-xs font-bold text-gray-700 select-none w-[56px] inline-block text-center">
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}