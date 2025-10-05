import { useState, useEffect, useCallback, Fragment } from "react";
import { X, MapPin, Mic, Send, Loader } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { IncidentType, IncidentTypeValue } from "../../../../convex/incidents";
import { useAuth0 } from "@auth0/auth0-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { lat: number; lng: number } | null;
}

const INCIDENT_TYPES = [
  { value: IncidentType.CRIME, label: "Crime", icon: "🚨" },
  { value: IncidentType.FIRE, label: "Fire", icon: "🔥" },
  { value: IncidentType.ACCIDENT, label: "Accident", icon: "💥" },
  { value: IncidentType.MEDICAL, label: "Medical Emergency", icon: "🏥" },
  { value: IncidentType.OTHER, label: "Other", icon: "⚠️" },
];

export function ReportModal({ isOpen, onClose, selectedLocation }: Readonly<ReportModalProps>) {
  const { user } = useAuth0();
  const createIncident = useMutation(api.incidents.createIncident);

  const { t } = useTranslation();
  const [incidentType, setIncidentType] = useState<IncidentTypeValue>(IncidentType.CRIME);
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const fetchLocationName = useCallback(
    async (lat: number, lng: number) => {
      setIsLoadingLocation(true);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        );
        const data = await response.json();
        setLocationName(data.display_name || t("unknownLocation"));
      } catch (error) {
        console.error("Error fetching location name:", error);
        setLocationName(t("locationUnavailable"));
      } finally {
        setIsLoadingLocation(false);
      }
    },
    [t],
  );

  const handleVoiceInput = useCallback(async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert(t("speechUnsupported"));
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => prev + " " + transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      alert(t("speechError"));
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLocation) return;

    setIsSubmitting(true);

    try {
      await createIncident({
        incident_type: incidentType,
        description: description.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        location_name: locationName,
        reporter_name: user?.name || "Nameless",
      });

      setDescription("");
      setIncidentType(IncidentType.CRIME);
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert(t("submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedLocation && isOpen) {
      fetchLocationName(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation, isOpen, fetchLocationName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-black/90 border border-sv-red-900/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto sv-red-glow">
        {/* Header */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-sm p-6 border-b border-sv-red-900/50 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sv-magenta-400 to-sv-red-500">
            {t("reportIncident")}
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-sv-red-900/30 rounded-lg transition-colors"
            title={t("dismiss")}
          >
            <X className="w-6 h-6 text-sv-red-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selected location */}
          {selectedLocation && (
            <div className="p-4 bg-black/40 border border-sv-red-900/30 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sv-red-100 mb-1">
                    {t("selectedLocation")}
                  </p>

                  {isLoadingLocation ? (
                    <p className="text-xs text-sv-red-300/60">{t("loadingLocation")}</p>
                  ) : (
                    <Fragment>
                      <p className="text-xs text-sv-red-300/80 break-words">{locationName}</p>
                      <p className="text-xs text-sv-red-300/60 mt-1">
                        {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </Fragment>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pick incident type */}
          <div>
            <label className="block text-sm font-semibold text-red-100 mb-3">
              {t("incidentType")}
            </label>

            <div className="grid grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setIncidentType(type.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    incidentType === type.value
                      ? "border-red-600 bg-red-900/30 shadow-lg shadow-red-600/20"
                      : "border-red-900/30 bg-black/30 hover:border-red-800/50"
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>

                  <div className="text-sm font-medium text-sv-red-100">
                    {t(type.value.toLowerCase())}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Change description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-sv-red-100 mb-2"
            >
              {t("description")}
            </label>

            <div className="relative">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-3 bg-black/40 border border-sv-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sv-red-500 focus:border-transparent text-white placeholder-sv-red-300/30 resize-none"
                placeholder={t("descriptionPlaceholder")}
              />

              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isRecording}
                className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all ${
                  isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-red-900/50 text-red-300 hover:bg-red-900/70"
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-red-300/60 mt-2">{t("voiceHint")}</p>
          </div>

          <div className="flex gap-3 pt-4">
            {/* Cancel button */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-black/40 border border-sv-red-900/50 text-sv-red-200 font-semibold rounded-lg hover:bg-black/60 transition-all"
            >
              {t("cancel")}
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedLocation}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 hover:from-sv-red-600 hover:to-sv-red-700 text-white font-semibold rounded-lg shadow-lg sv-red-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Fragment>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t("submitting")}
                </Fragment>
              ) : (
                <Fragment>
                  <Send className="w-5 h-5" />
                  {t("submitReport")}
                </Fragment>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
