import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

export interface LocationResult {
  city?: string;
  name?: string;
  state?: string;
  iata?: string;
  type: 'city' | 'airport';
  distance?: number;
  lat?: number;
  lon?: number;
}

export const travelApi = {
  searchLocations: async (keyword: string, lat?: number, lon?: number): Promise<LocationResult[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/search`, {
        params: { keyword, lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  },
  getNearestCity: async (lat: number, lon: number): Promise<LocationResult | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/nearest`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  },
  getDestinationData: async (params: any) => ({ lat: params?.destination?.lat, lon: params?.destination?.lon }),
  getFlights: async (params: any) => [],
  getStays: async (params: any) => [],
  getWeather: async (dest: any, dates: any) => [],
  getAttractions: async (dest: any, radius: any) => [],
  exportPdf: async (data: any) => new Blob()
};

/**
 * Fetches POIs from OpenStreetMap Overpass API
 * Uses explicit nwr["key"="value"](around:radius,lat,lon) syntax.
 */
export const fetchOsmInterests = async (tags: string[], lat: number, lon: number, radiusMiles: number) => {
  if (!tags || tags.length === 0) return [];

  // Convert miles to meters for Overpass around filter
  const radiusMeters = Math.round(radiusMiles * 1609.34);

  // Construct individual query lines
  const combinedQueries = tags.map(tag => {
    const [key, val] = tag.split('=');
    return `nwr["${key}"="${val}"](around:${radiusMeters},${lat},${lon});`;
  }).join('\n  ');

  // Final Overpass QL query
  const overpassQuery = `[out:json][timeout:25];
(
  ${combinedQueries}
);
out center;`;

  try {
    const overpassUrl = process.env.NEXT_PUBLIC_OVERPASS_URL || "https://overpass-api.de/api/interpreter";
    const response = await fetch(overpassUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    
    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error("Failed to fetch OSM data:", error);
    return [];
  }
};