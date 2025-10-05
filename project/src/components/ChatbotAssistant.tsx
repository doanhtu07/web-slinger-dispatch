import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Loader2, MapPin, Search } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { textToSpeech } from "../lib/incidentAnnouncer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  importance: number;
}

interface ChatbotAssistantProps {
  userLocation: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

// The client gets the API key from the environment variable `VITE_GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ""
});

// Calculate distance between two coordinates in miles
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};





export function ChatbotAssistant({ userLocation, onLocationSelect }: ChatbotAssistantProps) {
  const { t, i18n } = useTranslation();

  // Helper function to convert timestamp to relative time
  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('chatbot.justNow');
    if (diffMins < 60) return `${diffMins} ${diffMins > 1 ? t('chatbot.minutesAgo') : t('chatbot.minuteAgo')}`;
    if (diffHours < 24) return `${diffHours} ${diffHours > 1 ? t('chatbot.hoursAgo') : t('chatbot.hourAgo')}`;
    if (diffDays < 7) return `${diffDays} ${diffDays > 1 ? t('chatbot.daysAgo') : t('chatbot.dayAgo')}`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Format incident data for AI context
  const formatIncidentsForAI = (incidents: any[], userLocation: { lat: number; lng: number } | null): string => {
    if (!incidents || incidents.length === 0) {
      return t('chatbot.noIncidents');
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
${t('chatbot.description')} ${incident.description || t('chatbot.noDescription')}
${t('chatbot.location')} ${incident.location_name || t('chatbot.locationNotSpecified')}
${t('chatbot.distance')} ${distance ? `${distance.toFixed(1)} ${t('chatbot.milesAway')}` : t('chatbot.distanceUnknown')}
Status: ${incident.status}
Reported: ${timeAgo}
${t('chatbot.reporter')} ${incident.reporter_name || t('chatbot.anonymous')}`;
    }).join("\n\n");
  };

  // AI query processing function
  const processQuery = async (query: string, incidents: any[], userLocation: { lat: number; lng: number } | null): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return t('chatbot.geminiError');
    }

    try {
      const incidentData = formatIncidentsForAI(incidents, userLocation);
      const locationContext = userLocation ? 
        `User's current location: ${userLocation.lat}, ${userLocation.lng}` : 
        "User location not available";

      // Get the current language for the AI to respond in
      const currentLanguage = i18n.language;
      let languageInstruction = '';
      switch (currentLanguage) {
        case 'es':
          languageInstruction = 'IMPORTANT: Respond in Spanish. Use natural Spanish language throughout your response.';
          break;
        case 'vi':
          languageInstruction = 'IMPORTANT: Respond in Vietnamese. Use natural Vietnamese language throughout your response.';
          break;
        default:
          languageInstruction = 'IMPORTANT: Respond in English. Use natural English language throughout your response.';
      }

      const systemPrompt = `You are a friendly emergency dispatch assistant helping users query incident data. 

${languageInstruction}

Context:
${locationContext}

Current Incidents Database:
${incidentData}

User Query: "${query}"

IMPORTANT FORMATTING RULES:
- Use natural, conversational language in the specified language
- Format responses with clear spacing and line breaks
- Use emojis sparingly (🚨🔥💥🏥⚠️) only for incident types
- Present incidents in clean, readable format like:
  "🚨 CRIME: Brief description
   📍 Location (0.5 miles away)
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
      return response.text || t('chatbot.couldNotGenerate');

    } catch (error) {
      console.error("Error processing query:", error);
      if (error instanceof Error) {
        return `${t('chatbot.errorProcessingQuery')} ${error.message}`;
      }
      return t('chatbot.unexpectedError');
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t('chatbot.welcomeMessage'),
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastAnnouncedIncidents, setLastAnnouncedIncidents] = useState<string[]>([]);

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

  // Track which locations we're currently monitoring to prevent spam when switching
  const [monitoredLocations, setMonitoredLocations] = useState<Set<string>>(new Set());

  // Monitor for new incidents near pinned location AND user's current location
  useEffect(() => {
    if (!incidents) return;

    // Collect locations to monitor
    const locationsToMonitor: Array<{location: {lat: number; lng: number}, name: string, type: 'pinned' | 'user', key: string}> = [];
    
    // Add pinned location if exists
    if (pinnedLocation) {
      locationsToMonitor.push({
        location: { lat: pinnedLocation.lat, lng: pinnedLocation.lng },
        name: pinnedLocation.name,
        type: 'pinned',
        key: `pinned-${pinnedLocation.lat}-${pinnedLocation.lng}`
      });
    }
    
    // Add user's current location if available
    if (userLocation) {
      locationsToMonitor.push({
        location: { lat: userLocation.lat, lng: userLocation.lng },
        name: 'your current location',
        type: 'user',
        key: `user-${userLocation.lat.toFixed(3)}-${userLocation.lng.toFixed(3)}` // Round to avoid precision issues
      });
    }

    // If no locations to monitor, clear tracking and exit
    if (locationsToMonitor.length === 0) {
      setMonitoredLocations(new Set());
      return;
    }

    // Check for new locations we haven't been monitoring
    const currentLocationKeys = new Set(locationsToMonitor.map(loc => loc.key));
    const newLocationKeys = [...currentLocationKeys].filter(key => !monitoredLocations.has(key));
    
    // Initialize announced incidents for new locations to prevent spam
    if (newLocationKeys.length > 0) {
      const allCurrentIncidents = incidents.map(incident => incident._id);
      setLastAnnouncedIncidents(prev => {
        // Merge existing with all current incidents to prevent false "new" alerts
        const combined = new Set([...prev, ...allCurrentIncidents]);
        return Array.from(combined);
      });
      setMonitoredLocations(currentLocationKeys);
    }

    // Find new incidents near any monitored location (only for locations we were already monitoring)
    const allNewIncidents: Array<{incident: any, distance: number, locationType: 'pinned' | 'user'}> = [];

    locationsToMonitor.forEach(({location, type, key}) => {
      // Only announce for locations we were already monitoring (not newly added ones)
      if (!monitoredLocations.has(key)) return;

      const nearbyIncidents = incidents.filter(incident => {
        const distance = calculateDistance(
          location.lat, 
          location.lng, 
          incident.latitude, 
          incident.longitude
        );
        return distance <= 3; // Within 3 miles
      });

      const newIncidents = nearbyIncidents.filter(incident => 
        !lastAnnouncedIncidents.includes(incident._id)
      );

      newIncidents.forEach(incident => {
        const distance = calculateDistance(
          location.lat, 
          location.lng, 
          incident.latitude, 
          incident.longitude
        );
        
        // Only add if not already in the list (avoid duplicates for overlapping areas)
        if (!allNewIncidents.some(item => item.incident._id === incident._id)) {
          allNewIncidents.push({
            incident,
            distance,
            locationType: type
          });
        }
      });
    });

    if (allNewIncidents.length > 0) {
      // Update announced incidents list
      setLastAnnouncedIncidents(prev => [...prev, ...allNewIncidents.map(item => item.incident._id)]);

      // Announce new incidents
      allNewIncidents.forEach(async ({incident, distance, locationType}) => {
        const cleanIncidentLocation = cleanAddressForAnnouncement(incident.location_name || '');
        
        const locationDescription = locationType === 'pinned' ? t('chatbot.yourPinnedLocation') : t('chatbot.yourCurrentLocation');
        const description = incident.description ? `: ${incident.description}` : '';
        const announcement = `🚨 New incident near ${locationDescription}! ${incident.incident_type.toUpperCase()}${description} at ${cleanIncidentLocation}, ${distance.toFixed(1)} ${t('chatbot.milesAway')}.`;
        
        // Add to chat
        const alertMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: announcement,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, alertMessage]);

        // Speak announcement - ONLY for new incidents
        try {
          await textToSpeech(announcement);
        } catch (error) {
          console.error("Speech error:", error);
        }
      });
    }
  }, [incidents, pinnedLocation, userLocation, lastAnnouncedIncidents, monitoredLocations]);

  // Debounced search when in pin mode
  useEffect(() => {
    if (!isPinMode) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 3) {
        handleAutoSearch(inputValue.trim());
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, isPinMode]);

  // Utility function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };



  // Utility function to clean up address text for announcements
  const cleanAddressForAnnouncement = (address: string): string => {
    if (!address) return 'unknown location';
    
    // Split by comma and take only the first 2-3 meaningful parts
    const parts = address.split(',').map(part => part.trim());
    
    // Filter out long detailed parts (state, country, zip codes, etc.)
    const cleanParts = parts.filter(part => {
      // Skip parts that look like zip codes, countries, or very long detailed addresses
      if (/^\d{5}(-\d{4})?$/.test(part)) return false; // ZIP codes
      if (part.toLowerCase().includes('united states')) return false;
      if (part.toLowerCase().includes('county')) return false;
      if (part.toLowerCase().includes('texas') && parts.length > 3) return false; // Skip state if we have enough info
      return true;
    });
    
    // Take first 2 parts maximum for concise announcement
    return cleanParts.slice(0, 2).join(', ') || parts[0] || 'unknown location';
  };

  // Search for locations using Nominatim API
  const searchLocation = async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "WebSlingerDispatch/1.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  };

  // Handle automatic search suggestions (debounced)
  const handleAutoSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchLocation(query);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error("Auto search error:", error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle location search when user clicks search or presses enter
  const handleLocationSearch = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      const results = await searchLocation(inputValue.trim());
      setSearchResults(results);
      setShowSearchResults(true);
      
      if (results.length > 0) {
        const location = {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon)
        };
        
        // Set pinned location
        setPinnedLocation({
          lat: location.lat,
          lng: location.lng,
          name: results[0].display_name
        });
        
        // Move map to location
        if (onLocationSelect) {
          onLocationSelect(location);
        }
        
        // Generate AI report for this location
        await generateLocationReport(location, results[0].display_name);
        
        setInputValue("");
        setShowSearchResults(false);
        setIsPinMode(false);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = async (result: SearchResult) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    
    setIsLoading(true);
    try {
      // Set pinned location
      setPinnedLocation({
        lat: location.lat,
        lng: location.lng,
        name: result.display_name
      });
      
      // Move map to location
      if (onLocationSelect) {
        onLocationSelect(location);
      }
      
      // Generate AI report for this location
      await generateLocationReport(location, result.display_name);
      
      setInputValue("");
      setShowSearchResults(false);
      setIsPinMode(false);
    } catch (error) {
      console.error("Selection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI report for a specific location
  const generateLocationReport = async (location: { lat: number; lng: number }, locationName: string) => {
    const nearbyIncidents = incidents?.filter(incident => {
      const distance = calculateDistance(location.lat, location.lng, incident.latitude, incident.longitude);
      return distance <= 3; // Within 3 miles
    }) || [];

    // Initialize lastAnnouncedIncidents with all current incidents to prevent them from being announced as "new"
    setLastAnnouncedIncidents(nearbyIncidents.map(incident => incident._id));

    const reportMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `${t('chatbot.locationPinned')} ${locationName}\n\n${nearbyIncidents.length > 0 ? 
        `${nearbyIncidents.length === 1 ? t('chatbot.foundIncidents', { count: nearbyIncidents.length }) : t('chatbot.foundIncidentsPlural', { count: nearbyIncidents.length })}\n\n${
          nearbyIncidents.map((incident, index) => {
            const distance = calculateDistance(location.lat, location.lng, incident.latitude, incident.longitude);
            const timeAgo = getTimeAgo(incident.created_at);
            return `${index + 1}. 🚨 ${incident.incident_type.toUpperCase()}: ${incident.description || t('chatbot.noDescription')}\n   📍 ${incident.location_name || t('chatbot.locationNotSpecified')} (${distance.toFixed(1)} ${t('chatbot.milesAway')})\n   ⏰ ${timeAgo}`;
          }).join('\n\n')
        }` : 
        t('chatbot.noIncidentsInRange')
      }`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, reportMessage]);
    
    // Do NOT speak the report - only show in chat
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // If in pin mode, handle location search instead
    if (isPinMode) {
      await handleLocationSearch();
      return;
    }

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

      // Do NOT speak AI responses - only show in chat
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
      if (isPinMode) {
        // In pin mode, if there are search results, select the first one
        if (showSearchResults && searchResults.length > 0) {
          handleSelectSearchResult(searchResults[0]);
        } else if (inputValue.trim()) {
          // Otherwise perform search
          handleLocationSearch();
        }
      } else {
        // In chat mode, send message
        handleSendMessage();
      }
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
        className="bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 text-white p-3 sm:p-4 rounded-full shadow-lg sv-magenta-glow hover:scale-110 transition-transform duration-200 group"
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
    <div className="bg-black/80 backdrop-blur-md border border-sv-red-900/50 rounded-xl shadow-2xl sv-red-glow w-full max-w-[500px] h-[80vh] max-h-[600px] sm:w-[500px] sm:h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-sv-red-900/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-sv-red-400" />
          <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-sv-red-400 to-sv-magenta-400 text-sm sm:text-base">Incident Query Assistant</h3>
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
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 themed-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] px-3 py-2 rounded-lg text-sm ${
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
              {t('chatbot.analyzing')}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 sm:p-4 border-t border-sv-red-900/50">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isPinMode ? t('chatbot.searchPlaceholder') : t('chatbot.chatPlaceholder')}
              className="w-full bg-black/30 border border-sv-red-900/50 text-white placeholder-sv-red-300/70 px-3 py-2 pr-10 rounded focus:border-sv-red-500 focus:outline-none text-sm"
              disabled={isLoading}
            />
            {/* Loading indicator for search */}
            {isPinMode && isSearching && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="w-3 h-3 border border-sv-red-300/30 border-t-sv-red-300 rounded-full animate-spin"></div>
              </div>
            )}
            
            <button
              onClick={() => {
                setIsPinMode(!isPinMode);
                if (isPinMode) {
                  setSearchResults([]);
                  setShowSearchResults(false);
                  setInputValue("");
                }
              }}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                isPinMode 
                  ? 'text-sv-red-400 bg-sv-red-900/30' 
                  : 'text-sv-red-300 hover:text-sv-red-200 hover:bg-sv-red-900/30'
              }`}
              title={isPinMode ? t('chatbot.switchToChatMode') : t('chatbot.pinLocation')}
            >
              <MapPin className="w-4 h-4" />
            </button>
            
            {/* Search results dropdown */}
            {isPinMode && showSearchResults && searchResults.length > 0 && (
              <div className="absolute bottom-full mb-2 w-full bg-black/90 backdrop-blur-md border border-sv-red-900/50 rounded-lg shadow-xl max-h-60 overflow-y-auto sv-red-glow themed-scrollbar">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id || result.display_name}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-sv-red-900/30 border-b border-sv-red-900/30 last:border-b-0 transition-colors group"
                  >
                    <div className="text-sm text-white font-medium truncate group-hover:text-sv-red-100">
                      {result.display_name.split(",").slice(0, 2).join(",")}
                    </div>
                    <div className="text-xs text-sv-red-300/70 truncate">
                      {result.display_name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={isPinMode ? handleLocationSearch : handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-sv-magenta-500 to-sv-red-500 text-white p-2 rounded hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title={isPinMode ? t('chatbot.searchLocation') : t('chatbot.sendMessage')}
          >
            {isPinMode ? <Search className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        
        {/* Pinned location status */}
        {pinnedLocation && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-sv-red-900/20 border border-sv-red-900/50 rounded text-xs">
            <MapPin className="w-3 h-3 text-sv-red-400" />
            <span className="text-sv-red-200 flex-1 truncate">
              {t('chatbot.monitoring')} {pinnedLocation.name}
            </span>
            <button
              onClick={() => {
                // Don't clear lastAnnouncedIncidents - keep it to prevent spam
                // Just remove the pinned location and reset monitoring state
                setPinnedLocation(null);
                
                // Reset monitored locations to force re-initialization without spam
                setMonitoredLocations(new Set());
                
                // Move map back to user's current location
                if (navigator.geolocation && onLocationSelect) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                      };
                      onLocationSelect(userLocation);
                    },
                    (error) => {
                      console.log("Could not get user location for map reset:", error);
                      // Fallback to default location (UT Arlington)
                      onLocationSelect({ lat: 32.7357, lng: -97.1081 });
                    }
                  );
                } else if (onLocationSelect) {
                  // Fallback to default location if geolocation not available
                  onLocationSelect({ lat: 32.7357, lng: -97.1081 });
                }
              }}
              className="text-sv-red-300 hover:text-sv-red-200 ml-2"
              title={t('chatbot.unpinLocation')}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quick suggestion buttons */}
        <div className="flex flex-wrap gap-1 mt-2 max-h-16 overflow-y-auto">
          {isPinMode ? (
            [
              "Dallas, TX",
              "Arlington, TX", 
              "University of Texas Arlington",
              "Downtown Dallas"
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="text-xs bg-black/30 border border-sv-red-900/50 text-sv-red-200 px-2 py-1 rounded hover:bg-sv-red-900/30 hover:text-sv-red-100 transition-colors"
                disabled={isLoading}
              >
                📍 {suggestion}
              </button>
            ))
          ) : (
            [
              t('chatbot.incidentsNearMe'),
              t('chatbot.recentReports'),
              t('chatbot.activeEmergencies'),
              t('chatbot.fireIncidents')
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="text-xs bg-black/30 border border-sv-red-900/50 text-sv-red-200 px-2 py-1 rounded hover:bg-sv-red-900/30 hover:text-sv-red-100 transition-colors"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
