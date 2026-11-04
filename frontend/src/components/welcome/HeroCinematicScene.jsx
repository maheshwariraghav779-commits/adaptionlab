import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';

export default function HeroCinematicScene() {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Animation state references
  const animRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    earthGroup: null,
    earthMesh: null,
    cloudsMesh: null,
    satelliteGroup: null,
    orbitLine: null,
    scanBeam: null,
    targetMarker: null,
    orbitNodes: [],
    reqId: null,
    startTime: null,
    isMounted: true,
  });

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);

    const handleMotionChange = (e) => {
      setIsReducedMotion(e.matches);
    };

    if (mq.addEventListener) {
      mq.addEventListener('change', handleMotionChange);
      return () => mq.removeEventListener('change', handleMotionChange);
    }
  }, []);

  // Procedural Earth texture with vivid daylight oceans and rich continents
  const createEarthTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Vibrant daylight ocean gradient (matching reference image)
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#0284c7'); // Azure blue
    oceanGrad.addColorStop(0.5, '#0ea5e9'); // Sky blue
    oceanGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Continental landmasses helper
    const drawLandmass = (x, y, w, h, col = '#15803d') => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    // North America
    drawLandmass(460, 310, 240, 130, '#15803d');
    drawLandmass(390, 250, 150, 80, '#d97706'); // Deserts
    drawLandmass(520, 250, 180, 80, '#16a34a');

    // South America (Amazon rainforest)
    drawLandmass(630, 640, 140, 200, '#166534');
    drawLandmass(650, 610, 90, 110, '#22c55e');

    // Europe
    drawLandmass(1060, 300, 120, 80, '#15803d');

    // Africa
    drawLandmass(1090, 500, 160, 170, '#b45309'); // Sahara / arid
    drawLandmass(1100, 610, 130, 110, '#15803d'); // Congo basin

    // Asia & India
    drawLandmass(1390, 320, 320, 160, '#166534');
    drawLandmass(1360, 410, 130, 90, '#d97706');
    drawLandmass(1430, 470, 110, 110, '#15803d');

    // Australia
    drawLandmass(1660, 710, 130, 90, '#ea580c');

    // Polar ice caps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, 55);
    ctx.fillRect(0, canvas.height - 65, canvas.width, 65);

    return new THREE.CanvasTexture(canvas);
  }, []);

  // Swirling white clouds texture
  const createCloudsTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      const rw = Math.random() * 100 + 40;
      const rh = Math.random() * 40 + 15;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);

  // Sentinel Satellite 3D Model matching reference image
  const createSatellite = useCallback(() => {
    const satGroup = new THREE.Group();

    // Central body: Golden MLI thermal insulation
    const busGeo = new THREE.BoxGeometry(0.35, 0.35, 0.55);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold MLI
      metalness: 0.8,
      roughness: 0.3,
    });
    const bus = new THREE.Mesh(busGeo, busMat);
    satGroup.add(bus);

    // Silver payload service module
    const serviceGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.35, 24);
    const serviceMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    });
    const service = new THREE.Mesh(serviceGeo, serviceMat);
    service.rotation.x = Math.PI / 2;
    service.position.set(0, 0, -0.38);
    satGroup.add(service);

    // Earth-facing optical instrument aperture (bottom)
    const lensGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.18, 24);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, -0.22, 0);
    satGroup.add(lens);

    // Dual Photovoltaic Solar Panels (wide blue panels as in reference image)
    const panelGeo = new THREE.BoxGeometry(1.25, 0.02, 0.45);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Deep solar blue
      metalness: 0.6,
      roughness: 0.2,
    });

    const leftPanel = new THREE.Mesh(panelGeo, panelMat);
    leftPanel.position.set(-0.85, 0, 0);
    satGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeo, panelMat);
    rightPanel.position.set(0.85, 0, 0);
    satGroup.add(rightPanel);

    // Panel border frames
    const frameGeo = new THREE.BoxGeometry(1.27, 0.025, 0.02);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const leftFrame = new THREE.Mesh(frameGeo, frameMat);
    leftFrame.position.set(-0.85, 0, 0.23);
    satGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(frameGeo, frameMat);
    rightFrame.position.set(0.85, 0, 0.23);
    satGroup.add(rightFrame);

    return satGroup;
  }, []);

  // Initialize Three.js Scene & Continuous Automatic Animation Loop
  useEffect(() => {
    if (!containerRef.current) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGlSupported(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 750;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.05, 5.75);

    // Direct Daylight Sun Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(4, 5, 4);
    scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0xbae6fd, 1.2);
    skyFill.position.set(-4, 2, -2);
    scene.add(skyFill);

    // Earth Group positioned in the lower portion of the view
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, -1.82, 0); // Positioned so curvature forms horizon
    scene.add(earthGroup);

    // Earth Sphere
    const earthGeo = new THREE.SphereGeometry(2.35, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.65,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.rotation.y = -Math.PI * 0.45;
    earthGroup.add(earthMesh);

    // Cloud Sphere
    const cloudsGeo = new THREE.SphereGeometry(2.38, 48, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: createCloudsTexture(),
      transparent: true,
      opacity: 0.55,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    earthGroup.add(cloudsMesh);

    // Atmospheric Glow Ring
    const glowGeo = new THREE.SphereGeometry(2.46, 32, 32);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.38, 0.82, 0.98, 1.0) * intensity * 1.8;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    earthGroup.add(glowMesh);

    // Orbit Ring encircling Earth with glowing node markers
    const orbitCurve = new THREE.EllipseCurve(
      0, 0,
      3.4, 2.9,
      0, 2 * Math.PI,
      false,
      0
    );
    const orbitPoints = orbitCurve.getPoints(120);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map((p) => new THREE.Vector3(p.x, p.y * 0.32, p.y))
    );
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.position.copy(earthGroup.position);
    scene.add(orbitLine);

    // Orbit node markers (glowing dots along the orbit ring)
    const orbitNodes = [];
    for (let i = 0; i < 8; i++) {
      const nodeGeo = new THREE.SphereGeometry(0.035, 12, 12);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const pt = orbitPoints[i * 15];
      node.position.set(pt.x, pt.y * 0.32 + earthGroup.position.y, pt.y);
      scene.add(node);
      orbitNodes.push(node);
    }

    // Sentinel Satellite
    const satelliteGroup = createSatellite();
    satelliteGroup.scale.set(0.75, 0.75, 0.75);
    scene.add(satelliteGroup);

    // Conical Optical/SAR Scanning Beam
    const beamGeo = new THREE.ConeGeometry(0.4, 1.3, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const scanBeam = new THREE.Mesh(beamGeo, beamMat);
    scene.add(scanBeam);

    // Ground Target Marker
    const reticleGeo = new THREE.RingGeometry(0.08, 0.15, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    const targetMarker = new THREE.Mesh(reticleGeo, reticleMat);
    targetMarker.position.set(0.4, 0.3, 2.2);
    earthGroup.add(targetMarker);

    // Save anim state
    animRef.current = {
      scene,
      camera,
      renderer,
      earthGroup,
      earthMesh,
      cloudsMesh,
      satelliteGroup,
      orbitLine,
      scanBeam,
      targetMarker,
      orbitNodes,
      reqId: null,
      startTime: null,
      isMounted: true,
    };

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 750;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Handle Reduced Motion: Render static composition (Scene 5 composition)
    if (isReducedMotion) {
      satelliteGroup.position.set(0, 0.42, 3.35);
      satelliteGroup.rotation.set(0.36, 0, 0);
      satelliteGroup.visible = true;
      scanBeam.material.opacity = 0;
      targetMarker.material.opacity = 0;
      renderer.render(scene, camera);
      if (timelineRef.current) {
        timelineRef.current.textContent = 'NOMINAL // 20.0s';
      }
      return () => {
        window.removeEventListener('resize', handleResize);
        if (renderer) renderer.dispose();
        if (container) container.innerHTML = '';
      };
    }

    // Automatic Continuous Looping Animation Across All 5 Scenes (0 - 20s)
    const animate = (timestamp) => {
      const state = animRef.current;
      if (!state.isMounted) return;

      if (state.startTime === null) state.startTime = timestamp;
      const elapsed = (timestamp - state.startTime) / 1000;
      const loopTime = elapsed % 20; // Automatically loops 0 to 20 seconds continuously without stopping

      // Update telemetry directly on DOM to prevent 60fps React re-renders
      if (timelineRef.current) {
        timelineRef.current.textContent = `${loopTime.toFixed(1)}s / 20.0s`;
      }

      // Continuous rotation of Earth and clouds
      if (earthMesh) earthMesh.rotation.y += 0.0012;
      if (cloudsMesh) cloudsMesh.rotation.y += 0.0016;

      // Pulse orbit nodes
      for (let i = 0; i < orbitNodes.length; i++) {
        const pulse = 1 + Math.sin(elapsed * 3 + i) * 0.15;
        orbitNodes[i].scale.set(pulse, pulse, pulse);
      }

      // Smooth Transitions Across the 5 Cinematic Scenes:
      // Scene 1: Earth Emergence & Orbital Approach (0–4s)
      if (loopTime < 4) {
        const p = loopTime / 4;
        camera.position.set(0, 1.25 - p * 0.2, 6.2 - p * 0.45);
        satelliteGroup.visible = true;
        scanBeam.material.opacity = 0;
        targetMarker.material.opacity = 0;

        // Satellite approaches along the orbital arc into foreground
        const satAngle = -0.8 + p * 0.9;
        const satX = Math.sin(satAngle) * 2.2;
        const satZ = Math.cos(satAngle) * 1.5 + 1.8;
        const satY = 0.35 + Math.sin(p * Math.PI) * 0.12;
        satelliteGroup.position.set(satX, satY, satZ);
        satelliteGroup.rotation.set(0.28, -satAngle * 0.4, 0.1);
      } 
      // Scene 2: Satellite Orbital Transit & Pitch (4–8s)
      else if (loopTime < 8) {
        const p = (loopTime - 4) / 4;
        camera.position.set(0, 1.05, 5.75);
        satelliteGroup.visible = true;
        scanBeam.material.opacity = 0;
        targetMarker.material.opacity = 0;

        // Satellite glides across the front arc into position
        const satAngle = 0.1 + p * 0.7;
        const satX = 0.6 - p * 0.9;
        const satY = 0.45 + Math.sin(p * Math.PI) * 0.08;
        const satZ = 3.25 + Math.sin(p * Math.PI) * 0.15;
        satelliteGroup.position.set(satX, satY, satZ);
        satelliteGroup.rotation.set(0.32 + p * 0.04, satX * 0.3, 0);
      } 
      // Scene 3: Spectral Scanning & Swath Sweep (8–12s)
      else if (loopTime < 12) {
        const p = (loopTime - 8) / 4;
        camera.position.set(0, 1.05, 5.75);
        satelliteGroup.visible = true;

        // Satellite continues sweeping over target area
        const satX = -0.3 + p * 0.5;
        const satY = 0.44 + Math.sin(p * Math.PI) * 0.04;
        const satZ = 3.35;
        satelliteGroup.position.set(satX, satY, satZ);
        satelliteGroup.rotation.set(0.36, 0.05 - p * 0.05, 0);

        // Conical scanning beam actively pulses and sweeps
        scanBeam.material.opacity = 0.32 + Math.sin(p * 24) * 0.1;
        targetMarker.material.opacity = 0.85 + Math.sin(p * 20) * 0.15;
        targetMarker.scale.setScalar(1 + Math.sin(p * 10) * 0.18);

        // Position scanning cone from satellite aperture downward to Earth
        scanBeam.position.set(satX * 0.7, satY - 0.65, satZ - 0.7);
        scanBeam.lookAt(satX * 0.3, -1.82, 0);
        scanBeam.rotateX(Math.PI / 2);
      } 
      // Scene 4: Environmental Intelligence Transition (12–17s)
      else if (loopTime < 17) {
        const p = (loopTime - 12) / 5;
        camera.position.set(0, 1.05, 5.75);
        satelliteGroup.visible = true;

        // Satellite glides gracefully towards the center hero composition
        const satX = 0.2 - p * 0.2;
        const satY = 0.43 - p * 0.01;
        const satZ = 3.35;
        satelliteGroup.position.set(satX, satY, satZ);
        satelliteGroup.rotation.set(0.36, 0, 0);

        // Scanning beam gently fades as analysis settles
        scanBeam.material.opacity = Math.max(0, 0.2 - p * 0.2);
        targetMarker.material.opacity = Math.max(0, 0.6 - p * 0.6);
      } 
      // Scene 5: GeoVision AI Reveal Composition & Continuous Float (17–20s)
      else {
        const p = (loopTime - 17) / 3;
        camera.position.set(0, 1.05, 5.75);
        satelliteGroup.visible = true;
        scanBeam.material.opacity = 0;
        targetMarker.material.opacity = 0;

        // Centered hero composition with micro-drift so it stays alive and seamlessly loops
        const driftX = Math.sin(p * Math.PI * 2) * 0.03;
        const driftY = Math.cos(p * Math.PI * 2) * 0.02;
        satelliteGroup.position.set(driftX, 0.42 + driftY, 3.35);
        satelliteGroup.rotation.set(0.36 + Math.sin(p * Math.PI * 2) * 0.01, 0, 0);
      }

      renderer.render(scene, camera);
      state.reqId = requestAnimationFrame(animate);
    };

    animRef.current.reqId = requestAnimationFrame(animate);

    // Proper Cleanup on Unmount
    return () => {
      animRef.current.isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (animRef.current.reqId) cancelAnimationFrame(animRef.current.reqId);
      if (renderer) renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [createEarthTexture, createCloudsTexture, createSatellite, isReducedMotion]);

  return (
    <section id="hero" className="relative min-h-[92vh] lg:min-h-screen flex flex-col justify-between overflow-hidden pt-28 pb-16 gv-sky-atmosphere">
      
      {/* 3D Three.js WebGL Canvas in Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {webGlSupported ? (
          <div ref={containerRef} className="w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sky-50">
            <span className="text-4xl">🌍</span>
          </div>
        )}
      </div>

      {/* Top Right Live Telemetry Card (Preserved & Automatically Updated) */}
      <div className="absolute top-24 right-4 sm:right-8 z-20 hidden md:block">
        <div className="gv-light-glass px-4 py-3 rounded-lg font-mono text-xs space-y-1.5 border border-sky-100 shadow-sm">
          <div className="flex items-center justify-between gap-6 text-slate-500 text-[11px]">
            <span>PLATFORM</span>
            <span className="text-sky-700 font-bold">COPERNICUS SENTINEL</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-slate-500 text-[11px]">
            <span>ORBIT</span>
            <span className="text-emerald-600 font-bold">786 KM // SUN-SYNCHRONOUS</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-slate-500 text-[11px]">
            <span>SENSOR</span>
            <span className="text-slate-700 font-medium">MSI (10M) + SAR (C-BAND)</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-slate-500 text-[11px]">
            <span>TIMELINE</span>
            <span ref={timelineRef} className="text-sky-800 font-bold">
              {isReducedMotion ? 'NOMINAL // 20.0s' : '0.0s / 20.0s'}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Narrative Typography (Matching Reference Image) */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-2 sm:pt-4">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-sky-200/80 text-sky-800 text-xs font-bold uppercase tracking-wider mb-5 shadow-xs backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Actionable Environmental Intelligence</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-tight mb-2">
          GEOVISION <span className="text-sky-600">AI</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl font-semibold text-sky-600 tracking-normal mb-3">
          &ldquo;See the Earth. Understand the Change.&rdquo;
        </p>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
          An intelligent geospatial platform for environmental monitoring through satellite imagery, multi-temporal analysis, and AI-assisted insights.
        </p>

        {/* Dual Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="gv-btn-secondary"
          >
            <span>Explore GeoVision AI</span>
            <span className="text-slate-500">↓</span>
          </a>
          <Link
            to="/"
            className="gv-btn-primary"
          >
            <span>Launch Dashboard</span>
            <span className="text-base">→</span>
          </Link>
        </div>
      </div>

      {/* Bottom spacer to maintain harmonious composition with Earth and satellite */}
      <div className="relative z-10 h-12 sm:h-20 pointer-events-none" />

    </section>
  );
}
