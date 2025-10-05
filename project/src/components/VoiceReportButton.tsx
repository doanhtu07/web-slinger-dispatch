import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2, Bug } from "lucide-react";
import { parseVoiceToIncident, ParsedIncident } from "../lib/geminiService";
import { resolveLocation } from "../lib/geocodingService";

interface VoiceReportButtonProps {
  onIncidentParsed: (incident: {
    incident_type: ParsedIncident["incident_type"];
    description: string;
    latitude: number;
    longitude: number;
    location_name: string;
    confidence: number;
  }) => void;
  userLocation?: { lat: number; lng: number };
}

interface DebugLog {
  timestamp: string;
  step: string;
  status: "processing" | "success" | "error";
  data?: any;
  message?: string;
}

export function VoiceReportButton({ onIncidentParsed, userLocation }: VoiceReportButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (step: string, status: DebugLog["status"], data?: any, message?: string) => {
    const log: DebugLog = {
      timestamp: new Date().toLocaleTimeString(),
      step,
      status,
      data,
      message,
    };
    setDebugLogs(prev => [...prev, log]);
    console.log(`[Voice Debug] ${step}:`, { status, data, message });
  };

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Voice input not supported in this browser");
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript("");
      setDebugLogs([]); // Clear previous logs
      addDebugLog("Voice Recognition Started", "success", null, "Listening for voice input...");
    };

    recognitionInstance.onresult = async (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      setIsProcessing(true);
      
      addDebugLog("Voice Captured", "success", { transcript: text }, `Heard: "${text}"`);

      try {
        // Parse voice input with Gemini AI
        addDebugLog("Gemini AI Parsing", "processing", null, "Sending to Gemini AI...");
        const parsedIncident = await parseVoiceToIncident(text, userLocation);
        
        addDebugLog("Gemini AI Response", "success", parsedIncident, `Confidence: ${Math.round(parsedIncident.confidence * 100)}%`);

        // Resolve location to coordinates
        addDebugLog("Geocoding", "processing", { location_name: parsedIncident.location_name }, "Converting location to coordinates...");
        const locationData = await resolveLocation(
          parsedIncident.location_name,
          userLocation
        );

        if (!locationData) {
          addDebugLog("Geocoding Failed", "error", null, "Could not determine location");
          throw new Error("Could not determine location. Please try again with a specific street name or enable GPS.");
        }

        addDebugLog("Geocoding Success", "success", locationData, `Location: ${locationData.location_name}`);

        // Pass the parsed incident data back to parent
        addDebugLog("Opening Confirmation Modal", "success", null, "Review and submit your report");
        
        const incidentData = {
          incident_type: parsedIncident.incident_type,
          description: parsedIncident.description,
          latitude: locationData.lat,
          longitude: locationData.lng,
          location_name: locationData.location_name,
          confidence: parsedIncident.confidence,
        };
        
        console.log("🎤 Calling onIncidentParsed with:", incidentData);
        onIncidentParsed(incidentData);

        // Keep transcript visible for a moment before clearing
        setTimeout(() => {
          setTranscript("");
        }, 5000); // Increased to 5 seconds so you can see it
      } catch (err) {
        console.error("Error processing voice:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to process voice input";
        addDebugLog("Error", "error", null, errorMessage);
        setError(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setIsProcessing(false);
      
      if (event.error === "no-speech") {
        addDebugLog("No Speech Detected", "error", null, "No speech was detected. Please try again.");
        setError("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        addDebugLog("Permission Denied", "error", null, "Microphone access was denied.");
        setError("Microphone access denied. Please allow microphone access.");
      } else {
        addDebugLog("Recognition Error", "error", { error: event.error }, `Error: ${event.error}`);
        setError(`Voice recognition error: ${event.error}`);
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [onIncidentParsed, userLocation]);

  const handleClick = () => {
    if (!recognition) {
      setError("Voice recognition not available");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
        setError("Failed to start voice recognition");
      }
    }
  };

  const isDisabled = isProcessing || !recognition;

  const getStatusColor = (status: DebugLog["status"]) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "processing":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: DebugLog["status"]) => {
    switch (status) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "processing":
        return "⟳";
      default:
        return "•";
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          relative flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
          transition-all duration-200 shadow-lg
          ${
            isListening
              ? "bg-red-600 hover:bg-red-700 animate-pulse"
              : isProcessing
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-sv-red-600 to-sv-blue-600 hover:from-sv-red-500 hover:to-sv-blue-500"
          }
          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          text-white sv-magenta-glow
        `}
        title={
          isListening
            ? "Listening... Click to stop"
            : isProcessing
            ? "Processing..."
            : "Click to report via voice"
        }
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">
          {isProcessing ? "Processing..." : isListening ? "Listening..." : "Voice Report"}
        </span>
      </button>

      {/* Debug Toggle Button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors px-2 py-1 bg-black/40 rounded"
        title="Toggle debug panel"
      >
        <Bug className="w-3 h-3" />
        Debug {showDebug ? "▼" : "▶"}
      </button>

      {/* Always show transcript prominently when available */}
      {transcript && !showDebug && (
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 rounded-lg p-3 max-w-md shadow-lg">
          <div className="flex items-start gap-2">
            <Mic className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-300 mb-1">You said:</p>
              <p className="text-sm text-white font-medium leading-relaxed">
                "{transcript}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-black/90 border border-gray-700 rounded-lg p-3 max-w-md w-full shadow-2xl max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Voice Processing Debug
            </h3>
            <button
              onClick={() => setDebugLogs([])}
              className="text-xs text-gray-500 hover:text-gray-300"
              title="Clear logs"
            >
              Clear
            </button>
          </div>

          {/* Display User's Spoken Text Prominently */}
          {transcript && (
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-300 mb-1">You said:</p>
                  <p className="text-sm text-white font-medium leading-relaxed">
                    "{transcript}"
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {debugLogs.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              Click the microphone to start. Debug logs will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {debugLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`bg-gray-900/50 rounded p-2 border-l-4 ${
                    log.status === "success" 
                      ? "border-green-500" 
                      : log.status === "error" 
                      ? "border-red-500" 
                      : "border-yellow-500"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-mono ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-200">{log.step}</span>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </div>
                      {log.message && (
                        <p className="text-xs text-gray-400 mt-1">{log.message}</p>
                      )}
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                            View data
                          </summary>
                          <pre className="text-xs text-gray-300 bg-black/50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && !showDebug && (
        <div className="text-xs text-red-400 max-w-xs text-center bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {isListening && !showDebug && (
        <div className="text-xs text-gray-400 max-w-xs text-center bg-gray-900/50 border border-gray-600/30 rounded px-3 py-2 animate-pulse">
          🎤 Speak now... (e.g., "A tree is blocking the road on Cooper Street!")
        </div>
      )}

      {isProcessing && !showDebug && (
        <div className="text-xs text-yellow-400 max-w-xs text-center bg-yellow-900/20 border border-yellow-500/30 rounded px-3 py-2">
          ⏳ Processing your voice input...
        </div>
      )}
    </div>
  );
}
