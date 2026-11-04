import React from 'react';
import { Link } from 'react-router-dom';

export default function CtaFooterSection() {
  const currentYear = new Date().getFullYear();

  const moduleLinks = [
    { name: 'Overview Dashboard', href: '/' },
    { name: 'Custom AOI Analysis', href: '/aoi' },
    { name: 'Deforestation Monitoring', href: '/deforestation' },
    { name: 'Mining Disturbance', href: '/mining' },
    { name: 'Flood & Inundation', href: '/flood' },
    { name: 'Satellite Comparison', href: '/satellite-comparison' },
    { name: 'Temporal Analysis', href: '/analysis' },
    { name: 'Field Photo Geotag', href: '/field-photo' },
    { name: 'Audit Reports', href: '/reports' },
    { name: 'Scientific Methodology', href: '/methodology' },
  ];

  return (
    <footer className="relative bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Authoritative Command Center Launch Box */}
        <div className="bg-gradient-to-r from-sky-900 to-slate-900 border border-sky-800/80 rounded-2xl p-8 sm:p-12 mb-16 text-center shadow-lg relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-sky-300/30 text-sky-200 text-xs font-bold uppercase tracking-wider">
              Command Center Deployment
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Explore Environmental Intelligence
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Launch the full GeoVision AI platform to execute custom AOI screening, multi-temporal analysis, and generate auditable PDF reports.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="gv-btn-primary !py-3 !px-7 text-sm font-semibold rounded-lg shadow-md w-full sm:w-auto"
              >
                <span>Launch GeoVision AI Dashboard</span>
                <span className="text-base">→</span>
              </Link>
              <Link
                to="/methodology"
                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-colors w-full sm:w-auto"
              >
                Scientific Methodology
              </Link>
            </div>
          </div>
        </div>

        {/* Directory & Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">GEOVISION</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-600 text-white">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent geospatial platform for monitoring environmental change through satellite imagery, multi-temporal analysis, and AI-assisted insights.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              COPERNICUS SENTINEL-1 & 2 // EPSG:4326
            </div>
          </div>

          {/* Platform Modules Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold mb-3">
              Platform Modules
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {moduleLinks.map((mod) => (
                <Link
                  key={mod.href}
                  to={mod.href}
                  className="text-slate-400 hover:text-sky-400 transition-colors py-0.5 truncate"
                >
                  {mod.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mission Acknowledgments */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold mb-3">
              Mission Acknowledgments
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5 font-sans">
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400">▪</span>
                <span>ESA Copernicus Programme (Sentinel-1 & Sentinel-2)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400">▪</span>
                <span>Google Earth Engine Cloud Remote Sensing</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400">▪</span>
                <span>OpenStreetMap & MapLibre GL Community</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Scientific Transparency & Legal Disclaimer */}
        <div className="py-6 border-b border-slate-800">
          <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <div className="font-bold text-slate-200 mb-1 flex items-center gap-2 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              SCIENTIFIC DISCLOSURE & SCREENING DISCLAIMER
            </div>
            <p>
              GeoVision AI is an intelligent remote sensing screening tool designed for environmental auditing, preliminary disturbance prioritization, and rapid situational awareness. Satellite-derived anomaly alerts, spectral index deltas, and model disturbance probabilities provide high-confidence guidance but do not replace certified on-site legal surveys, local ground-truthing, or statutory enforcement inspections where formal legal determinations are required.
            </p>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 font-mono text-[11px]">
          <div>
            © {currentYear} GeoVision AI. Intelligent Satellite Image Analytics Platform.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>COPERNICUS OPEN ACCESS</span>
            <span>•</span>
            <span>GEE COMPLIANT</span>
            <span>•</span>
            <span>A4 AUDITABLE</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
