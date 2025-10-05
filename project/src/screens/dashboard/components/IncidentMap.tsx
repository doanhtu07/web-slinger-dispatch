import { useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { useTranslation } from "react-i18next";
import "leaflet/dist/leaflet.css";
import { useConvexAuth, useQuery } from "convex/react";
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

  incidentMapLocation: { lat: number; lng: number };
  setIncidentMapLocation: (location: { lat: number; lng: number }) => void;
}

export function IncidentMap({
  onMapClick,
  incidentMapLocation,
  setIncidentMapLocation,
}: Readonly<IncidentMapProps>) {
  const incidents = useQuery(api.incidents.getIncidents);
  const { isAuthenticated } = useConvexAuth();

  const { t } = useTranslation();

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

  // Keep default center until user logs in
  useEffect(() => {
    setIncidentMapLocation({ lat: 40.7128, lng: -74.006 });
  }, [setIncidentMapLocation]);

  // When user logs in, center the map around their current geolocation (if allowed)
  useEffect(() => {
    if (!isAuthenticated) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIncidentMapLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        console.warn("Geolocation not available or denied:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 30 * 1000, // Increase timeout to 30 seconds
      },
    );
  }, [isAuthenticated, setIncidentMapLocation]);

  return (
    <MapContainer
      center={[incidentMapLocation.lat, incidentMapLocation.lng]}
      zoom={13}
      minZoom={2}
      maxZoom={18}
      scrollWheelZoom={true}
      className="h-full w-full"
      zoomControl={true}
    >
      <MapUpdater center={[incidentMapLocation.lat, incidentMapLocation.lng]} />

      {incidentMapLocation && (
        <Marker
          position={incidentMapLocation}
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

              <p className="text-sm font-semibold mb-1 text-white">{incident.description}</p>

              {incident.location_name && (
                <p className="text-xs text-gray-400 mb-1">{incident.location_name}</p>
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
