"use client";

import { useEffect } from "react";

export default function ClientInit() {
  useEffect(() => {
    const detectPlatform = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
      }
      if (
        /Mobile|iP(hone|od)|Android|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
          ua
        )
      ) {
        return "mobile";
      }
      return "pc";
    };

    const platform = detectPlatform();
    localStorage.setItem("app_platform", platform);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsData = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          localStorage.setItem("user_gps", JSON.stringify(gpsData));
        },
        (error) => {
          console.warn("Could not get GPS location:", error.message);
          localStorage.setItem("user_gps_error", error.message);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    }
  }, []);

  return null;
}
