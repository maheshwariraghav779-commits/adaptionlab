import React, { useEffect } from 'react';
import '../styles/welcome.css';
import WelcomeNavbar from '../components/welcome/WelcomeNavbar';
import HeroCinematicScene from '../components/welcome/HeroCinematicScene';
import AboutSection from '../components/welcome/AboutSection';
import MonitoringSection from '../components/welcome/MonitoringSection';
import WorkflowSection from '../components/welcome/WorkflowSection';
import TechnologySection from '../components/welcome/TechnologySection';
import WhyGeoVisionSection from '../components/welcome/WhyGeoVisionSection';
import CtaFooterSection from '../components/welcome/CtaFooterSection';

export default function WelcomePage() {
  useEffect(() => {
    document.title = 'GeoVision AI — Earth Observation & Spatial Intelligence';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="gv-welcome-root min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-600 selection:text-white">
      {/* Agency Navigation Header */}
      <WelcomeNavbar />

      {/* Hero: Light-Themed 3D Earth, Sentinel Satellite, and 5-Scene Cinematic Sequence */}
      <HeroCinematicScene />

      {/* Section 01: About GeoVision AI & Biophysical Remote Sensing Foundations */}
      <AboutSection />

      {/* Section 02: Dedicated Monitoring Modules (Deforestation, Mining, Flood) */}
      <MonitoringSection />

      {/* Section 03: 5-Stage Scientific Processing Pipeline */}
      <WorkflowSection />

      {/* Section 04: Verified Technology Stack */}
      <TechnologySection />

      {/* Section 05: Scientific Standards & Verification Principles */}
      <WhyGeoVisionSection />

      {/* Final Action & Scientific/Legal Disclaimers Footer */}
      <CtaFooterSection />
    </div>
  );
}
