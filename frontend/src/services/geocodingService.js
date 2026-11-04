/**
 * GeoVision AI - Universal Photon Geocoding Service
 * Powered by Komoot Photon (OpenStreetMap data)
 * Free, keyless, privacy-friendly, fair-use geocoding with map center bias.
 */

const PHOTON_API_URL = 'https://photon.komoot.io/api/';

// In-memory cache for fast responsive typing and to prevent redundant requests
const geocodeCache = new Map();
const MAX_CACHE_SIZE = 100;

/**
 * Determine suitable map zoom level for a geocoded feature based on OSM classification.
 */
export function calculateZoom(properties = {}) {
  const type = (properties.type || '').toLowerCase();
  const osmValue = (properties.osm_value || '').toLowerCase();
  const osmKey = (properties.osm_key || '').toLowerCase();

  if (osmValue === 'country' || type === 'country') return 5;
  if (osmValue === 'state' || type === 'state' || osmValue === 'province') return 7;
  if (osmValue === 'county' || type === 'county' || properties.district) return 9;
  if (osmValue === 'city' || type === 'city') return 12;
  if (osmValue === 'town' || type === 'town' || osmValue === 'suburb') return 13;
  if (
    osmValue === 'village' ||
    osmValue === 'hamlet' ||
    osmValue === 'locality' ||
    osmValue === 'neighbourhood' ||
    type === 'village'
  ) {
    return 14;
  }
  if (
    osmKey === 'natural' ||
    osmValue === 'forest' ||
    osmValue === 'wood' ||
    osmValue === 'nature_reserve' ||
    osmValue === 'water' ||
    osmValue === 'river' ||
    osmValue === 'lake'
  ) {
    return 13;
  }
  if (osmValue === 'quarry' || osmValue === 'mine' || osmValue === 'industrial') return 14;
  if (
    osmKey === 'highway' ||
    osmKey === 'building' ||
    osmKey === 'amenity' ||
    osmValue === 'road' ||
    osmValue === 'street' ||
    osmValue === 'house'
  ) {
    return 15;
  }

  return 13; // balanced default
}

/**
 * Convert Photon extent [minLon, maxLat, maxLon, minLat] into MapLibre bounds:
 * [[minLon, minLat], [maxLon, maxLat]]
 */
export function getBoundsFromExtent(extent) {
  if (!Array.isArray(extent) || extent.length !== 4) return null;
  const [minLon, maxLat, maxLon, minLat] = extent.map(Number);
  if (isNaN(minLon) || isNaN(maxLat) || isNaN(maxLon) || isNaN(minLat)) return null;

  // Ensure Southwest to Northeast order for MapLibre
  const west = Math.min(minLon, maxLon);
  const east = Math.max(minLon, maxLon);
  const south = Math.min(minLat, maxLat);
  const north = Math.max(minLat, maxLat);

  return [
    [west, south],
    [east, north],
  ];
}

/**
 * Pick an intuitive icon for the place type.
 */
function getCategoryIcon(properties = {}) {
  const type = (properties.type || '').toLowerCase();
  const osmValue = (properties.osm_value || '').toLowerCase();
  const osmKey = (properties.osm_key || '').toLowerCase();

  if (osmValue === 'country' || type === 'country') return '🌐';
  if (osmValue === 'state' || osmValue === 'province') return '🏛️';
  if (osmValue === 'city' || type === 'city') return '🏙️';
  if (osmValue === 'town' || type === 'town') return '🏘️';
  if (osmValue === 'village' || osmValue === 'hamlet' || osmValue === 'locality') return '🏡';
  if (
    osmValue === 'forest' ||
    osmValue === 'wood' ||
    osmValue === 'nature_reserve' ||
    osmKey === 'leisure'
  ) {
    return '🌳';
  }
  if (
    osmValue === 'water' ||
    osmValue === 'river' ||
    osmValue === 'lake' ||
    osmValue === 'reservoir' ||
    osmKey === 'waterway'
  ) {
    return '💧';
  }
  if (osmValue === 'quarry' || osmValue === 'mine' || osmValue === 'industrial') return '⛏️';
  if (osmKey === 'highway' || osmValue === 'street' || osmValue === 'road') return '🛣️';
  if (osmKey === 'mountain' || osmValue === 'peak' || osmValue === 'ridge') return '⛰️';
  if (osmKey === 'building' || osmKey === 'amenity') return '📍';

  return '📍';
}

