"use client";

import { useState, useEffect } from "react";

export function usePlatform() {
  const [platform, setPlatform] = useState<"pc" | "tablet" | "mobile" | null>(null);

  useEffect(() => {
    // Safely access localStorage once the component has mounted on the client
    const storedPlatform = localStorage.getItem("app_platform") as "pc" | "tablet" | "mobile";
    
    if (storedPlatform) {
      setPlatform(storedPlatform);
    } else {
      // Fallback just in case it hasn't been set yet
      setPlatform("pc"); 
    }
  }, []);

  return {
    platform,
    isMobile: platform === "mobile",
    isTablet: platform === "tablet",
    isDesktop: platform === "pc",
    // isReady is true once we've successfully read from localStorage
    isReady: platform !== null, 
  };
}