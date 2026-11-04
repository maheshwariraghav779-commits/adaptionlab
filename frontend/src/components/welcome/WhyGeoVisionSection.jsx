import React from 'react';

export default function WhyGeoVisionSection() {
  const principles = [
    {
      num: '01',
      title: 'Multi-Temporal Baseline Consistency',
      principle: 'Phenological Filtering',
      description:
        'Contrasts matched seasonal baseline observation windows against target evaluation dates to isolate genuine land transformations from natural vegetation phenology, seasonal rainfall, and solar angle variations.',
    },
    {
      num: '02',
      title: 'Dual Optical & Microwave Verification',
      principle: 'Cross-Sensor Correlation',
      description:
        'Cross-checks optical multispectral changes (NDVI/NDBI) against Sentinel-1 C-band SAR radar backscatter, ensuring observation continuity during persistent monsoon clouds and validating physical surface texture changes.',
    },
    {
      num: '03',
      title: 'Precision Polygonal AOI Geometry',
      principle: 'Geodetic Fidelity',
      description:
        'Supports arbitrary user-drawn GeoJSON polygons, cadastral parcel vectors, and buffer circles—preserving actual study area geometry and true surface area calculations rather than crude rectangular bounding boxes.',
    },
    {
      num: '04',
      title: 'Transparent Indicator Attribution',
      principle: 'Gini MDI Interpretability',
      description:
        'Strictly distinguishes composite risk indicators from Random Forest disturbance probabilities and physical affected hectares. Ranks multi-spectral feature weights using global Gini MDI without black-box conjecture.',
    },
    {
      num: '05',
      title: 'Publication-Grade Audit Documentation',
      principle: 'Verifiable Evidence',
      description:
        'Compiles multi-page PDF audit dossiers featuring authentic Sentinel-2 imagery, acquisition dates, sensor parameters, cartographic scale bars, and multi-year spectral trend charts for formal documentation.',
    },
    {
      num: '06',
      title: 'Zero Stock Imagery or Fabrications',
      principle: 'Data Authenticity',
      description:
        'Every pixel, figure caption, and index value is derived directly from live Copernicus satellite passes. If persistent cloud obscuration prevents raster retrieval, explicit data disclosures are rendered rather than synthetic placeholders.',
    },
  ];

  return (
    <section id="why-geovision" className="relative py-20 sm:py-28 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="gv-pill-badge">Scientific Rigor</span>
            <span className="text-xs font-mono font-semibold text-slate-500">Section 05 // Standards</span>
          </div>
          <h2 className="gv-light-heading">
            Why GeoVision AI <br />
            <span className="text-sky-700 font-semibold">Engineered for Transparency & Cartographic Integrity</span>
          </h2>
          <p className="gv-light-subheading">
            Environmental intelligence requires scientific accountability. GeoVision AI replaces speculative assertions with reproducible satellite evidence, verified thresholds, and auditable reporting.
          </p>
        </div>

        {/* 6 Scientific Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((pr, idx) => (
            <div
              key={idx}
              className="gv-light-card p-6 flex flex-col justify-between border-slate-200 bg-slate-50/50"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded border border-sky-200">
                    STANDARD {pr.num}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {pr.principle}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-2">
                  {pr.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {pr.description}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>VERIFICATION</span>
                <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Deterministic
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
