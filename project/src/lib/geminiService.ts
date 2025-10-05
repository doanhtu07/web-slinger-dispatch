import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export interface ParsedIncident {
  incident_type: "crime" | "accident" | "fire" | "medical" | "hazard" | "other";
  description: string;
  location_name: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number; // 0-1 score of how confident the AI is
}

/**
 * Parse voice input into structured incident data using Gemini AI
 */
export async function parseVoiceToIncident(
  voiceText: string,
  userLocation?: { lat: number; lng: number }
): Promise<ParsedIncident> {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const locationContext = userLocation 
      ? `The user is currently at coordinates: ${userLocation.lat}, ${userLocation.lng}.`
      : "";

    const prompt = `You are an emergency dispatch AI assistant. Parse the following incident report from a driver and extract structured data.

${locationContext}

User's voice report: "${voiceText}"

Extract the following information and return ONLY a valid JSON object (no markdown, no code blocks, just the JSON):

{
  "incident_type": "crime|accident|fire|medical|hazard|other",
  "description": "concise description of what happened",
  "location_name": "street name, intersection, or landmark mentioned",
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0
}

Rules:
- incident_type: Choose the most appropriate category. Use "hazard" for road obstructions, debris, potholes, etc.
- description: Keep it under 100 characters, factual and clear
- location_name: Extract any street names, intersections, or landmarks. If none mentioned, use "Current location"
- severity: 
  * low: minor issues (small debris, minor traffic)
  * medium: notable issues (tree branch, moderate accident)
  * high: serious issues (large obstruction, injury accident)
  * critical: life-threatening (fire, major accident, crime in progress)
- confidence: How confident you are in the parsing (0.0-1.0). Use:
  * 0.9-1.0: Very clear report with specific details
  * 0.7-0.89: Clear incident type and location
  * 0.5-0.69: Vague location or incident type
  * Below 0.5: Very unclear report

Return ONLY the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up any markdown formatting if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const parsed = JSON.parse(text);

    // Validate the response
    if (!parsed.incident_type || !parsed.description || !parsed.location_name) {
      throw new Error("Invalid response from Gemini: missing required fields");
    }

    // Ensure incident_type is valid
    const validTypes = ["crime", "accident", "fire", "medical", "hazard", "other"];
    if (!validTypes.includes(parsed.incident_type)) {
      parsed.incident_type = "other";
    }

    // Ensure severity is valid
    const validSeverities = ["low", "medium", "high", "critical"];
    if (!validSeverities.includes(parsed.severity)) {
      parsed.severity = "medium";
    }

    // Ensure confidence is a number between 0 and 1
    parsed.confidence = Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5));

    return parsed as ParsedIncident;
  } catch (error) {
    console.error("Error parsing voice with Gemini:", error);
    
    // Fallback: simple keyword-based parsing
    return fallbackParsing(voiceText);
  }
}

/**
 * Fallback parsing if Gemini API fails or is not configured
 */
function fallbackParsing(text: string): ParsedIncident {
  const lowerText = text.toLowerCase();
  
  // Simple keyword matching for incident type
  let incident_type: ParsedIncident["incident_type"] = "other";
  let severity: ParsedIncident["severity"] = "medium";
  
  if (lowerText.includes("fire") || lowerText.includes("burning") || lowerText.includes("smoke")) {
    incident_type = "fire";
    severity = "critical";
  } else if (lowerText.includes("accident") || lowerText.includes("crash") || lowerText.includes("collision")) {
    incident_type = "accident";
    severity = "high";
  } else if (lowerText.includes("medical") || lowerText.includes("injured") || lowerText.includes("hurt")) {
    incident_type = "medical";
    severity = "high";
  } else if (lowerText.includes("crime") || lowerText.includes("robbery") || lowerText.includes("theft")) {
    incident_type = "crime";
    severity = "high";
  } else if (lowerText.includes("tree") || lowerText.includes("debris") || lowerText.includes("blocking") || 
             lowerText.includes("pothole") || lowerText.includes("obstruction")) {
    incident_type = "hazard";
    severity = "medium";
  }

  // Extract location (simple approach - look for street names)
  const streetPatterns = [
    /on ([a-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln))/i,
    /at ([a-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln))/i,
    /near ([a-z\s]+)/i,
  ];

  let location_name = "Current location";
  for (const pattern of streetPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      location_name = match[1].trim();
      break;
    }
  }

  return {
    incident_type,
    description: text.substring(0, 100),
    location_name,
    severity,
    confidence: 0.5, // Low confidence for fallback
  };
}

/**
 * Test function for voice parsing
 */
export async function testVoiceParsing(): Promise<void> {
  const testCases = [
    "A tree is blocking the road on Cooper Street!",
    "There's a fire at the gas station on Main Avenue",
    "Car accident at the intersection of 5th and Oak",
    "Someone got hurt near the shopping mall",
  ];

  console.log("=== Testing Voice Parsing ===");
  for (const test of testCases) {
    console.log(`\nInput: "${test}"`);
    try {
      const result = await parseVoiceToIncident(test);
      console.log("Parsed:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
