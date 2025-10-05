import { useTranslation } from "react-i18next";
import { useAuth0 } from "@auth0/auth0-react";
import { AlertCircle, LogOut, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { IncidentMap } from "./components/IncidentMap";
import { ReportModal } from "./components/ReportModal";
import { ParsedIncident } from "../../lib/geminiService";
import { AnnouncementTestButton } from "../../components/AnnouncementTestButton";
import { VoiceReportButton } from "../../components/VoiceReportButton";
import { VoiceConfirmModal } from "../../components/VoiceConfirmModal";
import { SearchBox } from "./components/SearchBox";

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth0();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportLocation, setSelectedReportLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [voiceReportLocation, setVoiceReportLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [incidentMapLocation, setIncidentMapLocation] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 33, lng: 97 }); // Default to UT Arlington
  const [showInstructions, setShowInstructions] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [voiceConfirmData, setVoiceConfirmData] = useState<{
    incident_type: ParsedIncident["incident_type"];
    description: string;
    latitude: number;
    longitude: number;
    location_name: string;
    confidence: number;
  } | null>(null);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedReportLocation({ lat, lng });
    setIsReportModalOpen(true);
  }, []);

  const handleDismissInstructions = useCallback(() => {
    setShowInstructions(false);
  }, []);

  const handleQuickReport = useCallback(() => {
    setIsGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setSelectedReportLocation(location);
          setVoiceReportLocation(location); // Save user location for voice reports

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
  }, []);

  const handleVoiceIncidentParsed = useCallback(
    (incident: {
      incident_type: ParsedIncident["incident_type"];
      description: string;
      latitude: number;
      longitude: number;
      location_name: string;
      confidence: number;
    }) => {
      console.log("🎤 Voice incident parsed:", incident);
      setVoiceConfirmData(incident);
      console.log("✅ Voice confirm modal should now open");
    },
    [],
  );

  // Get user's location on mount for voice reports
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVoiceReportLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Could not get user location:", error);
        },
      );
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <header className="bg-sv-hero border-b border-sv-red-900/50 px-4 py-3 flex items-center justify-between z-10 sv-magenta-glow">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img src={"/logo.png"} alt={t("appTitle")} className="w-full h-full object-cover" />
          </div>

          {/* App title */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sv-red-400 to-sv-blue-400">
              {t("appTitle")}
            </h1>
            <p className="text-xs text-red-300/70 hidden sm:block">{t("tagline")}</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User info */}
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm font-medium text-red-100">{user?.name || "Hero"}</p>
            <p className="text-xs text-red-300/70">{user?.email}</p>
          </div>

          {/* Language selection */}
          <div className="flex items-center gap-2">
            <select
              title={t("selectLanguage")}
              value={i18n.language}
              onChange={(e) => {
                const lng = e.target.value;
                i18n.changeLanguage(lng);
                localStorage.setItem("lng", lng);
              }}
              className="bg-black/30 border border-sv-red-900/50 text-sm rounded px-2 py-1 text-white"
            >
              <option value="en">EN</option>
              <option value="vi">VI</option>
              <option value="es">ES</option>
            </select>

            {/* Sign out button */}
            <button
              onClick={() => {
                logout({ logoutParams: { returnTo: window.location.origin } });
              }}
              className="p-2 hover:bg-red-900/30 rounded-lg transition-colors group"
              title={t("signOut")}
            >
              <LogOut className="w-5 h-5 text-sv-red-300 group-hover:text-sv-red-200" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        {/* Map */}
        <IncidentMap
          onMapClick={handleMapClick}
          incidentMapLocation={incidentMapLocation}
          setIncidentMapLocation={setIncidentMapLocation}
        />

        {/* Usage hints */}
        {showInstructions && (
          <div className="absolute top-4 left-4 z-[1000] pointer-events-none w-[calc(100vw-1rem*2)]">
            <div className="bg-black/80 backdrop-blur-md border border-sv-red-900/50 rounded-xl p-4 shadow-2xl sv-red-glow pointer-events-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-sv-red-500 flex-shrink-0 mt-0.5" />

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-100 mb-1">{t("howToReport")}</h3>
                  <p className="text-xs text-red-200/80 leading-relaxed">
                    {t("reportInstructions")}
                  </p>
                </div>

                <button
                  onClick={handleDismissInstructions}
                  className="p-1 hover:bg-sv-red-900/30 rounded transition-colors flex-shrink-0"
                  title="Dismiss"
                >
                  <X className="w-4 h-4 text-sv-red-300" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar - Middle Bottom */}
        <SearchBox onLocationSelect={(location) => setIncidentMapLocation(location)} />

        {/* Voice Report Button */}
        <div className="absolute bottom-24 right-8 z-[1000] flex flex-col gap-3">
          <VoiceReportButton
            onIncidentParsed={handleVoiceIncidentParsed}
            userLocation={voiceReportLocation || undefined}
          />
          <AnnouncementTestButton />
        </div>

        {/* Location selection */}
        <button
          onClick={handleQuickReport}
          disabled={isGettingLocation}
          className="absolute bottom-8 right-8 z-[1000] bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 text-white p-4 rounded-full sv-magenta-glow hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed group"
          title="Quick Report at Current Location"
        >
          <div className="relative">
            <MapPin className="w-7 h-7" />

            {isGettingLocation && (
              <div className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
          </div>
        </button>

        {/* Map legend */}
        <div className="absolute bottom-8 left-8 z-[1000] bg-black/80 backdrop-blur-sm border border-sv-red-900/50 rounded-lg p-3 shadow-xl sv-red-glow">
          <h4 className="text-xs font-semibold text-sv-red-100 mb-2">{t("legend")}</h4>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="incident-symbol">🚨</div>
              <span className="text-xs text-sv-red-200 text-label">{t("crime")}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="incident-symbol">🔥</div>
              <span className="text-xs text-sv-red-200 text-label">{t("fire")}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="incident-symbol">💥</div>
              <span className="text-xs text-sv-red-200 text-label">{t("accident")}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="incident-symbol">🏥</div>
              <span className="text-xs text-sv-red-200 text-label">{t("medical")}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="incident-symbol">⚠️</div>
              <span className="text-xs text-sv-red-200 text-label">{t("other")}</span>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedReportLocation(null);
        }}
        selectedLocation={selectedReportLocation}
      />

      {/* Voice Confirmation Modal */}
      {voiceConfirmData && (
        <VoiceConfirmModal
          isOpen={true}
          onClose={() => setVoiceConfirmData(null)}
          parsedData={voiceConfirmData}
        />
      )}
    </div>
  );
}
