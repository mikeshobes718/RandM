"use client";
import { useState, useEffect, useRef, FormEvent } from 'react';

type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type PlaceDetails = {
  id: string;
  displayName?: string;
  formattedAddress?: string;
  rating?: number;
  writeAReviewUri?: string;
  googleMapsUri?: string;
  lat?: number;
  lng?: number;
};

function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export default function BusinessSetupForm({ onSuccess }: { onSuccess?: () => void }) {
  const [businessName, setBusinessName] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const sessionTokenRef = useRef(generateSessionToken());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          sessionToken: sessionTokenRef.current,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.items || []);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    setError(''); // Clear error when user types
    
    if (selectedPlace && value !== selectedPlace.displayName) {
      setSelectedPlace(null);
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const selectPlace = async (suggestion: PlaceSuggestion) => {
    setBusinessName(suggestion.mainText);
    setShowSuggestions(false);
    setSearching(true);

    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(suggestion.placeId)}&sessionToken=${encodeURIComponent(sessionTokenRef.current)}`
      );

      if (response.ok) {
        const details: PlaceDetails = await response.json();
        setSelectedPlace(details);
        
        if (details.writeAReviewUri) {
          setReviewLink(details.writeAReviewUri);
        }

        sessionTokenRef.current = generateSessionToken();
      }
    } catch (err) {
      console.error('Error fetching place details:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Please enter your business name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get auth token from localStorage
      const idToken = localStorage.getItem('idToken') || '';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if we have a token
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch('/api/businesses/upsert/form', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: businessName.trim(),
          review_link: reviewLink.trim() || null,
          google_place_id: selectedPlace?.id || null,
          google_maps_place_uri: selectedPlace?.googleMapsUri || null,
          google_maps_write_review_uri: selectedPlace?.writeAReviewUri || null,
          google_rating: selectedPlace?.rating || null,
          idToken, // Also send in body as fallback
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store the business data in localStorage for immediate use by dashboard
        if (data.business) {
          localStorage.setItem('business', JSON.stringify(data.business));
        }
        
        // Set onboarding_complete cookie so dashboard knows to poll
        document.cookie = 'onboarding_complete=1; path=/; max-age=3600; samesite=lax';                                                                          
        
        // Wait a bit for the database to commit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect with from=onboarding parameter to trigger polling
        window.location.href = '/dashboard?from=onboarding&t=' + Date.now();
      } else {
        const errorText = await response.text().catch(() => 'Failed to save');
        
        // If unauthorized, try to refresh the session
        if (response.status === 401) {
          setError('Session expired. Please refresh the page and try again.');
        } else {
          setError(errorText || `Error: ${response.status}`);
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-inner">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Selected Place Success Banner */}
      {selectedPlace && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs font-medium text-green-900">✨ Found on Google!</p>
              <p className="text-xs text-green-700">
                {selectedPlace.formattedAddress}
                {selectedPlace.rating && ` • ⭐ ${selectedPlace.rating}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Business Name with Autocomplete */}
      <div ref={wrapperRef} className="relative">
        <label className="block text-sm font-medium text-slate-700">
          Business name
          <input
            value={businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            required
            className="mt-2 w-full rounded-xl border border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Start typing your business name..."
          />
        </label>
        
        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.placeId}
                type="button"
                onClick={() => selectPlace(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.mainText}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {suggestion.secondaryText}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Searching indicator */}
        {searching && (
          <div className="absolute right-3 top-9 text-gray-400">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {/* Google Review Link */}
      <label className="block text-sm font-medium text-slate-700">
        Google review link <span className="font-normal text-slate-400">(auto-filled)</span>
        <input
          value={reviewLink}
          onChange={(e) => setReviewLink(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200/80 px-3 py-2 text-sm shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="https://search.google.com/local/writereview?..."
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900/95 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving…
          </>
        ) : (
          'Save and continue'
        )}
      </button>

      <p className="text-xs text-center text-slate-500">
        💡 Start typing to see Google Places suggestions
      </p>
    </form>
  );
}
