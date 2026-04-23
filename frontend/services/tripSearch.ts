import { travelApi, TripSearchParams } from "@/services/api";

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

export async function fetchTripData(params: TripSearchParams) {
  const isDrive = params.travelMode === "drive";
  const transportPromise = isDrive
    ? travelApi.getDriving(params)
    : travelApi.getFlights(params);

  let [transportResponse, rawStays, weather, attractions, toursData] =
    await Promise.all([
      transportPromise,
      travelApi.getStays(params),
      travelApi.getWeather(params.destination, {
        start: params.startDate,
        end: params.endDate,
      }),
      travelApi.getAttractions(params.destination, params.radius),
      travelApi.getTours(params.destination, params.radius),
    ]);

  let processedStays = rawStays;
  if (rawStays && rawStays.length > 0) {
    const topStays = rawStays.slice(0, 10);
    const offers: any[] = [];

    for (let i = 0; i < topStays.length; i += 3) {
      const chunk = topStays.slice(i, i + 3);
      const chunkOffers = await Promise.all(
        chunk.map((stay: any) => {
          const hId = stay.hotel_id || stay.hotelId || stay.id;
          return travelApi
            .getHotelOffer(hId, params)
            .catch(() => ({ unavailable: true }));
        })
      );
      offers.push(...chunkOffers);
      if (i + 3 < topStays.length)
        await new Promise((r) => setTimeout(r, 200));
    }

    processedStays = rawStays.map((stay: any, index: number) => {
      if (index < 10) {
        const offer = offers[index];
        return {
          ...stay,
          roomDetails:
            !offer || offer.error ? { unavailable: true } : offer,
        };
      }
      return stay;
    });
  }

  let finalFlightData = null;
  let finalDriveData = null;

  if (isDrive) {
    finalDriveData = transportResponse;
  } else {
    if (transportResponse && transportResponse.length > 0) {
      finalFlightData = transportResponse;
    } else {
      finalDriveData = await travelApi.getDriving(params);
    }
  }

  if (finalDriveData?.geometry?.coordinates) {
    const coords = finalDriveData.geometry.coordinates;
    const citiesFound: string[] = [];
    const step = Math.max(1, Math.floor(coords.length / 40));
    const startCoord = coords[0];
    const endCoord = coords[coords.length - 1];

    const sNameLower = (params.source?.name || "")
      .toLowerCase()
      .split(",")[0]
      .trim();
    const dNameLower = (params.destination?.name || "")
      .toLowerCase()
      .split(",")[0]
      .trim();

    const cityPromises = [];
    for (let i = step; i < coords.length - step; i += step) {
      const [lon, lat] = coords[i];
      const distToStart = Math.sqrt(
        Math.pow(lon - startCoord[0], 2) + Math.pow(lat - startCoord[1], 2)
      );
      const distToEnd = Math.sqrt(
        Math.pow(lon - endCoord[0], 2) + Math.pow(lat - endCoord[1], 2)
      );

      if (distToStart > 0.08 && distToEnd > 0.08) {
        cityPromises.push(
          travelApi.getNearestCity(lat, lon).catch(() => null)
        );
      }
    }

    const nearestCities = await Promise.all(cityPromises);

    nearestCities.forEach((data) => {
      if (data && data.city) {
        const cityName = data.city;
        const stateName = data.state;
        const stateDisplay = stateName
          ? STATE_ABBR[stateName] || stateName
          : "";
        const fullLabel = stateDisplay
          ? `${cityName}, ${stateDisplay}`
          : cityName;
        const cityLower = (cityName || "").toLowerCase().trim();

        const isSourceOrDest =
          sNameLower === cityLower || dNameLower === cityLower;

        if (
          cityName !== "Unknown" &&
          !citiesFound.includes(fullLabel) &&
          !isSourceOrDest
        ) {
          citiesFound.push(fullLabel);
        }
      }
    });

    finalDriveData.passedCities = citiesFound;
    finalDriveData.sourceName = params.source?.name || "Origin";
    finalDriveData.destinationName =
      params.destination?.name || "Destination";
  }

  if (toursData && toursData.length > 0 && typeof window !== "undefined") {
    toursData.slice(0, 15).forEach((tour: any) => {
      const imageUrl = tour.pictures?.[0] || tour.image;
      if (imageUrl) {
        const img = new window.Image();
        img.src = imageUrl;
      }
    });
  }

  return {
    rawParams: params,
    flightData: finalFlightData,
    drivingData: finalDriveData,
    stays: processedStays && processedStays.length > 0 ? processedStays : null,
    weather: weather && Object.keys(weather).length > 0 ? weather : null,
    attractions: attractions && attractions.length > 0 ? attractions : null,
    toursData: toursData && toursData.length > 0 ? toursData : null,
  };
}