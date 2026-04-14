"use client";

import React, { useState, useEffect } from "react";

export default function DrivingCard({ drivingData }: { drivingData?: any }) {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [showIntermediates, setShowIntermediates] = useState<boolean>(true);

  useEffect(() => {
    const savedState = sessionStorage.getItem("drive_intermediates_open");
    if (savedState === "true") {
      setShowIntermediates(true);
    }
  }, []);

  useEffect(() => {
    const tripStateStr = localStorage.getItem("trip_state");
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.drive && tripState.drive.selected) {
          setIsSelected(true);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, []);

  const calculateFuel = (km: number) => {
    const miles = km * 0.621371;
    const gallons = miles / 25;
    return {
      gallons: gallons.toFixed(1),
      cost: (gallons * 3.35).toFixed(2),
      miles: miles.toFixed(0),
    };
  };

  const toggleDriveSelection = () => {
    const tripStateStr = localStorage.getItem("trip_state");
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    const newSelected = !isSelected;
    setIsSelected(newSelected);

    tripState.drive = newSelected
      ? { selected: true, data: drivingData }
      : null;
    localStorage.setItem("trip_state", JSON.stringify(tripState));
  };

  const toggleIntermediates = () => {
    const newState = !showIntermediates;
    setShowIntermediates(newState);
    sessionStorage.setItem("drive_intermediates_open", String(newState));
  };

  if (!drivingData || !drivingData.geometry) return null;

  const fuel = calculateFuel(drivingData.distance_km);

  const passedCities = drivingData.passedCities || [];
  const sName = drivingData.sourceName || "Origin";
  const dName = drivingData.destinationName || "Destination";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`bg-theme-bg rounded-xl overflow-hidden border p-5 transition-all duration-200 ${
          isSelected
            ? "border-theme-primary ring-1 ring-theme-primary bg-theme-bg/20"
            : "border-theme-surface bg-theme-bg/10 shadow-sm hover:border-theme-muted hover:shadow-md"
        }`}
      >
        <div className="mb-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-2xl font-black text-theme-text tracking-tight leading-none">
              Road Trip Journey
            </h3>

            <label className="flex items-center gap-2 cursor-pointer bg-theme-bg text-theme-text px-4 py-2 rounded-lg hover:bg-theme-surface border border-theme-surface transition-colors shadow-sm shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={toggleDriveSelection}
                className="w-4 h-4 accent-theme-primary cursor-pointer"
              />
              <span className="text-xs font-bold text-theme-text/80 select-none w-[56px] inline-block text-center">
                {isSelected ? "Selected" : "Select"}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-sm font-bold mt-1">
            <span className="bg-theme-muted/20 text-theme-primary border border-theme-muted px-3 py-1 rounded-lg shadow-sm">
              {sName}
            </span>
            <span className="text-theme-muted text-lg">➔</span>
            <span className="bg-theme-accent/10 text-theme-accent border border-theme-accent/30 px-3 py-1 rounded-lg shadow-sm">
              {dName}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-theme-bg/10 p-4 rounded-xl border border-theme-muted/50 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-theme-muted block mb-1">
              Distance
            </span>
            <span className="text-xl font-black text-theme-text">
              {fuel.miles} Mi
            </span>
            <span className="text-[11px] text-theme-muted font-medium leading-tight mt-0.5">
              {drivingData.distance_km} km
            </span>
          </div>
          <div className="bg-theme-bg/10 p-4 rounded-xl border border-theme-muted/50 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-theme-muted block mb-1">
              Drive Time
            </span>
            <span className="text-xl font-black text-theme-text">
              {Math.floor(drivingData.duration_mins / 60)}h{" "}
              {Math.round(drivingData.duration_mins % 60)}m
            </span>
          </div>
          <div className="bg-theme-muted/10 p-4 rounded-xl border border-theme-muted/50 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black text-theme-primary block mb-1">
              Fuel Estimate
            </span>
            <span className="text-xl font-black text-theme-secondary">
              ${fuel.cost}
            </span>
            <span className="text-[11px] text-theme-secondary/70 font-medium leading-tight mt-0.5">
              {fuel.gallons} Gal
            </span>
          </div>
        </div>

        <div className="border-t border-theme-surface/50 pt-4">
          <button
            onClick={toggleIntermediates}
            className="w-full flex justify-between items-center group mb-2"
          >
            <span className="text-xs font-black text-theme-primary uppercase tracking-widest group-hover:underline">
              {showIntermediates
                ? "▼ Hide Route List"
                : "▶ View All Passing Cities"}
            </span>
          </button>

          {showIntermediates && (
            <div className="mt-4 bg-theme-muted/10 rounded-xl p-6 border border-theme-muted shadow-inner">
              <div className="relative flex flex-col gap-6 ml-2">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-theme-muted"></div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-theme-primary border-[3px] border-theme-bg shadow-sm ring-2 ring-theme-muted shrink-0"></div>
                  <span className="text-base font-black text-theme-text">
                    {sName}
                  </span>
                </div>

                {passedCities.map((city: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative z-10 flex items-center gap-4"
                  >
                    <div className="w-3 h-3 ml-[2px] rounded-full bg-theme-bg border-[3px] border-theme-muted shadow-sm shrink-0"></div>
                    <span className="text-sm font-bold text-theme-text/80">
                      {city}
                    </span>
                  </div>
                ))}

                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-theme-accent border-[3px] border-theme-bg shadow-sm ring-2 ring-theme-accent/30 shrink-0"></div>
                  <span className="text-base font-black text-theme-text">
                    {dName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}