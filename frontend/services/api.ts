// frontend/services/api.ts

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

if (!API_BASE_URL) {
  console.error("🚨 NEXT_PUBLIC_API_URL is missing! Please check your frontend/.env.local file.");
}

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

export interface TripSearchParams {
  source: any;
  destination: any;
  startDate: string;
  endDate: string;
  numNights: number;
  adults: number;
  children: number;
  travelMode: 'fly' | 'drive';
  budget: 'budget' | 'luxury';
  radius: number;
  interests: string[];
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

  saveTrip: async (tripData: any) => {
    const response = await axios.post(`${API_BASE_URL}/trips/save`, tripData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getMyTrips: async () => {
    const response = await axios.get(`${API_BASE_URL}/trips/me`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
sharePdf: async (data: any, email: string, signal?: AbortSignal) => {
  try {
    const payload = { ...data, email };
    const response = await axios.post(`${API_BASE_URL}/trips/share-pdf`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      signal
    });
    return response.data;
  } catch (error) {
    console.error("Failed to share PDF:", error);
    throw error;
  }
},
signup: async (name: string, email: string, password: string) => {
  const { data } = await axios.post(`${API_BASE_URL}/auth/signup`, {
    full_name: name,
    email: email,
    password: password
  });
  return data;
},

login: async (email: string, password: string) => {
  const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: email,
    password: password
  });
  return data;
},
forgotPassword: async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
  return response.data;
},

resetPassword: async (email: string, code: string, newPassword: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, { 
    email: email,
    code: code,
    new_password: newPassword
  });
  return response.data;
},
  // --- NEW PROFILE METHODS ---
  getProfile: async () => {
    const response = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    // Note: We pass the raw FormData object here so axios correctly sets multipart/form-data headers
    const response = await axios.put(`${API_BASE_URL}/users/me`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getDestinationData: async (params: any) => ({ lat: params?.destination?.lat, lon: params?.destination?.lon }),

  getFlights: async (params: TripSearchParams, signal?: AbortSignal) => {
    try {
      let originIata = params.source.iata;
      let destIata = params.destination.iata;

      if (!originIata && params.source.lat && params.source.lon) {
         const { data } = await axios.get(`${API_BASE_URL}/locations/airport/nearest`, { 
           params: { lat: params.source.lat, lon: params.source.lon },
           signal 
         });
         originIata = data.iata;
      }
      
      if (!destIata && params.destination.lat && params.destination.lon) {
         const { data } = await axios.get(`${API_BASE_URL}/locations/airport/nearest`, { 
           params: { lat: params.destination.lat, lon: params.destination.lon },
           signal 
         });
         destIata = data.iata;
      }

      const travelClasses = params.budget === 'luxury' 
        ? 'BUSINESS,FIRST' 
        : 'ECONOMY,PREMIUM_ECONOMY';

      const response = await axios.get(`${API_BASE_URL}/flights/search`, {
        params: {
          origin: originIata || 'JFK',
          destination: destIata || 'LAX',
          date: params.startDate,
          return_date: params.endDate,
          adults: params.adults,
          children: params.children,
          travel_class: travelClasses
        },
        signal
      });
      
      const responseData = response.data;
      return Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
    } catch (error) {
      if (axios.isCancel(error)) return [];
      console.error("Failed to fetch flights:", error);
      return [];
    }
  },

  getDriving: async (params: TripSearchParams, signal?: AbortSignal) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/driving/route`, {
        params: {
          origin_lat: params.source.lat,
          origin_lon: params.source.lon,
          dest_lat: params.destination.lat,
          dest_lon: params.destination.lon
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return null;
      console.error("Failed to fetch driving route:", error);
      return null;
    }
  },

  deleteTrip: async (tripId: number) => {
    const response = await axios.delete(`${API_BASE_URL}/trips/${tripId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getStays: async (params: TripSearchParams, signal?: AbortSignal) => {
    try {
      const radiusKm = Math.round(params.radius * 1.60934); 
      const response = await axios.get(`${API_BASE_URL}/hotels/nearby`, {
        params: {
          lat: params.destination.lat,
          lon: params.destination.lon,
          check_in_date: params.startDate,
          check_out_date: params.endDate,
          adults: params.adults,
          radius: radiusKm || 50
        },
        signal
      });
      
      const responseData = response.data;
      return Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
    } catch (error) {
      if (axios.isCancel(error)) return [];
      console.error("Failed to fetch stays:", error);
      return [];
    }
  },

  getHotelOffer: async (hotelId: string, params: any, signal?: AbortSignal) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hotels/offer`, {
        params: {
          hotel_id: hotelId,
          check_in_date: params.startDate,
          check_out_date: params.endDate,
          adults: params.adults
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return null;
      return { error: true }; 
    }
  },

  getWeather: async (dest: any, dates: any, signal?: AbortSignal) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/weather/forecast`, {
        params: {
          lat: dest.lat,
          lon: dest.lon,
          check_in_date: dates.start,
          check_out_date: dates.end
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return null;
      console.error("Failed to fetch weather:", error);
      return null;
    }
  },

  getAttractions: async (dest: any, radiusMiles: number, signal?: AbortSignal, retries = 2): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attractions/nearby`, {
        params: {
          lat: dest.lat,
          lon: dest.lon,
          radius_miles: radiusMiles
        },
        signal,
        validateStatus: (status) => status < 500 
      });

      if (response.status >= 400) {
        throw new Error("Overpass API is busy");
      }

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return [];
      if (retries > 0) {
        console.warn(`Attractions API busy, letting it cool down... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return await travelApi.getAttractions(dest, radiusMiles, signal, retries - 1);
      }
      console.warn("Skipping attractions due to Overpass API limits.");
      return []; 
    }
  },

  getTours: async (dest: any, radiusMiles: number, signal?: AbortSignal) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/activities/nearby`, {
        params: {
          lat: dest.lat,
          lon: dest.lon,
          radius_miles: radiusMiles
        },
        signal
      });
      
      const responseData = response.data;
      return Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
    } catch (error) {
      if (axios.isCancel(error)) return [];
      return [];
    }
  },

  exportPdf: async (data: any, signal?: AbortSignal) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/trips/generate-pdf`, data, {
        responseType: 'blob', 
        headers: {
          'Content-Type': 'application/json'
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("PDF generation cancelled by user");
      } else {
        console.error("Failed to generate PDF:", error);
      }
      return null;
    }
  }
};