/**
 * Format a human-readable subtitle from available administrative units.
 */
function formatSubtitle(p = {}) {
  const parts = [];
  const districtOrCounty = p.district || p.county || (p.city && p.city !== p.name ? p.city : null);
  if (districtOrCounty && districtOrCounty !== p.name) {
    parts.push(districtOrCounty);
  }
  if (p.state && p.state !== p.name && p.state !== districtOrCounty) {
    parts.push(p.state);
  }
  if (p.country && p.country !== p.name) {
    parts.push(p.country);
  }
  return parts.join(', ');
}

/**
 * Search places using Photon OpenStreetMap API.
 *
 * @param {string} query Search input string
 * @param {Object} options
 * @param {number} [options.limit=6] Number of suggestions (max 5-7)
 * @param {number} [options.lat] Map center latitude for proximity bias
 * @param {number} [options.lon] Map center longitude for proximity bias
 * @param {AbortSignal} [options.signal] AbortSignal for canceling outdated requests
 * @returns {Promise<Array<Object>>} Normalized place suggestions
 */
export async function searchPlaces(query, options = {}) {
  const q = (query || '').trim();
  if (q.length < 2) {
    return [];
  }

  const limit = options.limit || 6;
  const lat = options.lat != null && !isNaN(options.lat) ? Number(options.lat) : null;
  const lon = options.lon != null && !isNaN(options.lon) ? Number(options.lon) : null;

  // Build cache key
  const cacheKey = `${q.toLowerCase()}_${limit}_${lat ? lat.toFixed(2) : ''}_${lon ? lon.toFixed(2) : ''}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    q,
    limit: String(limit),
  });

  // Photon proximity location bias
  if (lat != null && lon != null) {
    params.set('lat', lat.toFixed(4));
    params.set('lon', lon.toFixed(4));
  }

  const url = `${PHOTON_API_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal: options.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Geocoding HTTP error ${res.status}`);
    }

    const data = await res.json();
    const features = data?.features || [];

    const normalized = features
      .filter((f) => f && f.geometry && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length >= 2)
      .map((f, idx) => {
        const coords = f.geometry.coordinates; // [lng, lat]
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        const p = f.properties || {};

        const name = p.name || p.city || p.street || 'Unnamed Location';
        const subtitle = formatSubtitle(p);
        const icon = getCategoryIcon(p);
        const zoom = calculateZoom(p);
        const bounds = getBoundsFromExtent(p.extent);

        return {
          id: `${p.osm_type || 'F'}_${p.osm_id || idx}_${lat}_${lng}`,
          name,
          subtitle,
          icon,
          coordinates: [lng, lat],
          lng,
          lat,
          type: p.type || p.osm_value || 'place',
          district: p.district || p.county || '',
          state: p.state || '',
          country: p.country || '',
          postcode: p.postcode || '',
          extent: p.extent || null,
          bounds,
          zoom,
          raw: f,
        };
      });

    // Save in cache (manage cache size)
    if (geocodeCache.size >= MAX_CACHE_SIZE) {
      const firstKey = geocodeCache.keys().next().value;
      geocodeCache.delete(firstKey);
    }
    geocodeCache.set(cacheKey, normalized);

    return normalized;
  } catch (err) {
    if (err.name === 'AbortError') {
      return null; // Signals request was superseded
    }
    console.warn('Photon geocoding error:', err.message);
    throw err;
  }
}
