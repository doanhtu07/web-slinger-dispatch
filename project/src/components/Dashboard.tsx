import { useState, useEffect } from "react";
import { IncidentMap } from "./IncidentMap";
import { ReportModal } from "./ReportModal";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle, LogOut, MapPin, X, Shield } from "lucide-react";
import { supabase, Profile } from "../lib/supabase";

export function Dashboard() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const dismissed = localStorage.getItem("instructionsDismissed");
    if (dismissed === "true") {
      setShowInstructions(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const handleDismissInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem("instructionsDismissed", "true");
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsReportModalOpen(true);
  };

  const handleQuickReport = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsReportModalOpen(true);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please click on the map to select a location.");
          setIsGettingLocation(false);
        },
      );
    } else {
      alert(
        "Geolocation is not supported by your browser. Please click on the map to select a location.",
      );
      setIsGettingLocation(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden">
      <header className="bg-gradient-to-r from-black via-red-950 to-black border-b border-red-900/50 px-4 py-3 flex items-center justify-between z-10 shadow-lg shadow-red-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-4l6-4-6-4v8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              Web-Slinger Dispatch
            </h1>
            <p className="text-xs text-red-300/70 hidden sm:block">Real-time Incident Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile?.role === "officer" && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-900/30 border border-red-600/50 rounded-lg">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-red-200">
                Officer {profile.badge_number}
              </span>
            </div>
          )}
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm font-medium text-red-100">
              {profile?.name || user?.user_metadata?.name || "Agent"}
            </p>
            <p className="text-xs text-red-300/70">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors group"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-red-300 group-hover:text-red-200" />
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <IncidentMap onMapClick={handleMapClick} />

        {showInstructions && (
          <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
            <div className="bg-gradient-to-r from-black/80 via-red-950/80 to-black/80 backdrop-blur-md border border-red-900/50 rounded-xl p-4 shadow-2xl shadow-red-900/30 pointer-events-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-100 mb-1">How to Report</h3>
                  <p className="text-xs text-red-200/80 leading-relaxed">
                    Click anywhere on the map to report an incident at that location, or use the
                    quick report button to use your current location.
                  </p>
                </div>
                <button
                  onClick={handleDismissInstructions}
                  className="p-1 hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                  title="Dismiss"
                >
                  <X className="w-4 h-4 text-red-300" />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleQuickReport}
          disabled={isGettingLocation}
          className="absolute bottom-8 right-8 z-[1000] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-4 rounded-full shadow-2xl shadow-red-600/50 hover:shadow-red-600/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed group transform hover:scale-110"
          title="Quick Report at Current Location"
        >
          <div className="relative">
            <MapPin className="w-7 h-7" />
            {isGettingLocation && (
              <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
          </div>
        </button>

        <div className="absolute bottom-8 left-8 z-[1000] bg-black/80 backdrop-blur-sm border border-red-900/50 rounded-lg p-3 shadow-xl">
          <h4 className="text-xs font-semibold text-red-100 mb-2">Legend</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-900"></div>
              <span className="text-xs text-red-200">Crime</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-xs text-red-200">Fire</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span className="text-xs text-red-200">Accident</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-600"></div>
              <span className="text-xs text-red-200">Medical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
              <span className="text-xs text-red-200">Other</span>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedLocation(null);
        }}
        selectedLocation={selectedLocation}
      />
    </div>
  );
}
