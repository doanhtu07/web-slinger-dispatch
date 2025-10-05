import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotAssistantProps {
  userLocation: { lat: number; lng: number } | null;
}

// The client gets the API key from the environment variable `VITE_GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ""
});

// Calculate distance between two coordinates in kilometers
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Format incident data for AI context
const formatIncidentsForAI = (incidents: any[], userLocation: { lat: number; lng: number } | null): string => {
  if (!incidents || incidents.length === 0) {
    return "No incidents currently reported in the system.";
  }

  // Sort by distance if user location is available
  const sortedIncidents = userLocation ? 
    incidents.sort((a, b) => {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
      return distA - distB;
    }) : incidents;

  return sortedIncidents.map((incident, index) => {
    const distance = userLocation ? 
      calculateDistance(userLocation.lat, userLocation.lng, incident.latitude, incident.longitude) : null;
    
    const timeAgo = getTimeAgo(incident.created_at);
    
    return `Incident ${index + 1}:
Type: ${incident.incident_type}
Description: ${incident.description || "No description provided"}
Location: ${incident.location_name || "Location not specified"}
Distance: ${distance ? `${distance.toFixed(1)}km away` : "Distance unknown"}
Status: ${incident.status}
Reported: ${timeAgo}
Reporter: ${incident.reporter_name || "Anonymous"}`;
  }).join("\n\n");
};

// Helper function to convert timestamp to relative time
const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
};

// AI query processing function
const processQuery = async (query: string, incidents: any[], userLocation: { lat: number; lng: number } | null): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "❌ Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.";
  }

  try {
    const incidentData = formatIncidentsForAI(incidents, userLocation);
    const locationContext = userLocation ? 
      `User's current location: ${userLocation.lat}, ${userLocation.lng}` : 
      "User location not available";

    const systemPrompt = `You are a friendly emergency dispatch assistant helping users query incident data. 

Context:
${locationContext}

Current Incidents Database:
${incidentData}

User Query: "${query}"

IMPORTANT FORMATTING RULES:
- Use natural, conversational language
- Format responses with clear spacing and line breaks
- Use emojis sparingly (🚨🔥💥🏥⚠️) only for incident types
- Present incidents in clean, readable format like:
  "🚨 CRIME: Brief description
   📍 Location (0.5km away)
   ⏰ Reported 2 hours ago
   Status: Active"
- Use "📍" for locations, "⏰" for time, "🔄" for status
- Separate multiple incidents with blank lines
- Start with a brief summary like "I found 3 incidents near you:" 
- Keep descriptions concise and human-readable
- Avoid technical database field names
- Use relative time ("2 hours ago" vs timestamps)
- Group similar incidents when appropriate
- End with helpful context or next steps`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });
    return response.text || "Sorry, I couldn't generate a response.";

  } catch (error) {
    console.error("Error processing query:", error);
    if (error instanceof Error) {
      return `❌ Error processing your query: ${error.message}`;
    }
    return "❌ An unexpected error occurred while processing your query.";
  }
};

export function ChatbotAssistant({ userLocation }: ChatbotAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm your incident query assistant.\n\nI can help you find information about:\n• Incidents near your location\n• Recent emergency reports\n• Specific types of incidents\n• Current incident status\n\nTry asking: \"Show me incidents near me\" or \"Any active emergencies?\"",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all incidents from Convex
  const incidents = useQuery(api.incidents.getIncidents);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await processQuery(inputValue.trim(), incidents || [], userLocation );
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "� Chat cleared!\n\nWhat would you like to know about current incidents?",
        timestamp: new Date()
      }
    ]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 text-white p-4 rounded-full shadow-lg sv-magenta-glow hover:scale-110 transition-transform duration-200 group"
        title="Open AI Query Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-2 -right-2 bg-sv-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          ?
        </div>
      </button>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-md border border-sv-red-900/50 rounded-xl shadow-2xl sv-red-glow w-96 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sv-red-900/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-sv-red-400" />
          <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-sv-red-400 to-sv-magenta-400">Incident Query Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-sv-red-300 hover:text-sv-red-200 text-sm px-2 py-1 rounded hover:bg-sv-red-900/30 transition-colors"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-sv-red-300 hover:text-sv-red-200 p-1 rounded hover:bg-sv-red-900/30 transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                message.role === "user"
                  ? "bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 text-white"
                  : "bg-black/60 border border-sv-red-900/30 text-sv-red-100"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-black/60 border border-sv-red-900/30 text-sv-red-100 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-sv-red-400" />
              Analyzing incidents...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-sv-red-900/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about incidents... (e.g., 'Show me incidents near me')"
            className="flex-1 bg-black/30 border border-sv-red-900/50 text-white placeholder-sv-red-300/70 px-3 py-2 rounded focus:border-sv-red-500 focus:outline-none text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 text-white p-2 rounded hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick suggestion buttons */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            "Incidents near me",
            "Recent reports",
            "Active emergencies",
            "Fire incidents"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="text-xs bg-black/30 border border-sv-red-900/50 text-sv-red-200 px-2 py-1 rounded hover:bg-sv-red-900/30 hover:text-sv-red-100 transition-colors"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
