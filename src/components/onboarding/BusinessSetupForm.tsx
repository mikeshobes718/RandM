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
  
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const sessionTokenRef = useRef(generateSessionToken());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    setError('');
    
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
      const idToken = localStorage.getItem('idToken') || '';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
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
          idToken,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.business) {
          localStorage.setItem('businessData', JSON.stringify(data.business));
        }
        document.cookie = 'onboarding_complete=1; path=/; max-age=3600; samesite=lax';                                                                          
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/dashboard?from=onboarding&t=' + Date.now();
        }
      } else {
        const errorText = await response.text().catch(() => 'Failed to save');
        if (response.status === 401) {
          setError('Session expired. Please refresh.');
        } else {
          setError(errorText || `Error: ${response.status}`);
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save business.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {selectedPlace && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900">Connected to Google</p>
              <p className="text-xs text-emerald-700 truncate mt-0.5">
                {selectedPlace.formattedAddress} {selectedPlace.rating && ` • ⭐ ${selectedPlace.rating}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div ref={wrapperRef} className="relative">
        <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
          Business name
        </label>
        <div className="relative">
          <input
            value={businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            required
            className={inputClass}
            placeholder="Search for your business..."
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-xl overflow-hidden py-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.placeId}
                type="button"
                onClick={() => selectPlace(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border/50 last:border-b-0"
              >
                <div className="text-sm font-semibold text-foreground">{suggestion.mainText}</div>
                <div className="text-xs text-muted truncate">{suggestion.secondaryText}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-muted uppercase tracking-wider">
          Review link <span className="font-normal lowercase">(auto-filled)</span>
        </label>
        <input
          value={reviewLink}
          onChange={(e) => setReviewLink(e.target.value)}
          className={inputClass}
          placeholder="https://search.google.com/local/writereview?..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="primary-button w-full h-12"
      >
        {loading ? 'Saving...' : 'Save and continue'}
      </button>

      <p className="text-[10px] text-center text-muted">
        Tip: Selecting your business from the dropdown auto-fills the review link.
      </p>
    </form>
  );
}
