import { GoogleGenerativeAI } from "@google/generative-ai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { supabase } from "./supabase";
import type { Incident } from "./supabase";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Initialize ElevenLabs
const elevenlabs = new ElevenLabsClient({
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || "",
});

/**
 * Generate a professional paragraph report for an incident using Gemini AI
 */
export async function generateIncidentReport(incident: Incident): Promise<string> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.warn("Gemini API key not configured");
    return getFallbackReport(incident);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const time = new Date(incident.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const location = incident.location_name || "Unknown location";

    const prompt = `You are a professional emergency dispatcher creating a brief voice announcement.

Generate a SHORT announcement with ONLY these details:
- Incident type: ${incident.incident_type}
- Description: ${incident.description}
- Location: ${location}
- Time reported: ${time}

EXACT FORMAT TO FOLLOW: "{type} report: {description} at {location} reported at {time}"

Example: "Fire report: Building fire at Main Street reported at 3:45 PM"

Generate ONLY the announcement following the exact format. No extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log("📝 Gemini generated report:", text);
    return text;
  } catch (error) {
    console.error("Error generating report with Gemini:", error);
    return getFallbackReport(incident);
  }
}

/**
 * Fallback report generator if Gemini API is not available
 */
function getFallbackReport(incident: Incident): string {
  const time = new Date(incident.created_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const location = incident.location_name || "Unknown location";
  const type = incident.incident_type.charAt(0).toUpperCase() + incident.incident_type.slice(1);
  
  return `${type} report: ${incident.description} at ${location} reported at ${time}`;
}

/**
 * Convert text to speech using ElevenLabs and play it
 */
export async function textToSpeech(text: string, voiceId?: string): Promise<void> {
  if (!import.meta.env.VITE_ELEVENLABS_API_KEY) {
    console.warn("ElevenLabs API key not configured, using browser speech");
    useBrowserSpeech(text);
    return;
  }

  try {
    console.log("🔊 Converting to speech with ElevenLabs...");
    
    // Beautiful, professional voices:
    // "21m00Tcm4TlvDq8ikWAM" - Rachel (warm, professional female - RECOMMENDED)
    // "pNInz6obpgDQGcFmaJgB" - Adam (deep, clear male - news anchor quality)
    // "EXAVITQu4vr4xnSDxMaL" - Bella (elegant, smooth female)
    // "onwK4e9ZLuTAKqWW03F9" - Daniel (authoritative male - broadcaster)
    // "ErXwobaYiN019PkySvjV" - Antoni (well-balanced male)
    const selectedVoice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel - warm professional voice

    const audio = await elevenlabs.textToSpeech.convert(selectedVoice, {
      text,
      modelId: "eleven_multilingual_v2", // High quality model for beautiful voice
      voiceSettings: {
        stability: 0.5, // Balanced for natural expression
        similarityBoost: 0.85, // Higher for more natural voice quality
        style: 0.4, // Some expression for engaging delivery
        useSpeakerBoost: true, // Enhanced clarity
      },
    });

    // Convert ReadableStream to Blob
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
    const audioUrl = URL.createObjectURL(blob);
    const audioElement = new Audio(audioUrl);
    
    // Normal playback speed
    audioElement.playbackRate = 1.0;
    
    console.log("🔊 Playing announcement at normal speed...");
    
    audioElement.play().catch((error) => {
      console.error("Error playing audio:", error);
      // Fallback to browser speech if audio playback fails
      useBrowserSpeech(text);
    });

    // Clean up the URL after playing
    audioElement.onended = () => {
      URL.revokeObjectURL(audioUrl);
      console.log("✅ Announcement complete");
    };
  } catch (error) {
    console.error("Error with ElevenLabs text-to-speech:", error);
    // Fallback to browser's speech synthesis
    useBrowserSpeech(text);
  }
}

/**
 * Fallback: Use browser's built-in speech synthesis
 */
function useBrowserSpeech(text: string): void {
  if ("speechSynthesis" in window) {
    console.log("🔊 Using browser speech synthesis at normal speed");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; // Normal speech rate
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a professional-sounding voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes("Google") ||
        voice.name.includes("Microsoft") ||
        voice.name.includes("Male") ||
        voice.lang.startsWith("en")
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser");
  }
}

/**
 * Main function to announce a new incident
 * Generates a professional report using Gemini and speaks it using ElevenLabs
 */
export async function announceNewIncident(
  incident: Incident,
  options?: {
    voiceId?: string;
    enabled?: boolean;
  }
): Promise<void> {
  // Check if announcements are enabled
  if (options?.enabled === false) {
    console.log("📢 Announcements disabled");
    return;
  }

  try {
    console.log("📢 Announcing new incident:", incident.id);
    
    // Step 1: Generate professional report using Gemini AI
    const reportText = await generateIncidentReport(incident);
    
    console.log("📝 Report generated:", reportText);
    
    // Step 2: Convert to speech and play using ElevenLabs
    await textToSpeech(reportText, options?.voiceId);
    
  } catch (error) {
    console.error("Error announcing incident:", error);
  }
}

/**
 * Test function to verify the announcement system
 * Fetches the most recent incident from database and announces it
 */
export async function testIncidentAnnouncement(): Promise<void> {
  try {
    console.log("🧪 Testing announcement system - fetching latest incident from database...");
    
    // Fetch the most recent incident from Supabase
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("❌ Error fetching incident from database:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ No incidents found in database. Creating a mock incident for testing...");
      
      // Fallback to mock data if database is empty
      const testIncident: Incident = {
        id: "test-123",
        user_id: "test-user",
        incident_type: "accident",
        description: "Traffic accident reported on Main Street",
        latitude: 32.7157,
        longitude: -97.1331,
        location_name: "Main Street, Arlington, TX",
        status: "active",
        reporter_name: "Test User",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await announceNewIncident(testIncident, { enabled: true });
      return;
    }

    const latestIncident = data[0];
    console.log("✅ Found latest incident:", {
      id: latestIncident.id,
      type: latestIncident.incident_type,
      location: latestIncident.location_name,
      created: latestIncident.created_at,
    });

    // Announce the real incident
    await announceNewIncident(latestIncident, { enabled: true });
    
  } catch (error) {
    console.error("❌ Test announcement failed:", error);
    throw error;
  }
}
