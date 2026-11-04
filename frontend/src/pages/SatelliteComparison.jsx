import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiPost, getHealthStatus, downloadSatelliteComparisonPdf } from '../api/client';
import ComparisonSwipeMap from '../components/ComparisonSwipeMap';
import { createCircularPolygon } from '../utils/geometry';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts';

// Curated Preset AOIs across India
const COMPARISON_PRESETS = [
  {
    name: 'Mulshi Watershed & Western Ghats Canopy (Maharashtra)',
    desc: 'Dense deciduous forest canopy and riparian reservoir catchment',
    coords: [
      [73.48, 18.48],
      [73.56, 18.48],
      [73.56, 18.55],
      [73.48, 18.55],
      [73.48, 18.48],
    ],
  },
  {
    name: 'Pune West Urban Expansion Corridor (Maharashtra)',
    desc: 'Hinjawadi / Baner suburban fringe with bare-soil conversion',
    coords: [
      [73.74, 18.50],
      [73.82, 18.50],
      [73.82, 18.57],
      [73.74, 18.57],
      [73.74, 18.50],
    ],
  },
  {
    name: 'Khadakwasla Basin & Mutha Shoreline (Maharashtra)',
    desc: 'Reservoir shoreline, water fluctuation, and riparian buffer',
    coords: [
      [73.72, 18.41],
      [73.80, 18.41],
      [73.80, 18.47],
      [73.72, 18.47],
      [73.72, 18.41],
    ],
  },
  {
    name: 'Singrauli Open-Cast Mining & Bare Surface (MP/UP)',
    desc: 'Large surface disturbance and industrial extraction basin',
    coords: [
      [82.60, 24.15],
      [82.70, 24.15],
      [82.70, 24.23],
      [82.60, 24.23],
      [82.60, 24.15],
    ],
  },
  {
    name: 'Sundarbans Mangrove Delta & Tidal Channels (West Bengal)',
    desc: 'Estuarine tidal waterways and dynamic coastal mangrove canopy',
    coords: [
      [88.80, 21.85],
      [88.92, 21.85],
      [88.92, 21.95],
      [88.80, 21.95],
      [88.80, 21.85],
    ],
  },
];

