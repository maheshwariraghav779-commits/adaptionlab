import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function WelcomeNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Monitoring', href: '#monitoring' },
    { name: 'Workflow', href: '#workflow' },
    { name: 'Technology', href: '#technology' },
    { name: 'Why GeoVision', href: '#why-geovision' },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-sky-100 py-3 shadow-sm'
          : 'bg-white/70 backdrop-blur-sm border-b border-sky-100/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand matching Reference Image */}
          <Link to="/welcome" className="flex items-center gap-2.5 text-decoration-none group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-sky-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18" />
                  <path d="M3 12h18" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-slate-900">GEOVISION</span>
                <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-sky-600 text-white shadow-xs">
                  AI
                </span>
              </div>
              <span className="block text-[9px] tracking-wider text-slate-500 uppercase font-bold">
                Earth Observation Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors tracking-wide"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Launch Dashboard CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/"
              className="gv-btn-primary !py-2.5 !px-5 text-sm font-semibold rounded-lg shadow-sm"
            >
              <span>Launch Dashboard</span>
              <span className="text-base">→</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 border-t border-slate-200 bg-white/95 rounded-xl p-4 shadow-lg border border-sky-100 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-200">
              <Link
                to="/"
                className="gv-btn-primary w-full text-center justify-center !py-2.5 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Launch Dashboard →
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
