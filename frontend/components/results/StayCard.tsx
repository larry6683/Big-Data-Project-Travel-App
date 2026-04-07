import React, { useState, useEffect } from "react";

const getNumNights = (start?: string, end?: string) => {
  if (!start || !end) return 1;
  const d1 = new Date(start);
  const d2 = new Date(end);
  return Math.max(
    1,
    Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / 86400000)
  );
};

const formatAddress = (address: any) => {
  if (!address) return "Location unavailable";
  if (typeof address === "string") return address;

  const parts = [
    address.lines?.join(", "),
    address.cityName,
    address.stateCode,
    address.postalCode,
    address.countryCode,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
};

const StayRow = ({
  stay,
  uniqueKey,
  hotelId,
  isSelected,
  toggleStaySelection,
  searchParams,
  stayIndex,
}: any) => {
  const offer = stay.roomDetails;
  const isUnavailable =
    offer?.unavailable || !offer || (offer.rooms && offer.rooms.length === 0);
  const hasRooms = offer?.rooms && offer.rooms.length > 0;

  const numNights = getNumNights(
    searchParams?.startDate,
    searchParams?.endDate
  );
  const totalGuests =
    (searchParams?.adults || 1) + (searchParams?.children || 0);

  return (
    <div
      id={`stay-option-${stayIndex}`} 
      className={`border rounded-xl p-4 transition-all duration-200 bg-theme-bg ${
        isSelected
          ? "border-theme-primary ring-1 ring-theme-primary bg-theme-primary/10 shadow-sm"
          : "border-theme-surface shadow-sm hover:border-theme-muted hover:shadow-md"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col flex-1 w-full text-left">
          <h4 className="font-extrabold text-lg text-theme-text leading-tight mb-1">
            {stay.name || stay.hotel?.name || "Hotel"}
          </h4>
          <p className="text-sm text-theme-text/70 font-medium">
            📍 {formatAddress(stay.address)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2.5 shrink-0 w-full sm:w-auto">
          <label
            htmlFor={`stay-select-${stayIndex}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shadow-sm shrink-0 
            ${
              isUnavailable
                ? "opacity-40 cursor-not-allowed bg-theme-surface border-theme-surface/50"
                : "cursor-pointer hover:bg-theme-surface border-theme-surface"
            }`}
          >
            <input
              type="checkbox"
              id={`stay-select-${stayIndex}`} 
              checked={isSelected}
              disabled={isUnavailable}
              onChange={() => {
                if (!isUnavailable) toggleStaySelection(stay, uniqueKey);
              }}
              className="w-4 h-4 accent-theme-primary cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-xs font-bold text-theme-text/80 select-none w-[60px] inline-block text-center">
              {isSelected ? "Selected" : "Select"}
            </span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {!isUnavailable && offer ? (
              <div className="text-right leading-none">
                <p className="text-xl font-black text-theme-primary tracking-tight">
                  ${offer.price?.toFixed(2)}
                  <span className="text-[10px] text-theme-text/70 font-bold tracking-wider ml-1">
                    {offer.currency || "USD"}
                  </span>
                </p>
                <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-1">
                  Total Stay
                </p>
              </div>
            ) : (
              <span className="text-theme-accent text-[10px] font-bold uppercase tracking-widest">
                Sold Out
              </span>
            )}
          </div>
        </div>
      </div>

      {hasRooms && !isUnavailable && (
        <div className="mt-4 pt-4 border-t border-theme-surface/50 flex flex-col gap-3">
          {offer.rooms.map((room: any, i: number) => (
            <div
              key={i}
              id={`stay-room-${stayIndex}-${i}`} 
              className="flex flex-col bg-theme-surface/50 p-3 rounded-xl border border-theme-surface gap-1.5 shadow-sm"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex justify-between items-center">
                  <p className="text-[11px] text-theme-muted font-bold uppercase tracking-widest">
                    {totalGuests} Guests • {numNights} Night
                    {numNights > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-theme-muted font-bold uppercase tracking-widest">
                    ${(room.price / numNights).toFixed(2)} / night
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[11px] text-theme-text/70 font-medium leading-relaxed italic">
                  {room.description || "Standard room amenities included."}
                </p>
                <p className="text-[11px] text-theme-muted font-bold uppercase tracking-wider">
                  {room.category || "Room"} • {room.bed_type || "Standard"} •{" "}
                  {room.beds_count || 1}{" "}
                  {room.beds_count === 1 ? "Bed" : "Beds"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function StaysCard({
  stays,
  searchParams,
}: {
  stays: any[];
  searchParams?: any;
}) {
  const [selectedStayKeys, setSelectedStayKeys] = useState<string[]>([]);

  useEffect(() => {
    const tripState = localStorage.getItem("trip_state");
    if (tripState) {
      try {
        const parsed = JSON.parse(tripState);
        if (parsed.stays)
          setSelectedStayKeys(parsed.stays.map((s: any) => s._selectionKey));
      } catch (e) {
        console.error(e);
      }
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
      tripState.stays = [
        { ...stay, _selectionKey: uniqueKey, offerDetails: stay.roomDetails },
      ];
      setSelectedStayKeys([uniqueKey]);
    }
    localStorage.setItem("trip_state", JSON.stringify(tripState));
  };

  return (
    <div className="bg-theme-bg rounded-xl p-2">
      <div className="flex flex-col gap-3">
        {stays.slice(0, 12).map((stay, idx) => {
          const hId = stay.hotel_id || stay.hotelId || stay.id;
          const uniqueKey = hId || `stay-${idx}`;
          return (
            <StayRow
              key={uniqueKey}
              stay={stay}
              uniqueKey={uniqueKey}
              hotelId={hId}
              isSelected={selectedStayKeys.includes(uniqueKey)}
              toggleStaySelection={toggleStaySelection}
              searchParams={searchParams}
              stayIndex={idx} 
            />
          );
        })}
      </div>
    </div>
  );
}