import React from 'react';

export default function AboutSection() {
  const spectralIndices = [
    {
      code: 'NDVI',
      name: 'Normalized Difference Vegetation Index',
      formula: '(NIR - Red) / (NIR + Red)',
      description:
        'Quantifies chlorophyll absorption and cellular structure reflectance to detect canopy loss, forest degradation, and agricultural clearing.',
      application: 'Forest Canopy Health & Biomass',
      accent: 'border-emerald-200 text-emerald-800 bg-emerald-50',
      badge: 'B08 vs B04',
    },
    {
      code: 'NDBI',
      name: 'Normalized Difference Built-Up Index',
      formula: '(SWIR - NIR) / (SWIR + NIR)',
      description:
        'Leverages shortwave-infrared peaks to isolate exposed subsoil, mineral extraction, and rock excavation from vegetated backgrounds.',
      application: 'Surface Mining & Topographic Scars',
      accent: 'border-amber-200 text-amber-800 bg-amber-50',
      badge: 'B11 vs B08',
    },
    {
      code: 'NDWI',
      name: 'Normalized Difference Water Index',
      formula: '(Green - NIR) / (Green + NIR)',
      description:
        'Maximizes open water reflectance while suppressing terrestrial vegetation noise to delineate reservoir boundaries and flood extents.',
      application: 'Hydrology & Inundation Delineation',
      accent: 'border-sky-200 text-sky-800 bg-sky-50',
      badge: 'B03 vs B08',
    },
  ];

  const specs = [
    {
      value: '10m',
      title: 'Ground Sample Distance',
      subtitle: 'Sentinel-2 MSI VNIR Bands (B2, B3, B4, B8)',
    },
    {
      value: '5 Days',
      title: 'Constellation Revisit',
      subtitle: 'Sentinel-2A & Sentinel-2B Sun-Synchronous',
    },
    {
      value: '13 Bands',
      title: 'Spectral Channels',
      subtitle: 'Visible, Red-Edge, NIR, and SWIR',
    },
    {
      value: 'C-Band SAR',
      title: 'Radar Penetration',
      subtitle: 'Sentinel-1 microwave cloud-independent imaging',
    },
  ];

  return (
    <section id="about" className="relative py-20 sm:py-28 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="gv-pill-badge">Remote Sensing Foundation</span>
            <span className="text-xs font-mono font-semibold text-slate-500">Section 01 // Overview</span>
          </div>
          <h2 className="gv-light-heading">
            Understanding Earth Surface Change <br />
            <span className="text-sky-700 font-semibold">Through Calibrated Satellite Data</span>
          </h2>
          <p className="gv-light-subheading">
            GeoVision AI bridges raw European Space Agency Copernicus observations and automated environmental screening. By coupling multi-temporal optical imagery with synthetic aperture radar, the system identifies landscape transformations with reproducible scientific rigor.
          </p>
        </div>

        {/* Core Hardware & Sensor Specifications Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {specs.map((item, idx) => (
            <div
              key={idx}
              className="gv-light-card p-6 bg-slate-50/70 border-slate-200"
            >
              <div className="font-mono text-3xl font-extrabold text-slate-900 mb-1">
                {item.value}
              </div>
              <div className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1 font-mono">
                {item.title}
              </div>
              <div className="text-xs text-slate-500">
                {item.subtitle}
              </div>
            </div>
          ))}
        </div>

        {/* Biophysical Indices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {spectralIndices.map((idxItem) => (
            <div
              key={idxItem.code}
              className="gv-light-card p-6 sm:p-8 flex flex-col justify-between border-slate-200 bg-white shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${idxItem.accent}`}>
                    {idxItem.code}
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    {idxItem.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{idxItem.name}</h3>
                <div className="font-mono text-xs text-sky-800 bg-sky-50/80 p-2.5 rounded border border-sky-100 mb-4 font-semibold">
                  Formula: {idxItem.formula}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {idxItem.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>TARGET DOMAIN</span>
                <span className="text-slate-800 font-bold">{idxItem.application}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Methodological Transparency Note */}
        <div className="gv-light-card p-6 sm:p-8 border-sky-100 bg-gradient-to-r from-sky-50/60 to-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                  Random Forest Inference & Gini Feature Importance
                </h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rather than treating machine learning as an uninterpretable black box, GeoVision AI pairs empirical spectral index thresholds with trained Random Forest ensemble classifiers. Global Mean Decrease in Impurity (Gini MDI) ranks feature contributions directly, ensuring model probabilities reflect verified multi-band variance.
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="gv-pill-badge border-sky-200 text-sky-800 bg-white">
                Decision Support Screening
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
