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
      className={`border rounded-xl p-5 transition-all duration-200 bg-theme-bg ${
        isSelected
          ? "border-theme-primary ring-2 ring-theme-primary bg-theme-primary/5 shadow-md"
          : "border-theme-surface shadow-sm hover:border-theme-muted hover:shadow-lg"
      }`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex flex-col flex-1 w-full text-left">
          <h4 className="font-extrabold text-xl text-theme-text leading-tight mb-2">
            {stay.name || stay.hotel?.name || "Hotel"}
          </h4>
          <p className="text-xs text-theme-muted font-bold uppercase tracking-wider">
            📍 {formatAddress(stay.address)}
          </p>
        </div>

        <div className="flex items-center gap-5 shrink-0 w-full md:w-auto justify-between md:justify-end">
            {!isUnavailable && offer ? (
              <div className="text-right leading-none">
                <p className="text-2xl font-black text-theme-primary tracking-tight">
                  ${offer.price?.toFixed(2)}
                  <span className="text-xs text-theme-muted font-bold tracking-wider ml-1">
                    {offer.currency || "USD"}
                  </span>
                </p>
                <p className="text-[10px] text-theme-text/50 font-bold uppercase tracking-widest mt-1.5">
                  Total Stay
                </p>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-theme-accent bg-theme-accent/10 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                  Sold Out
                </span>
              </div>
            )}

            <button
              disabled={isUnavailable}
              onClick={() => {
                if (!isUnavailable) toggleStaySelection(stay, uniqueKey);
              }}
              className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm shrink-0 active:scale-95 ${
                isUnavailable
                  ? "opacity-40 cursor-not-allowed bg-theme-surface text-theme-text/50"
                  : isSelected
                  ? "bg-theme-primary text-theme-bg"
                  : "bg-theme-secondary text-theme-bg hover:bg-theme-secondary/90"
              }`}
            >
              {isUnavailable ? "Sold Out" : isSelected ? "Selected" : "Select"}
            </button>
        </div>
      </div>

      {hasRooms && !isUnavailable && (
        <div className="mt-5 pt-4 border-t border-theme-surface flex flex-col gap-3">
          {offer.rooms.map((room: any, i: number) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row justify-between bg-theme-surface/30 p-4 rounded-xl border border-theme-surface gap-3 shadow-sm"
            >
              <div className="flex flex-col gap-1.5 flex-1">
                <p className="text-sm font-bold text-theme-text leading-relaxed">
                  {room.category || "Standard Room"} • {room.bed_type || "Standard Bed"}
                </p>
                <p className="text-[11px] text-theme-muted font-bold uppercase tracking-wider">
                  {totalGuests} Guests • {room.beds_count || 1} {room.beds_count === 1 ? "Bed" : "Beds"}
                </p>
                {room.description && (
                  <p className="text-[11px] text-theme-text/70 italic mt-1 max-w-xl line-clamp-2">
                    {room.description}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right shrink-0 flex flex-col justify-center">
                  <p className="text-lg font-black text-theme-secondary tracking-tight">
                    ${(room.price / numNights).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest mt-0.5">
                     / night
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
      <div className="flex flex-col gap-4">
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
            />
          );
        })}
      </div>
    </div>
  );
}