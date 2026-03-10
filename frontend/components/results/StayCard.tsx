// larry6683/big-data-project-travel-app/frontend/components/results/StayCard.tsx

import React, { useState, useEffect } from 'react';

export default function StayCard({ stays }: { stays: any[] }) {
  const [selectedStayKeys, setSelectedStayKeys] = useState<string[]>([]);
  const [loadingStayId, setLoadingStayId] = useState<string | null>(null);
  const [stayDetails, setStayDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.stays && tripState.stays.length > 0) {
          const keys = tripState.stays.map((s: any) => s._selectionKey);
          setSelectedStayKeys(keys);
          
          const detailsMap: Record<string, any> = {};
          tripState.stays.forEach((s: any) => {
            if (s.detailedOffers) {
              detailsMap[s._selectionKey] = { data: s.detailedOffers };
            }
          });
          setStayDetails(detailsMap);
        } else {
          setSelectedStayKeys([]);
          setStayDetails({});
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [stays]);

  const toggleStaySelection = async (stay: any, uniqueKey: string) => {
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};

    const isSelected = selectedStayKeys.includes(uniqueKey);

    if (isSelected) {
      tripState.stays = [];
      setSelectedStayKeys([]);
      localStorage.setItem('trip_state', JSON.stringify(tripState));
    } else {
      try {
        setLoadingStayId(uniqueKey);
        
        const targetHotelId = stay.hotelId || (stay.hotel && stay.hotel.hotelId) || stay.id || uniqueKey; 
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/hotels/offers?hotelIds=${targetHotelId}`);
        
        let enrichedData: { detailedOffers: any[]; dictionaries: any } = { detailedOffers: [], dictionaries: {} };
        if (response.ok) {
           const data = await response.json();
           enrichedData = { 
             detailedOffers: data.data || data || [], 
             dictionaries: data.dictionaries || {} 
           };
           
           setStayDetails(prev => ({ ...prev, [uniqueKey]: { data: enrichedData.detailedOffers } }));
        }

        const stayToSave = { ...stay, ...enrichedData, _selectionKey: uniqueKey };
        tripState.stays = [stayToSave];
        setSelectedStayKeys([uniqueKey]);
        localStorage.setItem('trip_state', JSON.stringify(tripState));

      } catch (error) {
        console.error("Failed to fetch detailed hotel offers", error);
        
        const stayToSave = { ...stay, _selectionKey: uniqueKey };
        tripState.stays = [stayToSave];
        setSelectedStayKeys([uniqueKey]);
        localStorage.setItem('trip_state', JSON.stringify(tripState));
      } finally {
        setLoadingStayId(null);
      }
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
      <div className="p-8 text-center bg-white border border-dashed border-gray-300 rounded-xl text-gray-500 shadow-sm">
        <span className="text-3xl block mb-2">🏨</span>
        <h3 className="text-base font-bold text-gray-800">No hotels found</h3>
        <p className="text-sm">Try adjusting your search dates or destination.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b border-gray-200 pb-3 mb-2">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Available Hotels...</h3>
        <p className="text-xs text-gray-500">Showing {Math.min(stays.length, 12)} of {stays.length} options</p>
      </div>
      
      <div className="flex flex-col gap-3">
        {stays.slice(0, 12).map((stay, idx) => {
          const uniqueKey = stay.hotelId || (stay.hotel && stay.hotel.hotelId) || stay.id || `stay-${idx}`;
          const isSelected = selectedStayKeys.includes(uniqueKey);
          const isLoading = loadingStayId === uniqueKey;
          const details = stayDetails[uniqueKey];
          
          const hotelName = stay.name || (stay.hotel && stay.hotel.name) || 'Unknown Hotel';
          const hotelAddress = stay.address || (stay.hotel && stay.hotel.address) || null;

          return (
            <div 
              key={uniqueKey} 
              className={`border-[0.5px] border-gray-200 rounded-xl transition-all duration-200 overflow-hidden ${
                isSelected ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/10' : 'bg-white hover:shadow-md'
              }`}
            >
              <div className="p-4 flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                <div className="flex flex-col flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-extrabold text-lg text-gray-900 leading-tight">
                      {hotelName}
                    </h4>
                    {stay.rating && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                        ⭐ {stay.rating} Star
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 font-medium mb-3">
                    📍 {formatAddress(hotelAddress)}
                  </p>

                  <div className="flex gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Hotel ID: {uniqueKey}
                    </span>
                  </div>
                </div>
                
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 gap-4">
                  <div className="text-left md:text-right leading-none">
                    {stay.price ? (
                       <>
                          <span className="text-xs font-bold text-gray-500 block mb-1">Starts at</span>
                          <p className="text-2xl font-black text-indigo-600 tracking-tight">
                            ${stay.price}
                            <span className="text-[10px] text-gray-500 font-bold ml-1 uppercase">/ night</span>
                          </p>
                       </>
                    ) : (
                      <span className="text-sm font-bold text-gray-400">Select to view offers</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="w-6 h-6 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
        
                <label className="flex items-center gap-2 cursor-pointer bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-50 border-[0.5px] border-gray-200 transition-colors shadow-sm shrink-0">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleStaySelection(stay, uniqueKey)} 
                    className="w-4 h-4 accent-indigo-600 cursor-pointer" 
                  />
          <span className="text-xs font-bold text-gray-700 select-none w-[56px] inline-block text-center">
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </label>

                    )}
                  </div>
                </div>
              </div>

              {isSelected && details && details.data && details.data.length > 0 && (
                <div className="bg-indigo-50/50 border-t-[0.5px] border-gray-200 p-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  <h5 className="text-sm font-black text-indigo-900 mb-3 uppercase tracking-wider">
                    Available Room Offers
                  </h5>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {(details.data[0]?.offers || details.data)?.map((offer: any, offerIdx: number) => (
                      <div key={offer.id || offerIdx} className="bg-white border-[0.5px] border-gray-200 rounded-lg p-3 shadow-sm flex justify-between items-center gap-4 hover:border-indigo-300 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-snug">
                            {offer.room?.description?.text || offer.room?.typeEstimated?.category || 'Standard Room'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {offer.room?.typeEstimated?.beds && (
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                                🛏️ {offer.room.typeEstimated.beds} {offer.room.typeEstimated.bedType || 'Bed'}
                              </span>
                            )}
                            {offer.boardType && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                🍽️ {offer.boardType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-indigo-600 leading-none">
                            {offer.price?.total ? `$${offer.price.total}` : 'N/A'}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">
                            {offer.price?.currency || 'USD'} Total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSelected && !isLoading && (!details || !details.data || details.data.length === 0) && (
                <div className="bg-gray-50 border-t-[0.5px] border-gray-200 p-3 text-center">
                  <p className="text-xs font-bold text-gray-500">
                    Specific room offers could not be loaded at this time.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}