import React, { useState } from 'react';

export default function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Satellite Data Acquisition',
      sensor: 'Copernicus Sentinel-1 SAR & Sentinel-2 MSI',
      category: 'Catalog Query & Ingestion',
      description:
        'Cloud-native querying of the Google Earth Engine planetary catalog. Pulls Sentinel-2 MSI Level-2A Bottom-Of-Atmosphere (BOA) surface reflectance tiles and Sentinel-1 C-band Synthetic Aperture Radar (SAR) Level-1 Ground Range Detected (GRD) imagery bounded by user AOI polygons.',
      technicalSpecs: {
        source: 'Copernicus Open Access Hub / Google Earth Engine',
        spatialBounds: 'Arbitrary GeoJSON polygon or geodetic radial buffer',
        radiometry: 'Calibrated surface reflectance (BOA) & SAR backscatter (dB)',
      },
    },
    {
      num: '02',
      title: 'Preprocessing & Cloud Masking',
      sensor: 'Scene Classification Layer (SCL) & QA60 Band',
      category: 'Atmospheric Correction',
      description:
        'Automated screening of clouds, cloud shadows, cirrus, and snow using Sentinel-2 Scene Classification Layer (SCL) masks. Computes clear-sky temporal median composites across defined baseline and evaluation date ranges to eliminate ephemeral weather interference.',
      technicalSpecs: {
        filter: 'SCL classes: cloud high/medium probability & cloud shadow',
        temporalHarmonization: 'Median compositing across acquisition windows',
        radarFiltering: 'Refined Lee speckle filtering for SAR backscatter',
      },
    },
    {
      num: '03',
      title: 'Spectral Feature Extraction',
      sensor: '13 Optical Bands + Dual Polarization (VV/VH)',
      category: 'Biophysical Index Derivation',
      description:
        'Mathematical execution of normalized difference biophysical formulas: NDVI for vegetative chlorophyll absorption, NDWI for surface water delineation, and NDBI for bare earth and mineral extraction, alongside SAR cross-polarization ratios for structural roughness.',
      technicalSpecs: {
        indices: 'NDVI (B8-B4)/(B8+B4), NDWI (B3-B8)/(B3+B8), NDBI (B11-B8)/(B11+B8)',
        resolution: '10m ground sample distance for VNIR channels',
        outputRasters: 'Continuous float32 index rasters (-1.0 to +1.0)',
      },
    },
    {
      num: '04',
      title: 'Environmental Change Screening',
      sensor: 'Multi-Temporal Differencing & Scikit-Learn RF',
      category: 'Statistical & ML Inference',
      description:
        'Computes temporal delta rasters (ΔNDVI, ΔNDWI, ΔNDBI) between baseline and evaluation passes. Evaluates statistical z-scores and applies trained Random Forest ensemble models to score disturbance probabilities and calculate verified affected surface area.',
      technicalSpecs: {
        classifier: 'Random Forest ensemble with Gini MDI global feature ranking',
        thresholding: 'Empirical index delta cutoff (e.g., ΔNDVI < -0.25)',
        areaCalculation: 'Geodetic pixel area summation in hectares / km²',
      },
    },
    {
      num: '05',
      title: 'Geospatial Visualization & Audit Reporting',
      sensor: 'MapLibre GL & Python ReportLab Engine',
      category: 'Dissemination & Auditing',
      description:
        'Renders interactive GPU-accelerated raster and vector layers on MapLibre GL maps for real-time visual inspection. Automatically compiles publication-grade A4 PDF audit reports containing authentic Sentinel-2 rasters, coordinates, scale bars, and spectral trend graphs.',
      technicalSpecs: {
        webGIS: 'MapLibre GL vector and raster draping with coordinate inspection',
        auditReports: 'Multi-page A4 PDF documents with sensor metadata',
        transparency: 'Explicit disclosures for missing or cloud-obscured data',
      },
    },
  ];

  return (
    <section id="workflow" className="relative py-20 sm:py-28 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="gv-pill-badge">Scientific Pipeline</span>
            <span className="text-xs font-mono font-semibold text-slate-500">Section 03 // Methodology</span>
          </div>
          <h2 className="gv-light-heading">
            Processing Architecture <br />
            <span className="text-sky-700 font-semibold">From Spaceborne Photons to Certified Audit</span>
          </h2>
          <p className="gv-light-subheading">
            Every analytical result follows a deterministic, 5-stage scientific pipeline. Radiometric calibration, cloud filtering, and biophysical index derivation precede all machine learning inferences.
          </p>
        </div>

        {/* Pipeline Steps Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {steps.map((st, idx) => {
            const isSelected = activeStep === idx;
            return (
              <button
                key={st.num}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-sky-50 border-sky-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    STAGE {st.num}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-sky-600" />}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                  {st.title}
                </h4>
                <div className="text-xs font-mono text-slate-500 truncate">
                  {st.category}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Console */}
        <div className="gv-light-card p-6 sm:p-8 bg-slate-50/70 border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Description (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-sky-700 font-bold">PIPELINE STAGE {steps[activeStep].num}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700 font-semibold">{steps[activeStep].category}</span>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {steps[activeStep].title}
              </h3>

              <div className="text-xs font-mono text-slate-700 bg-white p-2.5 rounded border border-slate-200 inline-block font-semibold shadow-2xs">
                PRIMARY INSTRUMENT: {steps[activeStep].sensor}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {steps[activeStep].description}
              </p>
            </div>

            {/* Technical Specifications (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-3 font-mono text-xs shadow-2xs">
              <div className="text-slate-900 font-bold uppercase tracking-wider text-xs pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>STAGE SPECIFICATIONS</span>
                <span className="text-sky-600 font-normal">GEE // VERIFIED</span>
              </div>

              {Object.entries(steps[activeStep].technicalSpecs).map(([key, val]) => (
                <div key={key}>
                  <span className="text-slate-500 text-[11px] uppercase block mb-0.5 font-bold">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-slate-800 font-sans block bg-slate-50 p-2 rounded border border-slate-100 text-xs font-medium">
                    {val}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
