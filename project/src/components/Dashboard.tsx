import { useState, useEffect } from "react";
import { IncidentMap } from "./IncidentMap";
import { ReportModal } from "./ReportModal";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle, LogOut, MapPin, X, Shield } from "lucide-react";
import logo from "../images/logo.png";
import { supabase, Profile } from "../lib/supabase";
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t, i18n } = useTranslation();
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
          alert(
            "Unable to get your location. Please click on the map to select a location.",
          );
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
      // quick feedback to confirm the click handler fired
      alert('Signing out...');
      console.log('Sign out clicked');
      // log current session so we can see what's active
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        // (importing supabase here to avoid changing context file)
        const { supabase: _s } = await import('../lib/supabase');
        const sess = await _s.auth.getSession();
        console.log('Current session before signOut:', sess);
      } catch (sessionErr) {
        console.warn('Could not get session before signOut', sessionErr);
      }
      await signOut();
      console.log('Sign out succeeded, reloading');
      // force reload to ensure auth state is refreshed in the app
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
      // surface the real error so the user can report it
      const msg = (error && (error as any).message) ? (error as any).message : String(error);
      // attempt a client-side fallback: clear supabase-related localStorage keys
      try {
        const removed: string[] = [];
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          keys.push(k);
        }
        for (const k of keys) {
          if (k.startsWith('sb-') || k.includes('supabase') || k.includes('sb:') || k.includes('supabase.auth')) {
            localStorage.removeItem(k);
            removed.push(k);
            console.log('Removed localStorage key during signOut fallback:', k);
          }
        }
        alert('Error signing out: ' + msg + '\nApplied client-side fallback and cleared local session.');
        window.location.reload();
      } catch (cleanupErr) {
        console.error('Sign out fallback cleanup failed', cleanupErr);
        alert('Error signing out: ' + msg + '\nAlso failed to clear local session. See console for details.');
      }
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden">
      <header className="bg-sv-hero border-b border-sv-red-900/50 px-4 py-3 flex items-center justify-between z-10 sv-magenta-glow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img src={logo} alt={t('appTitle')} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sv-red-400 to-sv-blue-400">
              {t('appTitle')}
            </h1>
            <p className="text-xs text-red-300/70 hidden sm:block">
              {t('tagline')}
            </p>
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
          <div className="flex items-center gap-2">
            <select
              value={i18n.language}
              onChange={(e) => {
                const lng = e.target.value;
                i18n.changeLanguage(lng);
                localStorage.setItem('lng', lng);
              }}
              className="bg-black/30 border border-sv-red-900/50 text-sm rounded px-2 py-1 text-white"
            >
              <option value="en">EN</option>
              <option value="vi">VI</option>
              <option value="es">ES</option>
            </select>

            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-red-900/30 rounded-lg transition-colors group"
              title={t('signOut')}
            >
              <LogOut className="w-5 h-5 text-sv-red-300 group-hover:text-sv-red-200" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <IncidentMap onMapClick={handleMapClick} />

        {showInstructions && (
          <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md border border-sv-red-900/50 rounded-xl p-4 shadow-2xl sv-red-glow pointer-events-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-sv-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-100 mb-1">How to Report</h3>
                  <p className="text-xs text-red-200/80 leading-relaxed">
                    Click anywhere on the map to report an incident at that location, or use the
                    quick report button to use your current location.
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

          <div className="absolute bottom-8 left-8 z-[1000] bg-black/80 backdrop-blur-sm border border-sv-red-900/50 rounded-lg p-3 shadow-xl sv-red-glow">
          <h4 className="text-xs font-semibold text-sv-red-100 mb-2">{t('legend')}</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sv-red-900"></div>
              <span className="text-xs text-sv-red-200">{t('crime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sv-red-600"></div>
              <span className="text-xs text-sv-red-200">{t('fire')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sv-orange-500"></div>
              <span className="text-xs text-sv-red-200">{t('accident')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sv-magenta-500"></div>
              <span className="text-xs text-sv-red-200">{t('medical')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
              <span className="text-xs text-sv-red-200">{t('other')}</span>
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
