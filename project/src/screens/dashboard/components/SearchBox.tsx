import { Search } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  importance: number;
}

interface SearchBoxProps {
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export const SearchBox = ({ onLocationSelect }: SearchBoxProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchLocation = useCallback(async (query: string): Promise<SearchResult[]> => {
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
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);

      try {
        const results = await searchLocation(query);
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    },
    [searchLocation],
  );

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      const location = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };

      onLocationSelect?.(location);
      setSearchQuery("");
      setShowResults(false);
    },
    [onLocationSelect],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectResult(searchResults[0]);
      }
    },
    [handleSelectResult, searchResults],
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-2">
      <div className="relative">
        {/* Search Results - Above the search bar */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute bottom-full mb-2 w-full bg-black/90 backdrop-blur-md border border-sv-red-900/50 rounded-lg shadow-xl max-h-60 overflow-y-auto sv-red-glow">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-sv-red-900/30 border-b border-sv-red-900/30 last:border-b-0 transition-colors group"
              >
                <div className="text-sm text-white font-medium truncate group-hover:text-sv-red-100">
                  {result.display_name.split(",").slice(0, 2).join(",")}
                </div>

                <div className="text-xs text-sv-red-300/70 truncate">{result.display_name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-sv-red-300" />

            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={t("searchLocation")}
              className="w-full px-5 py-3 bg-black/80 backdrop-blur-md border border-sv-red-900/50 rounded-full text-white placeholder-sv-red-300/70 focus:outline-none focus:border-sv-red-500 focus:ring-2 focus:ring-sv-red-500/20 sv-red-glow"
            />

            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-sv-red-300/30 border-t-sv-red-300 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
