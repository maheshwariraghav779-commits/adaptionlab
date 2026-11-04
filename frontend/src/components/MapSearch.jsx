import { useState, useEffect, useRef, useCallback } from 'react';
import { Marker, Popup } from 'maplibre-gl';
import { searchPlaces } from '../services/geocodingService';

/**
 * Helper to escape HTML special characters for safe popup rendering.
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extract an actual MapLibre map instance from a ref, object, or function.
 */
function resolveMapInstance(mapTarget) {
  if (!mapTarget) return null;
  if (typeof mapTarget === 'function') {
    return mapTarget();
  }
  if (mapTarget.current) {
    return mapTarget.current;
  }
  if (typeof mapTarget.getCenter === 'function') {
    return mapTarget;
  }
  return null;
}

/**
 * Reusable Universal Map Search Component for GeoVision AI.
 *
 * Supports:
 * - Search-as-you-type autocomplete with 450ms debounce
 * - Photon OpenStreetMap keyless API with proximity bias from map center
 * - AbortController cancellation for fast typing
 * - Arrow navigation, Enter selection, Escape to dismiss
 * - Dynamic zoom & geographic extent (bounds) fitting
 * - Marker placement with place name popup
 * - Mobile-responsive layout and dark/navy aesthetic
 */
export default function MapSearch({
  map = null,
  secondaryMap = null,
  onSelectLocation = null,
  placeholder = 'Search cities, forests, mining areas, landmarks...',
  className = '',
  position = 'top-left', // 'top-left' | 'top-right' | 'relative'
  showMarker = true,
  syncMap = true,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchError, setSearchError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const activeMarkersRef = useRef([]);

  // Clear existing search markers from map(s)
  const clearMarkers = useCallback(() => {
    if (activeMarkersRef.current && activeMarkersRef.current.length > 0) {
      activeMarkersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch (_) {}
      });
      activeMarkersRef.current = [];
    }
  }, []);

  // Clean up markers on component unmount
  useEffect(() => {
    return () => {
      clearMarkers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [clearMarkers]);

  // Click outside listener to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Perform search with debounce and abort controller
  const performSearch = useCallback(
    (searchQuery) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        setSearchError(null);
        return;
      }

      setIsLoading(true);
      setSearchError(null);

      debounceTimerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Get map center for Photon proximity bias if map instance is ready
        let centerBias = {};
        const mapInst = resolveMapInstance(map);
        if (mapInst && typeof mapInst.getCenter === 'function') {
          try {
            const center = mapInst.getCenter();
            if (center && !isNaN(center.lat) && !isNaN(center.lng)) {
              centerBias = { lat: center.lat, lon: center.lng };
            }
          } catch (_) {}
        }

        try {
          const places = await searchPlaces(trimmed, {
            limit: 6,
            signal: controller.signal,
            ...centerBias,
          });

          // If aborted or null returned, ignore
          if (places === null) return;

          setResults(places);
          setIsOpen(true);
          setActiveIndex(-1);
          setIsLoading(false);
        } catch (err) {
          if (err.name !== 'AbortError') {
            setSearchError('Search service temporarily unavailable');
            setIsLoading(false);
            setIsOpen(true);
          }
        }
      }, 450);
    },
    [map]
  );

  // Handle Input typing
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    performSearch(val);
  };

  // Add search marker to a specific map instance
  const addMarkerToMap = useCallback((mapInst, place) => {
    if (!mapInst || !place) return null;

    const el = document.createElement('div');
    el.className = 'geovision-search-marker';
    el.style.cssText = 'pointer-events:auto;cursor:pointer;user-select:none;';
    el.innerHTML = `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
        <div style="background:#0284c7;color:#ffffff;font-weight:700;font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #38bdf8;white-space:nowrap;margin-bottom:3px;max-width:200px;overflow:hidden;text-overflow:ellipsis;">
          📍 ${escapeHtml(place.name)}
        </div>
        <div style="width:26px;height:26px;background:#0284c7;border:2.5px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
          <div style="width:8px;height:8px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div>
        </div>
      </div>
    `;

    const popupHtml = `
      <div style="font-family:inherit;padding:2px;max-width:220px;color:#0f172a;">
        <div style="font-weight:700;font-size:13px;color:#0284c7;display:flex;align-items:center;gap:4px;">
          <span>${place.icon || '📍'}</span>
          <span>${escapeHtml(place.name)}</span>
        </div>
        ${place.subtitle ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${escapeHtml(place.subtitle)}</div>` : ''}
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid #e2e8f0;font-size:10px;font-family:monospace;color:#475569;">
          Lat: ${place.lat.toFixed(4)}°, Lng: ${place.lng.toFixed(4)}°
        </div>
      </div>
    `;

    const popup = new Popup({
      offset: [0, -28],
      closeButton: true,
      className: 'geovision-maplibre-popup',
    }).setHTML(popupHtml);

    const marker = new Marker({ element: el })
      .setLngLat([place.lng, place.lat])
      .setPopup(popup)
      .addTo(mapInst);

    return marker;
  }, []);

  // Handle location selection
  const handleSelectLocation = useCallback(
    (place) => {
      if (!place) return;

      setSelectedPlace(place);
      setQuery(place.name);
      setIsOpen(false);
      setActiveIndex(-1);

      // Clean up previous search markers
      clearMarkers();

      const mapInst = resolveMapInstance(map);
      const secondaryInst = resolveMapInstance(secondaryMap);

      if (syncMap && mapInst) {
        try {
          // If bounding box extent exists and is valid, fitBounds to reveal region
          if (place.bounds && Array.isArray(place.bounds) && place.bounds.length === 2) {
            mapInst.fitBounds(place.bounds, {
              padding: { top: 60, bottom: 60, left: 60, right: 60 },
              maxZoom: 16,
              duration: 1400,
              essential: true,
            });
          } else {
            // Otherwise flyTo coordinates at suitable zoom level
            mapInst.flyTo({
              center: [place.lng, place.lat],
              zoom: place.zoom || 13,
              duration: 1400,
              essential: true,
            });
          }

          // If secondary map exists (e.g., in ComparisonSwipeMap), synchronize secondary camera
          if (secondaryInst) {
            try {
              if (place.bounds && Array.isArray(place.bounds) && place.bounds.length === 2) {
                secondaryInst.fitBounds(place.bounds, {
                  padding: { top: 60, bottom: 60, left: 60, right: 60 },
                  maxZoom: 16,
                  duration: 1400,
                  essential: true,
                });
              } else {
                secondaryInst.flyTo({
                  center: [place.lng, place.lat],
                  zoom: place.zoom || 13,
                  duration: 1400,
                  essential: true,
                });
              }
            } catch (_) {}
          }

          // Place search marker
          if (showMarker) {
            const m1 = addMarkerToMap(mapInst, place);
            if (m1) activeMarkersRef.current.push(m1);

            if (secondaryInst) {
              const m2 = addMarkerToMap(secondaryInst, place);
              if (m2) activeMarkersRef.current.push(m2);
            }
          }
        } catch (err) {
          console.warn('Map navigation error during search selection:', err);
        }
      }

      // Trigger custom callback for host module
      if (typeof onSelectLocation === 'function') {
        onSelectLocation(place);
      }
    },
    [map, secondaryMap, syncMap, showMarker, addMarkerToMap, clearMarkers, onSelectLocation]
  );

  // Clear query and search state
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedPlace(null);
    setSearchError(null);
    clearMarkers();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelectLocation(results[activeIndex]);
      } else if (results.length > 0) {
        handleSelectLocation(results[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Positioning class resolver
  const positionClasses =
    position === 'top-left'
      ? 'absolute top-3 left-3 z-20'
      : position === 'top-right'
      ? 'absolute top-3 right-3 z-20'
      : position === 'relative'
      ? 'relative z-20'
      : 'absolute top-3 left-3 z-20';

  return (
    <div
      ref={containerRef}
      className={`${positionClasses} w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2.5rem)] text-left ${className}`}
    >
      {/* Search Input Box */}
      <div className="relative flex items-center bg-surface-900/95 backdrop-blur-md rounded-xl border border-surface-700/80 shadow-2xl transition-all hover:border-surface-600 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
        <span className="absolute left-3 text-gray-400 pointer-events-none text-xs sm:text-sm">
          🔍
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || searchError) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          aria-label="Map location search"
          autoComplete="off"
          spellCheck="false"
          className="w-full bg-transparent py-2.5 pl-9 pr-8 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none"
        />

        {/* Clear or Loading Icon */}
        <div className="absolute right-2.5 flex items-center">
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></span>
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              title="Clear search"
              className="text-gray-400 hover:text-white text-xs p-1 rounded-full transition-colors"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-surface-900/98 backdrop-blur-xl border border-surface-700/90 rounded-xl shadow-2xl overflow-hidden z-50 text-xs sm:text-sm text-white">
          {searchError ? (
            <div className="p-3 text-amber-300 text-xs flex items-center gap-2 bg-amber-950/30">
              <span>⚠️</span>
              <span>{searchError}</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-400">
              No matching locations found for <strong className="text-gray-200">"{query}"</strong>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-surface-800">
              {results.map((place, idx) => {
                const isSelected = activeIndex === idx;
                return (
                  <li
                    key={place.id || idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelectLocation(place)}
                    className={`px-3 py-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-600/30 text-white'
                        : 'text-gray-200 hover:bg-surface-800'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{place.icon || '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-white truncate text-xs sm:text-sm">
                          {place.name}
                        </span>
                        {place.type && (
                          <span className="text-[10px] text-gray-400 font-mono uppercase bg-surface-800 px-1.5 py-0.2 rounded shrink-0">
                            {place.type}
                          </span>
                        )}
                      </div>
                      {place.subtitle && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {place.subtitle}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Attribution and Keyboard hint footer */}
          <div className="px-3 py-1.5 bg-surface-950/80 border-t border-surface-800 flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span>OSM Photon</span>
              <span>&bull;</span>
              <span>&copy; OpenStreetMap</span>
            </span>
            <span className="hidden sm:inline text-gray-500">
              &uarr;&darr; navigate &bull; Enter select &bull; Esc close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
