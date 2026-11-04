import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MonitoringSection() {
  const [viewModes, setViewModes] = useState({
    deforestation: 'after',
    mining: 'after',
    flood: 'after',
  });

  const toggleViewMode = (module, mode) => {
    setViewModes((prev) => ({
      ...prev,
      [module]: mode,
    }));
  };

  const modules = [
    {
      id: 'deforestation',
      route: '/deforestation',
      title: 'Deforestation & Canopy Loss',
      category: 'Terrestrial Ecosystems',
      sensor: 'Sentinel-2 MSI (Level-2A BOA)',
      metrics: 'ΔNDVI Difference & Z-Score Canopy Anomaly',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description:
        'Continuous temporal surveillance over forestry corridors and protected conservation reserves. The pipeline contrasts multi-seasonal baseline scenes against target evaluation passes to isolate clear-cuts, road carving, and canopy thinning from seasonal leaf shedding.',
      screeningCaveat:
        'Screening Disclosure: Automated flags denote statistically significant negative vegetative anomalies (ΔNDVI < -0.25). Formal legal determination of illicit logging requires ground inspection and boundary verification against official concession registers.',
      beforeCaption: 'T0: Baseline Dense Canopy (NDVI > 0.65)',
      afterCaption: 'T1: Screened Canopy Loss Anomaly (ΔNDVI < -0.25)',
      features: [
        'Multi-temporal NDVI baseline differencing',
        'Z-score statistical vegetation anomaly filtering',
        'Polygonized disturbance clustering & spatial export',
      ],
    },
    {
      id: 'mining',
      route: '/mining',
      title: 'Mining & Land Surface Disturbance',
      category: 'Mineral & Topographic Impact',
      sensor: 'Sentinel-2 MSI (SWIR B11/B12 + NIR B8)',
      metrics: 'NDBI Bare Earth Shift & Topographic Scars',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description:
        'Automated detection of rapid bare earth exposure, open-pit quarry expansion, riverbed dredging, and tailings pond formation. By measuring shortwave-infrared reflectance shifts against historical baselines, the system differentiates active excavation from dry-season fallow.',
      screeningCaveat:
        'Screening Disclosure: Spectral anomalies highlight rapid vegetative loss combined with high SWIR bare-soil indices. The platform identifies physical surface excavation and overburden accumulation; administrative legality requires title verification with mining authorities.',
      beforeCaption: 'T0: Baseline Undisturbed Terrain',
      afterCaption: 'T1: Screened Surface Excavation & Bare Soil Shift',
      features: [
        'NDBI bare-soil differentiation from surrounding flora',
        'Excavation boundary vectorization & area quantification',
        'Time-series persistence checks against seasonal artifacts',
      ],
    },
    {
      id: 'flood',
      route: '/flood',
      title: 'Flood & Inundation Monitoring',
      category: 'Hydrological Hazards',
      sensor: 'Sentinel-1 C-Band SAR + Sentinel-2 NDWI',
      metrics: 'Microwave Backscatter Decrease & NDWI Water Mask',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      description:
        'Rapid post-event flood extent delineation. While optical instruments (NDWI) are constrained by persistent monsoonal cloud decks, Sentinel-1 C-band Synthetic Aperture Radar (SAR) transmits microwave pulses that penetrate heavy clouds and precipitation, revealing standing floodwaters through specular reflection loss.',
      screeningCaveat:
        'Sensor Note: Optical NDWI provides 10m high-resolution watermapping under clear skies. During severe weather, Sentinel-1 SAR provides cloud-independent backscatter differencing to detect inundation regardless of cloud cover.',
      beforeCaption: 'T0: Normal River Channel Baseline',
      afterCaption: 'T1: Peak Event Inundation Extent',
      features: [
        'Cloud-independent Sentinel-1 C-band radar backscatter',
        'Pre-event vs. peak event flood watermask differencing',
        'Settlement and agricultural land exposure screening',
      ],
    },
  ];

  return (
    <section id="monitoring" className="relative py-20 sm:py-28 border-t border-slate-200 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="gv-pill-badge">Dedicated Analytical Modules</span>
            <span className="text-xs font-mono font-semibold text-slate-500">Section 02 // Monitoring</span>
          </div>
          <h2 className="gv-light-heading">
            Environmental Change Monitoring <br />
            <span className="text-sky-700 font-semibold">Calibrated for Physical Reflectance Signatures</span>
          </h2>
          <p className="gv-light-subheading">
            Each monitoring pipeline targets specific spectral and microwave properties, replacing visual guesswork with calibrated biophysical thresholds and verifiable satellite observations.
          </p>
        </div>

        {/* Modules Stack */}
        <div className="space-y-16">
          {modules.map((mod, index) => {
            const isReversed = index % 2 === 1;
            const currentMode = viewModes[mod.id];

            return (
              <div
                key={mod.id}
                className="gv-light-card p-6 sm:p-8 bg-white border-slate-200 shadow-sm"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
                  
                  {/* Module Specification & Links (6 cols) */}
                  <div className={`lg:col-span-6 space-y-4 ${isReversed ? 'lg:order-2' : 'lg:order-1'}`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className={`px-2.5 py-0.5 rounded font-bold border ${mod.badgeColor}`}>
                        {mod.category}
                      </span>
                      <span className="text-slate-500">
                        SENSOR: {mod.sensor}
                      </span>
                    </div>

                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      {mod.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {mod.description}
                    </p>

                    {/* Scientific Capability Checklist */}
                    <div className="space-y-2 py-2">
                      {mod.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 font-mono">
                          <span className="text-sky-600 font-bold">▪</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Screening Caveat Callout */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed font-sans">
                      <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        SCIENTIFIC DISCLOSURE
                      </div>
                      {mod.screeningCaveat}
                    </div>

                    {/* Action link */}
                    <div className="pt-2 flex items-center gap-4">
                      <Link
                        to={mod.route}
                        className="gv-btn-primary !py-2.5 !px-5 text-xs font-semibold rounded-lg shadow-sm"
                      >
                        <span>Launch {mod.title.split('&')[0].trim()}</span>
                        <span className="text-sm">→</span>
                      </Link>
                      <span className="text-xs font-mono text-slate-500">
                        Route: <code className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 font-bold">{mod.route}</code>
                      </span>
                    </div>
                  </div>

                  {/* Cartographic Imagery Panel (6 cols) */}
                  <div className={`lg:col-span-6 ${isReversed ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="gv-light-card p-3 bg-slate-50 border-slate-200 shadow-sm">
                      
                      {/* Cartographic Panel Header & Toggle */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-mono">
                        <span className="text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                          COMPARATIVE SATELLITE PASS
                        </span>

                        <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shadow-xs">
                          <button
                            onClick={() => toggleViewMode(mod.id, 'before')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                              currentMode === 'before'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Baseline (T0)
                          </button>
                          <button
                            onClick={() => toggleViewMode(mod.id, 'after')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                              currentMode === 'after'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Evaluation (T1)
                          </button>
                        </div>
                      </div>

                      {/* Map Simulation Window */}
                      <div className="relative rounded-lg overflow-hidden aspect-[16/10] bg-slate-900 border border-slate-300 shadow-inner">
                        
                        {/* Rendering by module & mode */}
                        <svg className="w-full h-full" viewBox="0 0 600 375">
                          {/* DEFORESTATION MODULE GRAPHICS */}
                          {mod.id === 'deforestation' && (
                            <g>
                              {currentMode === 'before' ? (
                                <g>
                                  <rect width="600" height="375" fill="#1b4332" />
                                  <path d="M 0,0 L 600,0 L 600,180 L 0,140 Z" fill="#2d6a4f" />
                                  <path d="M 0,140 L 600,180 L 600,375 L 0,375 Z" fill="#1e4d38" />
                                  <path d="M 180,0 Q 240,160 380,375" fill="none" stroke="#0284c7" strokeWidth="20" />
                                </g>
                              ) : (
                                <g>
                                  <rect width="600" height="375" fill="#1b4332" />
                                  <path d="M 0,0 L 600,0 L 600,180 L 0,140 Z" fill="#2d6a4f" />
                                  <path d="M 0,140 L 600,180 L 600,375 L 0,375 Z" fill="#1e4d38" />
                                  <path d="M 180,0 Q 240,160 380,375" fill="none" stroke="#0284c7" strokeWidth="20" />
                                  
                                  {/* Logged clear-cut polygon */}
                                  <polygon
                                    points="220,70 330,60 360,145 240,165"
                                    fill="rgba(239, 68, 68, 0.6)"
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeDasharray="4 2"
                                  />
                                  <text x="240" y="115" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                                    CANOPY LOSS: -32.4 HA
                                  </text>
                                  <path d="M 330,100 L 460,95 L 510,130" fill="none" stroke="#f87171" strokeWidth="2.5" strokeDasharray="3 2" />
                                </g>
                              )}
                            </g>
                          )}

                          {/* MINING MODULE GRAPHICS */}
                          {mod.id === 'mining' && (
                            <g>
                              {currentMode === 'before' ? (
                                <g>
                                  <rect width="600" height="375" fill="#2d4a3e" />
                                  <path d="M 80,0 Q 140,200 240,375" fill="none" stroke="#0369a1" strokeWidth="24" />
                                  <rect x="280" y="80" width="160" height="120" fill="#22382e" />
                                </g>
                              ) : (
                                <g>
                                  <rect width="600" height="375" fill="#2d4a3e" />
                                  <path d="M 80,0 Q 140,200 240,375" fill="none" stroke="#0369a1" strokeWidth="24" />
                                  
                                  {/* Excavation open pit */}
                                  <polygon
                                    points="260,90 440,75 460,190 280,210"
                                    fill="rgba(245, 158, 11, 0.65)"
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                    strokeDasharray="4 2"
                                  />
                                  <text x="290" y="145" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                                    SURFACE EXCAVATION (NDBI+)
                                  </text>
                                  
                                  {/* Tailings impoundment */}
                                  <ellipse cx="370" cy="260" rx="60" ry="35" fill="rgba(6, 182, 212, 0.55)" stroke="#06b6d4" strokeWidth="2" />
                                  <text x="330" y="265" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                    TAILINGS IMPOUNDMENT
                                  </text>
                                </g>
                              )}
                            </g>
                          )}

                          {/* FLOOD MODULE GRAPHICS */}
                          {mod.id === 'flood' && (
                            <g>
                              {currentMode === 'before' ? (
                                <g>
                                  <rect width="600" height="375" fill="#1b3d2f" />
                                  <path d="M 0,160 Q 300,140 600,200" fill="none" stroke="#0284c7" strokeWidth="20" />
                                  <rect x="180" y="60" width="100" height="70" fill="#2b5341" />
                                  <rect x="360" y="230" width="110" height="70" fill="#2b5341" />
                                </g>
                              ) : (
                                <g>
                                  <rect width="600" height="375" fill="#1b3d2f" />
                                  {/* Inundated floodplain */}
                                  <path
                                    d="M 0,90 Q 220,70 380,110 Q 510,130 600,100 L 600,290 Q 390,320 220,280 Q 80,310 0,260 Z"
                                    fill="rgba(14, 165, 233, 0.7)"
                                    stroke="#38bdf8"
                                    strokeWidth="2"
                                  />
                                  <path d="M 0,160 Q 300,140 600,200" fill="none" stroke="#0369a1" strokeWidth="20" />
                                  <text x="180" y="200" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="bold">
                                    INUNDATION DETECTED (SAR VV &lt; -16dB)
                                  </text>
                                </g>
                              )}
                            </g>
                          )}

                          {/* Bounding Study Grid */}
                          <rect x="30" y="20" width="540" height="335" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" strokeDasharray="4 4" />
                        </svg>

                        {/* Caption banner inside map */}
                        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-md flex items-center justify-between text-xs font-mono shadow-sm">
                          <span className="text-slate-800 font-semibold">
                            {currentMode === 'before' ? mod.beforeCaption : mod.afterCaption}
                          </span>
                          <span className="text-sky-700 font-bold">
                            {currentMode === 'before' ? 'BASELINE' : 'SCREENED'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
