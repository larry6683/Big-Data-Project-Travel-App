// frontend/app/savedtrips/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { travelApi } from "../../services/api";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import {
  X,
  Plane,
  Hotel,
  MapPin,
  Calendar,
  Map,
  Ticket,
  Car,
  DollarSign,
} from "lucide-react";

interface SavedTrip {
  id: number;
  destination: string;
  data: {
    check_in_date?: string;
    check_out_date?: string;
    startDate?: string;
    endDate?: string;
    rawParams?: any;
    flight?: any;
    drive?: any; // Added drive support
    hotel?: any;
    weather?: any;
    activities?: any[];
    attractions?: any[];
  };
}

export default function SavedTripsPage() {
  const { isLoggedIn } = useAuth();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!isLoggedIn) return;
      try {
        const data = await travelApi.getMyTrips();
        setSavedTrips(data);
      } catch (error) {
        console.error("Failed to load trips:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [isLoggedIn]);

  const handleDelete = async (tripId: number) => {
    if (!window.confirm("Are you sure you want to delete this itinerary?"))
      return;
    try {
      await travelApi.deleteTrip(tripId);
      setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (error) {
      alert("Failed to delete trip.");
    }
  };

  // --- HELPER FUNCTIONS (MATCHING ITINERARY MODAL) ---
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const localDate = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    return localDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const safeFloat = (val: any) => {
    if (!val) return 0;
    if (typeof val === "string")
      return parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
    return parseFloat(val) || 0;
  };

  const getLayoverTime = (arrivalStr: string, departureStr: string) => {
    if (!arrivalStr || !departureStr) return null;
    const arr = new Date(arrivalStr).getTime();
    const dep = new Date(departureStr).getTime();
    const diffMs = dep - arr;
    if (diffMs <= 0) return null;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
  };

  const getTripTitle = (trip: SavedTrip) => {
    const source =
      trip.data.rawParams?.source?.name?.split(",")[0] ||
      trip.data.rawParams?.source?.city;
    return source ? `${source} to ${trip.destination}` : trip.destination;
  };

  const calculateTotal = (trip: SavedTrip) => {
    let total = 0;
    if (trip.data.flight) total += safeFloat(trip.data.flight.price);
    else if (trip.data.drive) total += safeFloat(trip.data.drive.fuelEstimate);
    if (trip.data.hotel) total += safeFloat(trip.data.hotel.price);
    return total;
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-bg">
        <h1 className="text-2xl font-bold text-theme-text mb-4">
          Please login to view your saved trips
        </h1>
        <Link
          href="/auth"
          className="bg-theme-primary text-theme-bg px-6 py-2 rounded-lg hover:bg-theme-secondary transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg relative">
      <Navbar />

      <main className="max-w-6xl mx-auto p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-theme-text tracking-tight">
              My Saved Itineraries
            </h1>
            <p className="text-theme-text/70 font-medium mt-1">
              You have {savedTrips.length} stored trips.
            </p>
          </div>
          <Link
            href="/"
            className="bg-theme-surface text-theme-primary px-4 py-2 rounded-lg font-bold hover:bg-theme-muted/20 transition-colors"
          >
            + Plan New Trip
          </Link>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
          </div>
        ) : savedTrips.length === 0 ? (
          <div className="bg-theme-surface p-12 rounded-2xl shadow-sm text-center border border-theme-muted/30">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-theme-text mb-2">
              No trips planned yet
            </h3>
            <Link
              href="/"
              className="bg-theme-primary text-theme-bg px-6 py-3 rounded-xl font-bold hover:bg-theme-secondary transition-colors"
            >
              Create Your First Itinerary
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-theme-surface rounded-2xl shadow-sm border border-theme-muted/30 overflow-hidden hover:shadow-md transition flex flex-col"
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h2
                      className="text-xl font-black text-theme-text line-clamp-1"
                      title={getTripTitle(trip)}
                    >
                      {getTripTitle(trip)}
                    </h2>
                    <span className="bg-theme-primary/10 text-theme-primary text-xs font-black px-2 py-1 rounded-md whitespace-nowrap border border-theme-primary/20">
                      {formatDate(
                        trip.data.check_in_date ||
                          trip.data.rawParams?.startDate ||
                          trip.data.startDate ||
                          ""
                      )}
                    </span>
                  </div>
                  <div className="space-y-3 text-sm text-theme-text/80 mb-6 font-medium">
                    <div className="flex items-center gap-2">
                      {trip.data.flight ? (
                        <Plane size={16} className="text-theme-muted" />
                      ) : (
                        <Car size={16} className="text-theme-muted" />
                      )}
                      <span className="truncate">
                        {trip.data.flight?.airline_name ||
                          (trip.data.drive
                            ? "Road Trip Journey"
                            : "No transport selected")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hotel size={16} className="text-theme-muted" />
                      <span className="truncate">
                        {trip.data.hotel?.name || "No hotel selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map size={16} className="text-theme-muted" />
                      <span>
                        {trip.data.attractions?.length || 0} Attractions saved
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-theme-bg border-t border-theme-muted/30 flex gap-2">
                  <button
                    onClick={() => setSelectedTrip(trip)}
                    className="flex-1 text-center bg-theme-surface border border-theme-muted/50 text-theme-text py-2 rounded-xl text-sm font-bold hover:bg-theme-muted/20 active:scale-95 transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="bg-theme-surface border border-red-200 text-red-500 p-2 rounded-xl hover:bg-red-50 active:scale-95 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ITINERARY DETAILS MODAL */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-theme-text/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedTrip(null)}
          />
          <div className="relative bg-theme-bg w-full max-w-2xl max-h-[85vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-theme-surface flex justify-between items-center bg-theme-surface/50">
              <div>
                <h2 className="text-xl font-black text-theme-text line-clamp-1">
                  {getTripTitle(selectedTrip)}
                </h2>
                <p className="text-xs font-bold text-theme-text/60 uppercase tracking-widest mt-1">
                  <Calendar size={12} className="inline mr-1 mb-0.5" />
                  {formatDate(
                    selectedTrip.data.check_in_date ||
                      selectedTrip.data.rawParams?.startDate ||
                      selectedTrip.data.startDate ||
                      ""
                  )}{" "}
                  —{" "}
                  {formatDate(
                    selectedTrip.data.check_out_date ||
                      selectedTrip.data.rawParams?.endDate ||
                      selectedTrip.data.endDate ||
                      ""
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-2 hover:bg-theme-surface rounded-full transition bg-theme-bg text-theme-text/70"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-theme-bg">
              {/* Total Estimated Cost */}
              <div className="bg-theme-secondary/10 border border-theme-secondary/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-theme-secondary">
                  <DollarSign size={20} />
                  <span className="font-black uppercase tracking-widest text-xs">
                    Total Estimated Cost
                  </span>
                </div>
                <span className="font-black text-xl text-theme-secondary">
                  ${calculateTotal(selectedTrip).toFixed(2)}
                </span>
              </div>

              {/* Transportation Info */}
              {(selectedTrip.data.flight || selectedTrip.data.drive) && (
                <div>
                  <h3 className="text-sm font-black text-theme-text/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                    {selectedTrip.data.flight ? (
                      <Plane size={16} className="text-theme-primary" />
                    ) : (
                      <Car size={16} className="text-theme-primary" />
                    )}
                    Transportation
                  </h3>
                  {selectedTrip.data.flight ? (
                    <div className="bg-theme-primary/10 border border-theme-primary/20 rounded-xl p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-theme-text">
                          {selectedTrip.data.flight.airline_name}
                        </p>
                        <span className="font-black text-theme-primary">
                          $
                          {safeFloat(selectedTrip.data.flight.price).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-4">
                        {(selectedTrip.data.flight.itineraries || []).map(
                          (itin: any, idx: number) => {
                            const stops = itin.segments?.length
                              ? itin.segments.length - 1
                              : 0;
                            return (
                              <div
                                key={idx}
                                className="bg-theme-bg p-3 rounded-lg border border-theme-surface/60"
                              >
                                <div className="flex justify-between items-center mb-2 pb-1 border-b border-theme-surface/40">
                                  <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider">
                                    {idx === 0 ? "Outbound" : "Return"} •{" "}
                                    {formatShortDate(
                                      itin.segments?.[0]?.departure_time
                                    )}
                                  </span>
                                  <span
                                    className={`text-[10px] uppercase font-bold tracking-wider ${
                                      stops === 0
                                        ? "text-green-500"
                                        : "text-amber-500"
                                    }`}
                                  >
                                    {stops === 0
                                      ? "Direct"
                                      : `${stops} Stop(s)`}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {(itin.segments || []).map(
                                    (seg: any, sIdx: number) => {
                                      const layover =
                                        sIdx > 0
                                          ? getLayoverTime(
                                              itin.segments[sIdx - 1]
                                                .arrival_time,
                                              seg.departure_time
                                            )
                                          : null;
                                      return (
                                        <React.Fragment key={sIdx}>
                                          {layover && (
                                            <div className="flex justify-center my-1">
                                              <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                Layover: {layover}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-3 text-sm text-theme-text/80">
                                            <div className="flex-1">
                                              <p className="font-black text-theme-text">
                                                {seg.departure_airport}
                                              </p>
                                              <p className="text-[10px] font-bold text-theme-muted">
                                                {formatTime(seg.departure_time)}
                                              </p>
                                            </div>
                                            <span className="text-xs">✈️</span>
                                            <div className="flex-1 text-right">
                                              <p className="font-black text-theme-text">
                                                {seg.arrival_airport}
                                              </p>
                                              <p className="text-[10px] font-bold text-theme-muted">
                                                {formatTime(seg.arrival_time)}
                                              </p>
                                            </div>
                                          </div>
                                        </React.Fragment>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-theme-primary/10 border border-theme-primary/20 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-theme-text">
                          Road Trip Journey
                        </p>
                        <span className="font-black text-theme-primary">
                          $
                          {safeFloat(
                            selectedTrip.data.drive?.fuelEstimate
                          ).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-theme-text/70 font-medium">
                        Duration: {selectedTrip.data.drive?.duration} |
                        Distance: {selectedTrip.data.drive?.distance}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Hotel Info */}
              {selectedTrip.data.hotel && (
                <div>
                  <h3 className="text-sm font-black text-theme-text/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Hotel size={16} className="text-theme-primary" />{" "}
                    Accommodation
                  </h3>
                  <div className="bg-theme-primary/10 border border-theme-primary/20 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-theme-text">
                          {selectedTrip.data.hotel.name}
                        </p>
                        <p className="text-xs text-theme-text/60 mt-1 flex items-center gap-1">
                          <MapPin size={12} />{" "}
                          {selectedTrip.data.hotel.address?.lines?.join(", ") ||
                            "Address unavailable"}
                        </p>
                      </div>
                      <span className="font-black text-theme-primary">
                        ${safeFloat(selectedTrip.data.hotel.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attractions Info */}
              {selectedTrip.data.attractions &&
                selectedTrip.data.attractions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-theme-text/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Map size={16} className="text-theme-secondary" /> Planned
                      Attractions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTrip.data.attractions.map((attr, idx) => (
                        <div
                          key={idx}
                          className="bg-theme-surface border border-theme-muted/30 p-3 rounded-lg text-sm font-medium text-theme-text/80 flex items-start gap-2"
                        >
                          <span className="text-theme-secondary mt-0.5">•</span>{" "}
                          {attr.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Tours & Activities Info */}
              {selectedTrip.data.activities &&
                selectedTrip.data.activities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-theme-text/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Ticket size={16} className="text-theme-secondary" />{" "}
                      Tours & Activities
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedTrip.data.activities.map(
                        (tour: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-theme-surface border border-theme-muted/30 p-3 rounded-lg text-sm font-medium text-theme-text/80 flex items-start gap-2"
                          >
                            <span className="text-theme-secondary mt-0.5">
                              •
                            </span>{" "}
                            {tour.name || tour.title}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-theme-surface bg-theme-surface/30">
              <button
                onClick={() => setSelectedTrip(null)}
                className="w-full bg-theme-text text-theme-bg font-bold py-3 rounded-xl hover:bg-theme-text/80 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
