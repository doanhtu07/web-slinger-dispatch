/**
 * Geocoding service to convert location names to coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  confidence: number; // 0-1
}

/**
 * Geocode a location name to coordinates using OpenStreetMap Nominatim
 */
export async function geocodeLocation(
  locationName: string,
  userLocation?: { lat: number; lng: number }
): Promise<GeocodingResult | null> {
  try {
    // Build the query
    const baseUrl = "https://nominatim.openstreetmap.org/search";
    const params = new URLSearchParams({
      q: locationName,
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    // If user location is provided, bias results towards that area
    if (userLocation) {
      params.append("lat", userLocation.lat.toString());
      params.append("lon", userLocation.lng.toString());
      params.append("bounded", "1");
      params.append("viewbox", getViewBox(userLocation, 31)); // 31-mile radius (≈50km)
    }

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "WebSlingerDispatch/1.0", // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    
    // Calculate confidence based on importance score from Nominatim
    const confidence = parseFloat(result.importance) || 0.5;

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      confidence: Math.min(confidence, 1.0),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Get a viewbox for biasing search results (lat, lon, radius in miles)
 */
function getViewBox(
  center: { lat: number; lng: number },
  radiusMiles: number
): string {
  // Approximate degrees per mile (rough calculation)
  const latDelta = radiusMiles / 69; // 1 degree lat ≈ 69 miles
  const lngDelta = radiusMiles / (69 * Math.cos((center.lat * Math.PI) / 180));

  const left = center.lng - lngDelta;
  const top = center.lat + latDelta;
  const right = center.lng + lngDelta;
  const bottom = center.lat - latDelta;

  return `${left},${top},${right},${bottom}`;
}

/**
 * Reverse geocode coordinates to an address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "WebSlingerDispatch/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.display_name) {
      return null;
    }

    return data.display_name;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Smart location resolver that combines user GPS with location name
 * Returns best coordinates based on confidence
 */
export async function resolveLocation(
  locationName: string,
  userLocation?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number; location_name: string } | null> {
  // If location name is "current location" or similar, use user's GPS
  const currentLocationKeywords = [
    "current location",
    "here",
    "my location",
    "this location",
  ];

  if (
    currentLocationKeywords.some((keyword) =>
      locationName.toLowerCase().includes(keyword)
    )
  ) {
    if (!userLocation) {
      return null;
    }

    // Try to get a proper address name
    const addressName = await reverseGeocode(userLocation.lat, userLocation.lng);

    return {
      lat: userLocation.lat,
      lng: userLocation.lng,
      location_name: addressName || "Current Location",
    };
  }

  // Try to geocode the location name
  const geocoded = await geocodeLocation(locationName, userLocation);

  if (geocoded && geocoded.confidence > 0.5) {
    return {
      lat: geocoded.lat,
      lng: geocoded.lng,
      location_name: geocoded.display_name,
    };
  }

  // Fallback to user location if geocoding fails or has low confidence
  if (userLocation) {
    const addressName = await reverseGeocode(userLocation.lat, userLocation.lng);
    
    return {
      lat: userLocation.lat,
      lng: userLocation.lng,
      location_name: addressName || locationName,
    };
  }

  return null;
}
