import React from 'react';

export default function TechnologySection() {
  const technologies = [
    {
      domain: 'Cloud Geospatial Processing',
      name: 'Google Earth Engine API',
      role: 'Planetary Raster Computation',
      summary:
        'Distributed cloud processing engine providing petabyte-scale access to Copernicus collections. Executes server-side atmospheric masking, band math, and temporal compositing without local storage bottlenecks.',
      tag: 'Cloud Remote Sensing',
    },
    {
      domain: 'Multispectral Earth Observation',
      name: 'Copernicus Sentinel-2 MSI',
      role: '10m Surface Reflectance (L2A)',
      summary:
        'Twin satellite constellation operated by the European Space Agency. Delivers 13 spectral channels (Visible, Red-Edge, NIR, SWIR) with a combined 5-day revisit rate for precision vegetation and land monitoring.',
      tag: 'Optical Sensor',
    },
    {
      domain: 'Radar Remote Sensing',
      name: 'Copernicus Sentinel-1 SAR',
      role: 'C-Band Active Microwave (5.405 GHz)',
      summary:
        'All-weather day-and-night Synthetic Aperture Radar. Transmits microwave pulses that penetrate heavy monsoon cloud decks, dense fog, and smoke to monitor floodwaters and terrain surface roughness.',
      tag: 'Synthetic Aperture Radar',
    },
    {
      domain: 'Interactive Web Mapping',
      name: 'MapLibre GL',
      role: 'Hardware-Accelerated Client GIS',
      summary:
        'Open-source vector and raster mapping library. Delivers fluid 60fps pan/zoom interactions, customizable polygon overlays, satellite tile draping, and interactive coordinate inspection.',
      tag: 'WebGL GIS',
    },
    {
      domain: 'High-Throughput Backend',
      name: 'FastAPI & Python 3',
      role: 'Asynchronous Geospatial REST API',
      summary:
        'Asynchronous Python framework with Pydantic type validation, streaming JSON endpoints, and direct integration with scientific Python packages (Shapely, NumPy, GeoPandas).',
      tag: 'Backend Infrastructure',
    },
    {
      domain: 'Statistical Machine Learning',
      name: 'Scikit-Learn Random Forest',
      role: 'Ensemble Classification & Gini MDI',
      summary:
        'Non-linear decision tree ensemble for multi-band pattern screening. Derives global Mean Decrease in Impurity (Gini MDI) to quantify feature importance without uninterpretable neural networks.',
      tag: 'Interpretable ML',
    },
    {
      domain: 'Document Automation',
      name: 'Python ReportLab',
      role: 'Publication-Grade A4 PDF Engine',
      summary:
        'Dynamic report compilation system generating multi-page PDF audit dossiers with authentic Sentinel-2 imagery, geodetic scale bars, coordinates, and spectral trend visualizations.',
      tag: 'PDF Reporting',
    },
    {
      domain: 'Frontend Application',
      name: 'React 18 & Modern Web GIS',
      role: 'Component Architecture',
      summary:
        'Declarative user interface combining responsive GIS controls, dynamic analytical legends, and state synchronization across complex spatial views.',
      tag: 'Client UI',
    },
  ];

  return (
    <section id="technology" className="relative py-20 sm:py-28 border-t border-slate-200 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="gv-pill-badge">Core Architecture</span>
            <span className="text-xs font-mono font-semibold text-slate-500">Section 04 // Technologies</span>
          </div>
          <h2 className="gv-light-heading">
            Verified Technology Stack <br />
            <span className="text-sky-700 font-semibold">Built on Proven Open Geospatial Foundations</span>
          </h2>
          <p className="gv-light-subheading">
            Every technology in the GeoVision AI architecture is selected for reproducibility, mathematical verifiability, and operational stability.
          </p>
        </div>

        {/* Technology Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {technologies.map((tech, idx) => (
            <div
              key={idx}
              className="gv-light-card p-5 flex flex-col justify-between border-slate-200 bg-white"
            >
              <div>
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px]">{tech.tag}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-0.5">{tech.name}</h3>
                <div className="text-xs text-sky-700 font-mono font-semibold mb-3">{tech.role}</div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {tech.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] font-mono text-slate-500 font-semibold">
                DOMAIN: {tech.domain}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
