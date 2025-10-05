import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { supabase, Incident, Profile } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { OfficerControls } from "./OfficerControls";
import { useTranslation } from 'react-i18next';
import "leaflet/dist/leaflet.css";

const incidentIcons: Record<string, ReturnType<typeof divIcon>> = {
  // Use a simple symbol-only marker (no surrounding pin) centered on the coordinate.
  crime: divIcon({
    html: `<div class="incident-symbol">🚨</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  fire: divIcon({
    html: `<div class="incident-symbol">🔥</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  accident: divIcon({
    html: `<div class="incident-symbol">💥</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  medical: divIcon({
    html: `<div class="incident-symbol">🏥</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
  other: divIcon({
    html: `<div class="incident-symbol">⚠️</div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  }),
};

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom?: number;
}) {
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
  language?: string;
}

export function IncidentMap({ onMapClick, language }: IncidentMapProps) {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.006]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  useEffect(() => {
    // re-run when language changes so popup labels re-evaluate translations
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      setProfile(data);
    };

    fetchProfile();
  }, [user, language]);

  useEffect(() => {
    // Keep default center until user logs in
    setCenter([40.7128, -74.006]);
  }, []);

  // When user logs in, center the map around their current geolocation (if allowed)
  useEffect(() => {
    if (!user) return;

    // helper to read coordinates from profile if available (safe checks)
    const profileCoords = (): [number, number] | null => {
      if (!profile) return null;
      const tryNumber = (v: unknown): number | null => (typeof v === "number" ? v : null);

      const latCandidates = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).latitude,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).lat,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).location_lat,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).location?.lat,
      ];
      const lngCandidates = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).longitude,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).lng,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).location_lng,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (profile as any).location?.lng,
      ];

      let lat: number | null = null;
      let lng: number | null = null;
      for (const c of latCandidates) {
        const n = tryNumber(c);
        if (n !== null) {
          lat = n;
          break;
        }
      }
      for (const c of lngCandidates) {
        const n = tryNumber(c);
        if (n !== null) {
          lng = n;
          break;
        }
      }
      if (lat !== null && lng !== null) return [lat, lng];
      return null;
    };

    if (!navigator.geolocation) {
      const p = profileCoords();
      if (p) {
        setCenter(p);
        setUserLocation(p);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setCenter(coords);
        setUserLocation(coords);
      },
      (err) => {
        // user denied or error — try to use profile stored location (if any)
        console.warn("Geolocation not available or denied:", err);
        const p = profileCoords();
        if (p) {
          setCenter(p);
          setUserLocation(p);
        }
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;

    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching incidents:", error);
        return;
      }

      setIncidents(data || []);
    };

    fetchIncidents();

    const channel = supabase
      .channel("incidents-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
        fetchIncidents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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

      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.latitude, incident.longitude]}
          icon={incidentIcons[incident.incident_type] || incidentIcons.other}
        >
          <Popup className="custom-popup">
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    incident.incident_type === "crime"
                      ? "bg-red-900 text-red-100"
                      : incident.incident_type === "fire"
                        ? "bg-orange-900 text-orange-100"
                        : incident.incident_type === "accident"
                          ? "bg-yellow-900 text-yellow-100"
                          : incident.incident_type === "medical"
                            ? "bg-pink-900 text-pink-100"
                            : "bg-gray-700 text-gray-100"
                  }`}
                >
                  {t(incident.incident_type)}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    incident.status === "active"
                      ? "bg-red-500 text-white"
                      : incident.status === "responding"
                        ? "bg-yellow-500 text-black"
                        : "bg-green-500 text-white"
                  }`}
                >
                  {incident.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-semibold mb-1 text-gray-900">
                {incident.description}
              </p>
              {incident.location_name && (
                <p className="text-xs text-gray-600 mb-1">
                  {incident.location_name}
                </p>
              )}
              {incident.reporter_name && (
                <p className="text-xs text-gray-600 mb-1">
                  {t('reportedBy')}: {incident.reporter_name}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">{formatDate(incident.created_at)}</p>
              {profile?.role === "officer" && (
                <OfficerControls
                  incident={incident}
                  onUpdate={() => {
                    const fetchIncidents = async () => {
                      const { data } = await supabase
                        .from("incidents")
                        .select("*")
                        .order("created_at", { ascending: false });
                      if (data) setIncidents(data);
                    };
                    fetchIncidents();
                  }}
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