export default function SatelliteComparison() {
  // ── Form State ─────────────────────────────────────────────────────────
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [regionName, setRegionName] = useState(COMPARISON_PRESETS[0].name);

  // Geometry
  const [aoiMode, setAoiMode] = useState('preset'); // 'preset' | 'point_radius'
  const [centerLat, setCenterLat] = useState('18.5204');
  const [centerLng, setCenterLng] = useState('73.8567');
  const [radiusKm, setRadiusKm] = useState('5.0');

  // Dates
  const [beforeStart, setBeforeStart] = useState('2023-01-01');
  const [beforeEnd, setBeforeEnd] = useState('2023-04-30');
  const [afterStart, setAfterStart] = useState('2025-01-01');
  const [afterEnd, setAfterEnd] = useState('2025-04-30');

  // Cloud Filter & Options
  const [cloudThreshold, setCloudThreshold] = useState(60);
  const [forceDemo, setForceDemo] = useState(false);

  // ── Active Map Layer Display ───────────────────────────────────────────
  const [activeLayerMode, setActiveLayerMode] = useState('rgb'); // 'rgb' | 'cir' | 'delta_ndvi' | 'delta_ndwi'

  // ── Execution State ────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [geeHealthy, setGeeHealthy] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState(null);

  // Prevent stale async responses
  const activeRequestIdRef = useRef(0);

  // Check GEE Health on Mount
  useEffect(() => {
    getHealthStatus().then((res) => {
      if (res && res.data) {
        setGeeHealthy(res.data.gee_available !== false);
      }
    });
  }, []);

  // Compute Current Geometry payload (recalculates whenever coordinates or radius change)
  const lastValidCircleRef = useRef(createCircularPolygon(18.5204, 73.8567, 5.0));

  const getCurrentGeometry = useCallback(() => {
    if (aoiMode === 'point_radius') {
      const lat = parseFloat(centerLat);
      const lng = parseFloat(centerLng);
      const r = parseFloat(radiusKm);
      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        !isNaN(r) &&
        r >= 0.1 &&
        r <= 50 &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        const circleGeom = createCircularPolygon(lat, lng, r);
        lastValidCircleRef.current = circleGeom;
        return circleGeom;
      }
      return lastValidCircleRef.current;
    }
    // Preset Polygon
    const preset = COMPARISON_PRESETS[selectedPresetIndex] || COMPARISON_PRESETS[0];
    return {
      type: 'Polygon',
      coordinates: [preset.coords],
    };
  }, [aoiMode, selectedPresetIndex, centerLat, centerLng, radiusKm]);

  const activeGeometry = useMemo(() => getCurrentGeometry(), [getCurrentGeometry]);

  // Map Click Repositioning
  const handleMapClick = useCallback((lat, lng) => {
    if (aoiMode === 'point_radius') {
      setCenterLat(lat.toFixed(4));
      setCenterLng(lng.toFixed(4));
    }
  }, [aoiMode]);

  // Handle Universal MapSearch location selection
  const [searchedNotice, setSearchedNotice] = useState(null);

  const handleSearchLocationSelect = useCallback(
    (place) => {
      if (!place) return;
      const latStr = place.lat.toFixed(4);
      const lngStr = place.lng.toFixed(4);

      if (aoiMode === 'point_radius') {
        setCenterLat(latStr);
        setCenterLng(lngStr);
        setRegionName(place.name);
        setSearchedNotice(null);
      } else {
        setSearchedNotice({
          name: place.name,
          lat: latStr,
          lng: lngStr,
        });
      }
    },
    [aoiMode]
  );

  // Real-time Coordinate Validation Helper
  const getCoordinatesError = () => {
    if (aoiMode !== 'point_radius') return null;
    const lat = parseFloat(centerLat);
    const lng = parseFloat(centerLng);
    const r = parseFloat(radiusKm);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'Latitude must be a valid number between -90 and 90.';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return 'Longitude must be a valid number between -180 and 180.';
    }
    if (isNaN(r) || r < 0.1 || r > 50) {
      return 'Radius must be between 0.1 km and 50 km.';
    }
    return null;
  };

  const coordError = getCoordinatesError();

  // Client-Side Form Validation
  const validateInputs = () => {
    setValidationError('');

    if (aoiMode === 'point_radius') {
      const err = getCoordinatesError();
      if (err) {
        setValidationError(err);
        return false;
      }
    }

    if (!beforeStart || !beforeEnd || !afterStart || !afterEnd) {
      setValidationError('All observation start and end dates must be provided.');
      return false;
    }

    const bS = new Date(beforeStart);
    const bE = new Date(beforeEnd);
    const aS = new Date(afterStart);
    const aE = new Date(afterEnd);
    const now = new Date();

    if (isNaN(bS.getTime()) || isNaN(bE.getTime()) || isNaN(aS.getTime()) || isNaN(aE.getTime())) {
      setValidationError('Invalid date format. Please use YYYY-MM-DD.');
      return false;
    }

    if (bS > now || bE > now || aS > now || aE > now) {
      setValidationError('Observation dates cannot be in the future.');
      return false;
    }

    if (bS >= bE) {
      setValidationError('Before-period start date must be strictly earlier than before-period end date.');
      return false;
    }

    if (aS >= aE) {
      setValidationError('After-period start date must be strictly earlier than after-period end date.');
      return false;
    }

    if (bS >= aS) {
      setValidationError('Before period start date must precede after period start date for chronological comparison.');
      return false;
    }

    return true;
  };

  // ── Execute Comparison Request ─────────────────────────────────────────
  const isExecutingRef = useRef(false);
  const handleRunComparison = async () => {
    if (!validateInputs()) return;
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsLoading(true);
    setValidationError('');

    const parsedLat = parseFloat(centerLat);
    const parsedLng = parseFloat(centerLng);
    const parsedR = parseFloat(radiusKm);
    const pointTitle = `Point AOI (${isNaN(parsedLat) ? centerLat : parsedLat.toFixed(4)}°N, ${isNaN(parsedLng) ? centerLng : parsedLng.toFixed(4)}°E, r=${isNaN(parsedR) ? radiusKm : parsedR}km)`;

    const payload = {
      geometry: getCurrentGeometry(),
      region_name: aoiMode === 'preset' ? COMPARISON_PRESETS[selectedPresetIndex].name : pointTitle,
      before_start_date: beforeStart,
      before_end_date: beforeEnd,
      after_start_date: afterStart,
      after_end_date: afterEnd,
      cloud_threshold: cloudThreshold,
      demo: forceDemo,
    };

    try {
      console.log('[SatelliteComparison] Requesting GEE analysis:', payload);
      const res = await apiPost('/satellite-comparison/analyze', payload);

      if (res.error) {
        console.error('[SatelliteComparison] API error:', res.error);
        setValidationError(res.error);
      } else if (res.data) {
        console.log('[SatelliteComparison] GEE data received successfully:', res.data.status, res.data.imagery_layers);
        setComparisonData(res.data);
        if (res.data.status === 'unavailable_imagery') {
          setValidationError(res.data.message || 'No usable satellite scenes found for the requested period.');
        }
      }
    } catch (err) {
      console.error('[SatelliteComparison] Fetch failed:', err);
      setValidationError(err.message || 'Failed to execute satellite comparison.');
    } finally {
      isExecutingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleDownloadComparisonPdf = async () => {
    if (!comparisonData) return;
    setIsDownloadingPdf(true);
    setPdfMessage('Compiling verified Satellite Comparison PDF audit report...');
    try {
      await downloadSatelliteComparisonPdf(comparisonData);
      setPdfMessage('Comparison audit PDF downloaded successfully!');
      setTimeout(() => setPdfMessage(null), 4000);
    } catch (err) {
      setPdfMessage(`PDF download failed: ${err.message}`);
      setTimeout(() => setPdfMessage(null), 5000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Run automatically on first mount with default preset
  useEffect(() => {
    handleRunComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update preset
  const handleSelectPreset = (idx) => {
    setSelectedPresetIndex(idx);
    setRegionName(COMPARISON_PRESETS[idx].name);
  };

  // Resolved Tile URLs based on activeLayerMode with transparent error handling
  const getActiveTileUrls = () => {
    if (!comparisonData || !comparisonData.imagery_layers) {
      return { before: '', after: '', missingNotice: null };
    }
    const layers = comparisonData.imagery_layers;
    switch (activeLayerMode) {
      case 'cir':
        if (!layers.before_cir || !layers.after_cir) {
          return {
            before: layers.before_cir || '',
            after: layers.after_cir || '',
            missingNotice: 'False Color Infrared (CIR) tiles could not be generated for one or both periods.',
          };
        }
        return { before: layers.before_cir, after: layers.after_cir, missingNotice: null };
      case 'delta_ndvi':
        if (!layers.delta_ndvi) {
          return {
            before: layers.before_rgb || '',
            after: '',
            missingNotice: 'ΔNDVI vegetation decline differential layer is not available.',
          };
        }
        return { before: layers.before_rgb, after: layers.delta_ndvi, missingNotice: null };
      case 'delta_ndwi':
        if (!layers.delta_ndwi) {
          return {
            before: layers.before_rgb || '',
            after: '',
            missingNotice: 'ΔNDWI water fluctuation differential layer is not available.',
          };
        }
        return { before: layers.before_rgb, after: layers.delta_ndwi, missingNotice: null };
      case 'rgb':
      default:
        if (!layers.before_rgb || !layers.after_rgb) {
          return {
            before: layers.before_rgb || '',
            after: layers.after_rgb || '',
            missingNotice: comparisonData.is_demo ? null : 'Natural Color (RGB) satellite tiles could not be generated for this interval.',
          };
        }
        return { before: layers.before_rgb, after: layers.after_rgb, missingNotice: null };
    }
  };

  const { before: beforeTile, after: afterTile, missingNotice } = getActiveTileUrls();

  // Chart Data preparation
  const getChartData = () => {
    if (!comparisonData || !comparisonData.ndvi_metrics || !comparisonData.ndwi_metrics) return [];
    const ndvi = comparisonData.ndvi_metrics;
    const ndwi = comparisonData.ndwi_metrics;
    const items = [
      {
        indicator: 'NDVI (Canopy Vigor)',
        before: ndvi.before_mean,
        after: ndvi.after_mean,
        delta: ndvi.delta_mean,
      },
      {
        indicator: 'NDWI (Water/Moisture)',
        before: ndwi.before_mean,
        after: ndwi.after_mean,
        delta: ndwi.delta_mean,
      },
    ];
    if (comparisonData.ndbi_metrics) {
      items.push({
        indicator: 'NDBI (Built-up/Bare)',
        before: comparisonData.ndbi_metrics.before_mean,
        after: comparisonData.ndbi_metrics.after_mean,
        delta: comparisonData.ndbi_metrics.delta_mean,
      });
    }
    return items;
  };

  const chartData = getChartData();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-[#0F172A]">
      {/* ── 1. Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-700/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛰️</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Satellite Comparison
            </h1>
            {comparisonData && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  comparisonData.is_live
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                    : 'bg-amber-950/80 text-amber-400 border-amber-700'
                }`}
              >
                {comparisonData.is_live ? '● LIVE GEE SATELLITE' : 'DEMO CALIBRATION'}
              </span>
            )}
          </div>
          <p className="text-sm text-[#475569] mt-2 max-w-3xl">
            Interactive multi-temporal Sentinel-2 Earth Engine comparison. Examine surface transformations
            with an interactive swipe map and verified physical change metrics computed strictly on common valid pixels.
          </p>
        </div>

        {/* Live Status Summary Pill */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-surface-900 border border-surface-700 px-3.5 py-2 rounded-xl text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${geeHealthy ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
          <span className="text-gray-400">Earth Engine:</span>
          <span className="font-semibold text-white">{geeHealthy ? 'Connected (Level-2A)' : 'Offline / Mock'}</span>
        </div>
      </div>

      {/* ── 2. AOI and Date Range Configuration Controls ──────────────── */}
      <div className="bg-surface-800/80 border border-surface-700 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-700/60 pb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span>🎯</span> Area of Interest & Observation Windows
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setAoiMode('preset')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                aoiMode === 'preset' ? 'bg-brand-600 text-white' : 'bg-surface-700 text-gray-300 hover:bg-surface-600'
              }`}
            >
              Preset Catalog
            </button>
            <button
              onClick={() => setAoiMode('point_radius')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                aoiMode === 'point_radius' ? 'bg-brand-600 text-white' : 'bg-surface-700 text-gray-300 hover:bg-surface-600'
              }`}
            >
              Point & Radius
            </button>
          </div>
        </div>

        {/* AOI Selectors */}
        {aoiMode === 'preset' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Select Preset Environmental Zone:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {COMPARISON_PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs ${
                    selectedPresetIndex === idx
                      ? 'bg-brand-950/60 border-brand-500 text-white shadow-md ring-1 ring-brand-500/50'
                      : 'bg-surface-900 border-surface-700 text-gray-300 hover:bg-surface-700 hover:text-white'
                  }`}
                >
                  <p className="font-semibold text-white truncate">{preset.name.split(' (')[0]}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-surface-900 p-4 rounded-xl border border-surface-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Center Latitude (°N):</label>
                <input
                  type="number"
                  step="0.0001"
                  min="-90"
                  max="90"
                  value={centerLat}
                  onChange={(e) => setCenterLat(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder="e.g. 18.5204"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Center Longitude (°E):</label>
                <input
                  type="number"
                  step="0.0001"
                  min="-180"
                  max="180"
                  value={centerLng}
                  onChange={(e) => setCenterLng(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  placeholder="e.g. 73.8567"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-300">Radius (Kilometers):</label>
                  <span className="text-xs font-bold text-brand-400 font-mono">{radiusKm} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="50"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="w-20 bg-surface-800 border border-surface-600 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={parseFloat(radiusKm) || 5}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="flex-1 accent-brand-500 cursor-pointer h-2 bg-surface-700 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Quick Radius Buttons & Location Shortcuts */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-800 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-400 font-medium">Quick Radius:</span>
                {[1, 2, 5, 10, 20].map((rVal) => (
                  <button
                    key={rVal}
                    type="button"
                    onClick={() => setRadiusKm(String(rVal))}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      parseFloat(radiusKm) === rVal
                        ? 'bg-brand-600 text-white shadow'
                        : 'bg-surface-800 text-gray-300 hover:bg-surface-700 hover:text-white'
                    }`}
                  >
                    {rVal} km
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-400 font-medium">Quick Center:</span>
                {[
                  { name: 'Pune (Baseline)', lat: '18.5204', lng: '73.8567' },
                  { name: 'Singrauli Mining', lat: '24.1500', lng: '82.6000' },
                  { name: 'Sundarbans Delta', lat: '21.8500', lng: '88.8500' },
                  { name: 'Delhi Fringe', lat: '28.6139', lng: '77.2090' },
                ].map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      setCenterLat(loc.lat);
                      setCenterLng(loc.lng);
                    }}
                    className="bg-surface-800 hover:bg-surface-700 text-gray-300 hover:text-white px-2 py-0.5 rounded text-[11px] transition-colors"
                  >
                    {loc.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Inline Coordinate Warning or Map Hint */}
            {coordError ? (
              <p className="text-[11px] text-amber-300 flex items-center gap-1.5 bg-amber-950/40 p-2 rounded-lg border border-amber-800/50">
                <span>⚠️</span> {coordError}
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <span>💡</span> Click anywhere on the map to reposition the center point. Adjusting the slider resizes the circle immediately.
              </p>
            )}
          </div>
        )}

        {/* Dual Date Range Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Before Period */}
          <div className="bg-surface-900/80 p-4 rounded-xl border border-blue-900/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Period 1 (BEFORE Baseline)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Start Date:</label>
                <input
                  type="date"
                  value={beforeStart}
                  onChange={(e) => setBeforeStart(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">End Date:</label>
                <input
                  type="date"
                  value={beforeEnd}
                  onChange={(e) => setBeforeEnd(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* After Period */}
          <div className="bg-surface-900/80 p-4 rounded-xl border border-emerald-900/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Period 2 (AFTER Evaluation)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Start Date:</label>
                <input
                  type="date"
                  value={afterStart}
                  onChange={(e) => setAfterStart(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">End Date:</label>
                <input
                  type="date"
                  value={afterEnd}
                  onChange={(e) => setAfterEnd(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Threshold & Action Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-xs">
              <span className="text-gray-300 font-medium">Max Scene Cloud Filter:</span>{' '}
              <span className="text-white font-bold">{cloudThreshold}%</span>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={cloudThreshold}
                onChange={(e) => setCloudThreshold(parseInt(e.target.value, 10))}
                className="w-32 block mt-1 accent-brand-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={forceDemo}
                onChange={(e) => setForceDemo(e.target.checked)}
                className="rounded bg-surface-900 border-surface-600 text-brand-500 focus:ring-0"
              />
              Force Demo Mode
            </label>
          </div>

          <button
            type="button"
            onClick={handleRunComparison}
            disabled={isLoading}
            className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing Earth Engine...
              </>
            ) : (
              <>
                <span>🛰️</span> Compare Area
              </>
            )}
          </button>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="bg-red-950/70 border border-red-500/60 rounded-xl p-3 text-red-200 text-xs flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* ── 3. Interactive Before / After Swipe Map ────────────────────── */}
      <div className="space-y-3">
        {/* Layer Mode Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span>🗺️</span> Interactive Swipe Comparison Map
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              Drag the vertical divider left or right to swipe between baseline and evaluation imagery.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-800 p-1 rounded-xl border border-surface-700 text-xs">
            <button
              onClick={() => setActiveLayerMode('rgb')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeLayerMode === 'rgb' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              Natural Color (RGB)
            </button>
            <button
              onClick={() => setActiveLayerMode('cir')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeLayerMode === 'cir' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              False Color (CIR)
            </button>
            <button
              onClick={() => setActiveLayerMode('delta_ndvi')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeLayerMode === 'delta_ndvi' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              ΔNDVI Decline
            </button>
            <button
              onClick={() => setActiveLayerMode('delta_ndwi')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeLayerMode === 'delta_ndwi' ? 'bg-brand-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              ΔNDWI Water Shift
            </button>
          </div>
        </div>

        {/* Map Component */}
        <ComparisonSwipeMap
          geometry={activeGeometry}
          beforeTileUrl={beforeTile}
          afterTileUrl={afterTile}
          beforeLabel={`${beforeStart} to ${beforeEnd}`}
          afterLabel={`${afterStart} to ${afterEnd}`}
          activeLayer={activeLayerMode}
          isLoading={isLoading}
          error={missingNotice || (comparisonData?.status === 'unavailable_imagery' ? comparisonData.message : null)}
          isDemo={Boolean(comparisonData?.is_demo || (comparisonData && !comparisonData.is_live))}
          onMapClick={handleMapClick}
          onLocationSelect={handleSearchLocationSelect}
        />

        {/* Searched Location Notice for Preset Catalog Mode */}
        {searchedNotice && (
          <div className="mt-3 p-3 bg-brand-950/60 border border-brand-500/40 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 text-brand-200">
            <span className="flex items-center gap-2">
              <span>📍</span>
              <span>
                Navigated to <strong>{searchedNotice.name}</strong> [{searchedNotice.lat}, {searchedNotice.lng}]. Active preset remains <em>{regionName}</em>.
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAoiMode('point_radius');
                  setCenterLat(searchedNotice.lat);
                  setCenterLng(searchedNotice.lng);
                  setRegionName(searchedNotice.name);
                  setSearchedNotice(null);
                }}
                className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors text-[11px]"
              >
                Switch to Point & Radius at this location
              </button>
              <button
                type="button"
                onClick={() => setSearchedNotice(null)}
                className="text-gray-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Verified Environmental Metrics Dashboard ────────────────── */}
      {comparisonData && comparisonData.status === 'success' && (
        <div className="space-y-6">
          <div className="border-b border-surface-700/60 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <span>📊</span> Verified Environmental Change Metrics
              </h2>
              <p className="text-xs text-[#475569] mt-1">
                Statistically reduced from Sentinel-2 Level-2A surface reflectance strictly across common valid pixels.
              </p>
            </div>
            <button
              onClick={handleDownloadComparisonPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition-colors"
            >
              {isDownloadingPdf ? (
                <>
                  <span className="animate-spin inline-block">⏳</span> Compiling Audit PDF...
                </>
              ) : (
                <>
                  <span>📄</span> Download Comparison Audit PDF
                </>
              )}
            </button>
          </div>

          {pdfMessage && (
            <div className="p-3 bg-brand-950/70 border border-brand-500/50 rounded-xl text-xs text-brand-200 flex items-center justify-between">
              <span>{pdfMessage}</span>
              <button
                onClick={() => setPdfMessage(null)}
                className="text-gray-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Vegetation Dynamics (NDVI) */}
            <div className="bg-surface-800/90 border border-surface-700 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌿</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vegetation Dynamics (NDVI)</h3>
                </div>
                <span className="text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  B8, B4
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">Before Mean</p>
                  <p className="text-base font-bold text-blue-400 mt-0.5">{comparisonData.ndvi_metrics.before_mean}</p>
                </div>
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">After Mean</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{comparisonData.ndvi_metrics.after_mean}</p>
                </div>
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">Net ΔNDVI</p>
                  <p
                    className={`text-base font-extrabold mt-0.5 ${
                      comparisonData.ndvi_metrics.delta_mean < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {comparisonData.ndvi_metrics.delta_mean > 0 ? '+' : ''}
                    {comparisonData.ndvi_metrics.delta_mean}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Canopy Decline Area (ΔNDVI ≤ -0.15):
                  </span>
                  <span className="font-bold text-rose-400">{comparisonData.ndvi_metrics.decline_area_km2} km²</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Canopy Regrowth Area (ΔNDVI ≥ +0.15):
                  </span>
                  <span className="font-bold text-emerald-400">{comparisonData.ndvi_metrics.growth_area_km2} km²</span>
                </div>
              </div>
            </div>

            {/* 2. Water Extent Dynamics (NDWI) */}
            <div className="bg-surface-800/90 border border-surface-700 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💧</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Water Dynamics (NDWI)</h3>
                </div>
                <span className="text-[11px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                  B3, B8
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">Before Mean</p>
                  <p className="text-base font-bold text-blue-400 mt-0.5">{comparisonData.ndwi_metrics.before_mean}</p>
                </div>
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">After Mean</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">{comparisonData.ndwi_metrics.after_mean}</p>
                </div>
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">Net ΔNDWI</p>
                  <p
                    className={`text-base font-extrabold mt-0.5 ${
                      comparisonData.ndwi_metrics.delta_mean > 0 ? 'text-cyan-400' : 'text-gray-300'
                    }`}
                  >
                    {comparisonData.ndwi_metrics.delta_mean > 0 ? '+' : ''}
                    {comparisonData.ndwi_metrics.delta_mean}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    Water Expansion Area (ΔNDWI ≥ +0.15):
                  </span>
                  <span className="font-bold text-cyan-400">{comparisonData.ndwi_metrics.expansion_area_km2} km²</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Water-Like Surface Extent (After):
                  </span>
                  <span className="font-bold text-white">{comparisonData.ndwi_metrics.water_like_after_km2} km²</span>
                </div>
              </div>
            </div>

            {/* 3. Built-up Dynamics (NDBI) */}
            <div className="bg-surface-800/90 border border-surface-700 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏗️</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Built-up Dynamics (NDBI)</h3>
                </div>
                <span className="text-[11px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
                  B11, B8
                </span>
              </div>

              {comparisonData.ndbi_metrics ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                      <p className="text-[10px] text-gray-400 uppercase">Before Mean</p>
                      <p className="text-base font-bold text-blue-400 mt-0.5">
                        {comparisonData.ndbi_metrics.before_mean != null ? comparisonData.ndbi_metrics.before_mean : '—'}
                      </p>
                    </div>
                    <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                      <p className="text-[10px] text-gray-400 uppercase">After Mean</p>
                      <p className="text-base font-bold text-amber-400 mt-0.5">
                        {comparisonData.ndbi_metrics.after_mean != null ? comparisonData.ndbi_metrics.after_mean : '—'}
                      </p>
                    </div>
                    <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                      <p className="text-[10px] text-gray-400 uppercase">Net ΔNDBI</p>
                      <p
                        className={`text-base font-extrabold mt-0.5 ${
                          (comparisonData.ndbi_metrics.delta_mean ?? 0) > 0 ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      >
                        {comparisonData.ndbi_metrics.delta_mean != null
                          ? `${comparisonData.ndbi_metrics.delta_mean > 0 ? '+' : ''}${comparisonData.ndbi_metrics.delta_mean}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Built-up Expansion (ΔNDBI ≥ +0.10):
                      </span>
                      <span className="font-bold text-amber-400">
                        {comparisonData.ndbi_metrics.builtup_expansion_km2 ?? comparisonData.ndbi_metrics.expansion_area_km2 ?? 0} km²
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        Built-up Surface Extent (After):
                      </span>
                      <span className="font-bold text-white">
                        {comparisonData.ndbi_metrics.builtup_after_km2 ?? 0} km²
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-3 gap-2 text-center opacity-50">
                    <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                      <p className="text-[10px] text-gray-400 uppercase">Before Mean</p>
                      <p className="text-base font-bold text-gray-400 mt-0.5">—</p>
                    </div>
                    <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                      <p className="text-[10px] text-gray-400 uppercase">After Mean</p>
                      <p className="text-base font-bold text-gray-400 mt-0.5">—</p>
                    </div>
                    <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                      <p className="text-[10px] text-gray-400 uppercase">Net ΔNDBI</p>
                      <p className="text-base font-extrabold text-gray-400 mt-0.5">—</p>
                    </div>
                  </div>
                  <div className="bg-surface-900/70 rounded-xl border border-surface-700/60 p-2.5 text-center">
                    <p className="text-xs text-amber-400 font-semibold">NDBI Metrics Unavailable</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Surface reflectance bands (B11, B8) were unavailable or pending calculation for this comparison interval.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Common Valid Pixel Coverage & Quality */}
            <div className="bg-surface-800/90 border border-surface-700 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔬</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mask & Observation Quality</h3>
                </div>
                <span className="text-[11px] bg-brand-950 text-brand-400 border border-brand-800 px-2 py-0.5 rounded">
                  Cloud Score+
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">Common Valid Area</p>
                  <p className="text-base font-bold text-white mt-0.5">{comparisonData.common_valid_area_km2} km²</p>
                  <p className="text-[10px] text-gray-400">Total: {comparisonData.geometry_area_km2} km²</p>
                </div>
                <div className="bg-surface-900/70 p-2.5 rounded-xl border border-surface-700/60">
                  <p className="text-[10px] text-gray-400 uppercase">Valid Pixel Coverage</p>
                  <p className="text-base font-extrabold text-brand-400 mt-0.5">{comparisonData.coverage_percentage}%</p>
                  <p className="text-[10px] text-gray-400">Scale: {comparisonData.calculation_scale_meters || 20}m</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Before Period Usable Passes:</span>
                  <span className="font-semibold text-white">{comparisonData.before_metadata.usable_scenes} scenes</span>
                </div>
                <div className="flex justify-between">
                  <span>After Period Usable Passes:</span>
                  <span className="font-semibold text-white">{comparisonData.after_metadata.usable_scenes} scenes</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Index Comparison Charts ──────────────────────────────── */}
          <div className="bg-surface-800/90 border border-surface-700 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>📈</span> Multi-Temporal Spectral Index Shift
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="indicator" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis domain={[-0.4, 0.8]} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem' }}
                    labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="before" name="Before Period Mean" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="after" name="After Period Mean" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delta" name="Net Differential (Δ)" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.delta < 0 ? '#f43f5e' : '#14b8a6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── 6. Change Interpretation & Caveats Panel ─────────────────── */}
          <div className="bg-surface-800/60 border border-surface-700 rounded-2xl p-5 md:p-6 space-y-3 text-xs leading-relaxed">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>🔍</span> Scientific Interpretation & Methodological Caveats
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
              <div className="bg-surface-900/60 p-3.5 rounded-xl border border-surface-700/60">
                <p className="font-semibold text-rose-300 mb-1">Vegetation Index (NDVI) Guidelines:</p>
                <p>
                  A decline in NDVI (ΔNDVI ≤ -0.15) flags significant canopy vigor reduction, but does not definitively
                  prove permanent deforestation. Seasonal agricultural harvesting, dry-season leaf shed, brush fires, and
                  drought cause identical spectral declines. Confirm land-use permits and field surveys prior to enforcement.
                </p>
              </div>

              <div className="bg-surface-900/60 p-3.5 rounded-xl border border-surface-700/60">
                <p className="font-semibold text-cyan-300 mb-1">Water Index (NDWI) Guidelines:</p>
                <p>
                  An increase in NDWI (ΔNDWI ≥ +0.15) detects expanded surface water reflectance. In agricultural catchments,
                  this often captures routine post-monsoon reservoir retention, canal irrigation, or farm-pond replenishment
                  rather than accidental flooding. Always cross-verify with gauge data and radar (SAR) backscatter.
                </p>
              </div>

              <div className="bg-surface-900/60 p-3.5 rounded-xl border border-surface-700/60">
                <p className="font-semibold text-amber-300 mb-1">Built-up Index (NDBI) Guidelines:</p>
                <p>
                  NDBI detects built-up surfaces, artificial materials, and exposed soil/excavations. An elevated NDBI
                  indicates physical ground transformation, not definitive proof of illegal mining. It serves as an automated
                  surface disturbance screening tool to guide on-site regulatory inspections and verification.
                </p>
              </div>
            </div>

            {/* Warnings list if any */}
            {comparisonData.warnings && comparisonData.warnings.length > 0 && (
              <div className="bg-amber-950/50 border border-amber-600/40 rounded-xl p-3 text-amber-200 mt-2">
                <p className="font-semibold mb-1">Processing Notes & Advisory Warnings:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {comparisonData.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
