import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import { supabase, Incident, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { OfficerControls } from './OfficerControls';
import 'leaflet/dist/leaflet.css';

const incidentIcons: Record<string, Icon> = {
  crime: new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMCAwIDUgNSA1IDExYzAgOSAxMSAyMCAxMSAyMHMxMS0xMSAxMS0yMGMwLTYtNS0xMS0xMS0xMXptMCAxNWMtMi4yIDAtNC0xLjgtNC00czEuOC00IDQtNCA0IDEuOCA0IDQtMS44IDQtNCA0eiIgZmlsbD0iIzk5MTkxOSIvPjwvc3ZnPg==',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48]
  }),
  fire: new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMCAwIDUgNSA1IDExYzAgOSAxMSAyMCAxMSAyMHMxMS0xMSAxMS0yMGMwLTYtNS0xMS0xMS0xMXptMCAxNWMtMi4yIDAtNC0xLjgtNC00czEuOC00IDQtNCA0IDEuOCA0IDQtMS44IDQtNCA0eiIgZmlsbD0iI2RjMjYyNiIvPjwvc3ZnPg==',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48]
  }),
  accident: new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMCAwIDUgNSA1IDExYzAgOSAxMSAyMCAxMSAyMHMxMS0xMSAxMS0yMGMwLTYtNS0xMS0xMS0xMXptMCAxNWMtMi4yIDAtNC0xLjgtNC00czEuOC00IDQtNCA0IDEuOCA0IDQtMS44IDQtNCA0eiIgZmlsbD0iI2VhNTgwYyIvPjwvc3ZnPg==',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48]
  }),
  medical: new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMCAwIDUgNSA1IDExYzAgOSAxMSAyMCAxMSAyMHMxMS0xMSAxMS0yMGMwLTYtNS0xMS0xMS0xMXptMCAxNWMtMi4yIDAtNC0xLjgtNC00czEuOC00IDQtNCA0IDEuOCA0IDQtMS44IDQtNCA0eiIgZmlsbD0iI2YyNWY1ZiIvPjwvc3ZnPg==',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48]
  }),
  other: new Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTYgMEMxMCAwIDUgNSA1IDExYzAgOSAxMSAyMCAxMSAyMHMxMS0xMSAxMS0yMGMwLTYtNS0xMS0xMS0xMXptMCAxNWMtMi4yIDAtNC0xLjgtNC00czEuOC00IDQtNCA0IDEuOCA0IDQtMS44IDQtNCA0eiIgZmlsbD0iI2IxMTIxMyIvPjwvc3ZnPg==',
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -48]
  })
};

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !center) return;
    try {
      // Preserve zoom when zoom not provided
      const z = typeof zoom === 'number' ? zoom : map.getZoom();
      map.setView(center, z);
    } catch (e) {
      // ignore
    }
  }, [map, center, zoom]);
  return null;
}

interface IncidentMapProps {
  onMapClick: (lat: number, lng: number) => void;
}

export function IncidentMap({ onMapClick }: IncidentMapProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(data);
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    // Attempt to get a quick center on mount if permission already granted (non-blocking)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // ignore errors — we'll keep default center
        },
        { maximumAge: 60 * 1000 }
      );
    }
  }, []);

  // When user logs in, center the map around their current geolocation (if allowed)
  useEffect(() => {
    if (!user) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(coords);
        setUserLocation(coords);
      },
      (err) => {
        // user denied or error — keep default center
        console.warn('Geolocation not available or denied:', err);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchIncidents = async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incidents:', error);
        return;
      }

      setIncidents(data || []);
    };

    fetchIncidents();

    const channel = supabase
      .channel('incidents-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
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
      minZoom={2}
      maxZoom={19}
      scrollWheelZoom={true}
      className="h-full w-full"
      zoomControl={true}
    >
      <MapUpdater center={center} />
      {/* user pin marker (divIcon) */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={divIcon({ className: 'sv-user-pin', iconSize: [18, 18], iconAnchor: [9, 9] })}
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
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  incident.incident_type === 'crime' ? 'bg-red-900 text-red-100' :
                  incident.incident_type === 'fire' ? 'bg-sv-orange-900 text-orange-100' :
                  incident.incident_type === 'accident' ? 'bg-sv-orange-700 text-white' :
                  incident.incident_type === 'medical' ? 'bg-sv-magenta-900 text-sv-magenta-100' :
                  'bg-gray-700 text-gray-100'
                }`}>
                  {incident.incident_type.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  incident.status === 'active' ? 'bg-red-500 text-white' :
                  incident.status === 'responding' ? 'bg-yellow-500 text-black' :
                  'bg-green-500 text-white'
                }`}>
                  {incident.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-semibold mb-1 text-gray-900">{incident.description}</p>
              {incident.location_name && (
                <p className="text-xs text-gray-600 mb-1">{incident.location_name}</p>
              )}
              {incident.reporter_name && (
                <p className="text-xs text-gray-600 mb-1">Reported by: {incident.reporter_name}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">{formatDate(incident.created_at)}</p>
              {profile?.role === 'officer' && (
                <OfficerControls
                  incident={incident}
                  onUpdate={() => {
                    const fetchIncidents = async () => {
                      const { data } = await supabase
                        .from('incidents')
                        .select('*')
                        .order('created_at', { ascending: false });
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
