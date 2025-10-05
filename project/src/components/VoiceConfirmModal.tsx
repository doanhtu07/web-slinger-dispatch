import { useState } from "react";
import { X, AlertCircle, MapPin, CheckCircle2, Edit2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { ParsedIncident } from "../lib/geminiService";

interface VoiceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: {
    incident_type: ParsedIncident["incident_type"];
    description: string;
    latitude: number;
    longitude: number;
    location_name: string;
    confidence: number;
  };
}

const incidentTypeLabels: Record<ParsedIncident["incident_type"], string> = {
  crime: "Crime",
  accident: "Accident",
  fire: "Fire",
  medical: "Medical",
  hazard: "Road Hazard",
  other: "Other",
};

const incidentTypeColors: Record<ParsedIncident["incident_type"], string> = {
  crime: "text-red-400",
  accident: "text-orange-400",
  fire: "text-red-500",
  medical: "text-pink-400",
  hazard: "text-yellow-400",
  other: "text-gray-400",
};

export function VoiceConfirmModal({ isOpen, onClose, parsedData }: VoiceConfirmModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(parsedData);

  console.log("🔔 VoiceConfirmModal render - isOpen:", isOpen, "parsedData:", parsedData);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) {
      alert("Please log in to submit reports");
      return;
    }

    setIsSubmitting(true);
    console.log("📝 Submitting incident:", editedData);

    try {
      const incidentData = {
        user_id: user.id,
        incident_type: editedData.incident_type,
        description: editedData.description,
        latitude: editedData.latitude,
        longitude: editedData.longitude,
        location_name: editedData.location_name,
        status: "active",
        reporter_name: user.user_metadata?.name || user.email,
      };
      
      console.log("📤 Sending to Supabase:", incidentData);
      
      const { error, data } = await supabase.from("incidents").insert(incidentData).select();

      if (error) {
        console.error("❌ Supabase error:", error);
        throw error;
      }

      console.log("✅ Incident created successfully:", data);
      alert("Incident reported successfully! 🚨");
      onClose();
    } catch (error) {
      console.error("Error submitting incident:", error);
      alert("Failed to submit incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidenceLevel =
    parsedData.confidence >= 0.9
      ? "Very High"
      : parsedData.confidence >= 0.7
      ? "High"
      : parsedData.confidence >= 0.5
      ? "Medium"
      : "Low";

  const confidenceColor =
    parsedData.confidence >= 0.9
      ? "text-green-400"
      : parsedData.confidence >= 0.7
      ? "text-blue-400"
      : parsedData.confidence >= 0.5
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-sv-red-900/50 rounded-xl shadow-2xl max-w-md w-full sv-red-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sv-red-900/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-sv-red-500" />
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-sv-red-400 to-sv-blue-400">
              Confirm Voice Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-900/30 rounded-lg transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-red-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Confidence Badge */}
          <div className="flex items-center justify-between bg-black/40 rounded-lg p-3">
            <span className="text-sm text-gray-400">AI Confidence:</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${confidenceColor}`}>
                {confidenceLevel}
              </span>
              <span className="text-xs text-gray-500">
                ({Math.round(parsedData.confidence * 100)}%)
              </span>
            </div>
          </div>

          {/* Edit Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-xs text-sv-blue-400 hover:text-sv-blue-300 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {isEditing ? "Cancel Edit" : "Edit Details"}
            </button>
          </div>

          {/* Incident Type */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Incident Type</label>
            {isEditing ? (
              <select
                value={editedData.incident_type}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    incident_type: e.target.value as ParsedIncident["incident_type"],
                  })
                }
                className="w-full bg-black/60 border border-sv-red-900/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sv-red-500"
                aria-label="Select incident type"
              >
                <option value="crime">Crime</option>
                <option value="accident">Accident</option>
                <option value="fire">Fire</option>
                <option value="medical">Medical</option>
                <option value="hazard">Road Hazard</option>
                <option value="other">Other</option>
              </select>
            ) : (
              <div className="flex items-center gap-2 bg-black/60 rounded-lg px-3 py-2">
                <span className={`font-semibold ${incidentTypeColors[editedData.incident_type]}`}>
                  {incidentTypeLabels[editedData.incident_type]}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400">Description</label>
            {isEditing ? (
              <textarea
                value={editedData.description}
                onChange={(e) =>
                  setEditedData({ ...editedData, description: e.target.value })
                }
                className="w-full bg-black/60 border border-sv-red-900/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sv-red-500 min-h-[80px]"
                placeholder="What happened?"
              />
            ) : (
              <div className="bg-black/60 rounded-lg px-3 py-2">
                <p className="text-sm text-gray-200">{editedData.description}</p>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.location_name}
                onChange={(e) =>
                  setEditedData({ ...editedData, location_name: e.target.value })
                }
                className="w-full bg-black/60 border border-sv-red-900/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sv-red-500"
                placeholder="Location name"
              />
            ) : (
              <div className="bg-black/60 rounded-lg px-3 py-2">
                <p className="text-sm text-gray-200">{editedData.location_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {editedData.latitude.toFixed(4)}, {editedData.longitude.toFixed(4)}
                </p>
              </div>
            )}
          </div>

          {/* Warning for low confidence */}
          {parsedData.confidence < 0.7 && (
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200">
                The AI had moderate confidence parsing your voice input. Please review the details
                above and make corrections if needed.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-sv-red-600 to-sv-blue-600 hover:from-sv-red-500 hover:to-sv-blue-500 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
