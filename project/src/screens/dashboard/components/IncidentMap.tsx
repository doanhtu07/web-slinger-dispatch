import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { useAuth0 } from "@auth0/auth0-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  IncidentStatus,
  IncidentStatusValue,
  IncidentType,
  IncidentTypeValue,
} from "../../../../convex/incidents";

const incidentIcons: Record<IncidentTypeValue, ReturnType<typeof divIcon>> = {
  // Use a simple symbol-only marker (no surrounding pin) centered on the coordinate.

  [IncidentType.CRIME]: divIcon({
    html: `<div class="incident-symbol">🚨</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),

  [IncidentType.FIRE]: divIcon({
    html: `<div class="incident-symbol">🔥</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),

  [IncidentType.ACCIDENT]: divIcon({
    html: `<div class="incident-symbol">💥</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),

  [IncidentType.MEDICAL]: divIcon({
    html: `<div class="incident-symbol">🏥</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),

  [IncidentType.OTHER]: divIcon({
    html: `<div class="incident-symbol">⚠️</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
};

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    try {
      // Preserve zoom when zoom not provided
      const z = typeof zoom === "number" ? zoom : map.getZoom();
      map.setView(center, z);
    } catch {
      // ignore
    }
  }, [map, center, zoom]);

  return null;
}

interface IncidentMapProps {
  onMapClick: (lat: number, lng: number) => void;
}

export function IncidentMap({ onMapClick }: Readonly<IncidentMapProps>) {
  const incidents = useQuery(api.incidents.getIncidents);

  const { t } = useTranslation();
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.006]);
  const { user } = useAuth0();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const getIncidentColorStyle = useCallback((incidentType: IncidentTypeValue) => {
    switch (incidentType) {
      case IncidentType.CRIME:
        return "bg-red-900 text-red-100";
      case IncidentType.FIRE:
        return "bg-orange-900 text-orange-100";
      case IncidentType.ACCIDENT:
        return "bg-yellow-900 text-yellow-100";
      case IncidentType.MEDICAL:
        return "bg-pink-900 text-pink-100";
      default:
        return "bg-gray-700 text-gray-100";
    }
  }, []);

  const getIncidentStatusStyle = useCallback((incidentStatus: IncidentStatusValue | undefined) => {
    switch (incidentStatus) {
      case IncidentStatus.ACTIVE:
        return "bg-red-500 text-white";
      case IncidentStatus.RESPONDING:
        return "bg-yellow-500 text-black";
      case IncidentStatus.RESOLVED:
        return "bg-green-500 text-white";
    }
  }, []);

  useEffect(() => {
    // Keep default center until user logs in
    setCenter([40.7128, -74.006]);
  }, []);

  // When user logs in, center the map around their current geolocation (if allowed)
  useEffect(() => {
    if (!user) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(coords);
        setUserLocation(coords);
      },
      (err) => {
        console.warn("Geolocation not available or denied:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 30 * 1000, // Increase timeout to 30 seconds
      },
    );
  }, [user]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      minZoom={1}
      maxZoom={22}
      scrollWheelZoom={true}
      className="h-full w-full"
      zoomControl={true}
    >
      <MapUpdater center={center} />

      {userLocation && (
        <Marker
          position={userLocation}
          icon={divIcon({
            className: "sv-user-pin",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          })}
        />
      )}

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapClickHandler onMapClick={onMapClick} />

      {incidents?.map((incident) => (
        <Marker
          key={incident._id}
          position={[incident.latitude, incident.longitude]}
          icon={incidentIcons[incident.incident_type] || incidentIcons.OTHER}
        >
          <Popup className="custom-popup">
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getIncidentColorStyle(
                    incident.incident_type,
                  )}`}
                >
                  {t(incident.incident_type)}
                </span>

                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getIncidentStatusStyle(
                    incident.status,
                  )}`}
                >
                  {incident.status.toUpperCase()}
                </span>
              </div>

              <p className="text-sm font-semibold mb-1 text-gray-900">{incident.description}</p>

              {incident.location_name && (
                <p className="text-xs text-gray-600 mb-1">{incident.location_name}</p>
              )}

              {incident.reporter_name && (
                <p className="text-xs text-gray-600 mb-1">
                  {t("reportedBy")}: {incident.reporter_name}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {new Date(incident.created_at).toLocaleString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
