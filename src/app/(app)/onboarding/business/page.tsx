"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

export default function OnboardingBusinessPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const sessionTokenRef = useRef(generateSessionToken());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Autosave state
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUTOSAVE_KEY = 'onboarding_form_data';

  // Autosave functions
  const saveFormData = () => {
    const formData = {
      businessName,
      reviewLink,
      address,
      selectedPlace: selectedPlace ? {
        id: selectedPlace.id,
        displayName: selectedPlace.displayName,
        formattedAddress: selectedPlace.formattedAddress,
        rating: selectedPlace.rating,
        writeAReviewUri: selectedPlace.writeAReviewUri,
        googleMapsUri: selectedPlace.googleMapsUri,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
      } : null,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
  };

  const loadFormData = () => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const formData = JSON.parse(saved);
        // Only load if data is less than 24 hours old
        if (Date.now() - formData.timestamp < 24 * 60 * 60 * 1000) {
          setBusinessName(formData.businessName || '');
          setReviewLink(formData.reviewLink || '');
          setAddress(formData.address || '');
          if (formData.selectedPlace) {
            setSelectedPlace(formData.selectedPlace);
          }
          return true;
        } else {
          // Clear old data
          localStorage.removeItem(AUTOSAVE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load saved form data:', error);
      localStorage.removeItem(AUTOSAVE_KEY);
    }
    return false;
  };

  const debouncedSave = () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    setIsAutosaving(true);
    autosaveTimerRef.current = setTimeout(() => {
      saveFormData();
      setIsAutosaving(false);
    }, 1000);
  };

  // Load saved form data on mount
  useEffect(() => {
    const hasLoadedData = loadFormData();
    if (hasLoadedData) {
      console.log('📝 Loaded saved form data from previous session');
    }
  }, []);

  // Get selected plan from localStorage or URL params
  useEffect(() => {
    // Check URL params first (for Stripe redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = urlParams.get('plan') as 'starter' | 'pro' | null;
    
    if (planFromUrl) {
      setSelectedPlan(planFromUrl);
    } else {
      // Check localStorage
      const planFromStorage = localStorage.getItem('selectedPlan') as 'starter' | 'pro' | null;
      if (planFromStorage) {
        setSelectedPlan(planFromStorage);
      } else {
        // Default to starter if no plan selected
        setSelectedPlan('starter');
      }
    }
  }, []);

  // Autosave on form field changes
  useEffect(() => {
    debouncedSave();
  }, [businessName, reviewLink, address, selectedPlace]);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

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
    
    // Clear selected place when user edits manually
    if (selectedPlace && value !== selectedPlace.displayName) {
      setSelectedPlace(null);
    }
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const selectPlace = async (suggestion: PlaceSuggestion) => {
    setBusinessName(suggestion.mainText);
    setShowSuggestions(false);
    setSearching(true);

    try {
      // Get place details including review link
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(suggestion.placeId)}&sessionToken=${encodeURIComponent(sessionTokenRef.current)}`
      );

      if (response.ok) {
        const details: PlaceDetails = await response.json();
        setSelectedPlace(details);
        
        // Auto-populate fields
        if (details.writeAReviewUri) {
          setReviewLink(details.writeAReviewUri);
        }
        if (details.formattedAddress) {
          setAddress(details.formattedAddress);
        }

        // Generate new session token for next search
        sessionTokenRef.current = generateSessionToken();
      }
    } catch (err) {
      console.error('Error fetching place details:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Please enter your business name');
      return;
    }

    setLoading(true);

    try {
      // Save business via API
      const response = await fetch('/api/businesses/upsert/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName.trim(),
          review_link: reviewLink.trim() || null,
          address: address.trim() || null,
          google_place_id: selectedPlace?.id || null,
          google_maps_place_uri: selectedPlace?.googleMapsUri || null,
          google_maps_write_review_uri: selectedPlace?.writeAReviewUri || null,
          google_rating: selectedPlace?.rating || null,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to save business');
      }

      // Send welcome email based on selected plan
      if (selectedPlan) {
        try {
          const emailResponse = await fetch('/api/auth/welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: localStorage.getItem('userEmail') || '',
              plan: selectedPlan
            }),
          });
          
          if (emailResponse.ok) {
            console.log(`Welcome email sent for ${selectedPlan} plan`);
          }
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the onboarding if email fails
        }
      }

      // Clear selected plan and form data from localStorage
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem(AUTOSAVE_KEY);

      // Redirect to dashboard
      router.push('/dashboard?from=onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to save business. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Connect your business
          </h1>
          <p className="mt-2 text-gray-600">
            Search for your business on Google to automatically load your review link and details.
          </p>
          <div className="mt-4 flex items-center gap-3">
            {selectedPlan && (
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                {selectedPlan === 'pro' ? '✨ Pro Plan' : '🚀 Starter Plan'} Selected
              </div>
            )}
            {isAutosaving && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl ring-1 ring-black/5 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Selected Place Info */}
          {selectedPlace && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    ✨ Found on Google Places!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {selectedPlace.formattedAddress}
                    {selectedPlace.rating && (
                      <span className="ml-2">⭐ {selectedPlace.rating}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Business Name with Autocomplete */}
          <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Business name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => handleBusinessNameChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Start typing your business name..."
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.placeId}
                    type="button"
                    onClick={() => selectPlace(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {suggestion.mainText}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
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
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          {/* Google Review Link */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Google review link
              <span className="text-gray-500 text-xs ml-2">(auto-filled when you select from dropdown)</span>
            </label>
            <input
              type="url"
              value={reviewLink}
              onChange={(e) => setReviewLink(e.target.value)}
              placeholder="https://search.google.com/local/writereview?..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Start typing your business name above and select it from the dropdown to auto-fill this link
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Address
              <span className="text-gray-500 text-xs ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold shadow-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save and continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
