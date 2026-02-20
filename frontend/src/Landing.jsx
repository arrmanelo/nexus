import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════
//  НАСТРОЙКИ СТАРТАПА — меняй только здесь
// ═══════════════════════════════════════════════════════
const CONFIG = {
  brand: "NEXUS",
  tagline: "Build the future,",
  tagline2: "ship today.",
  description:
    "The all-in-one platform that transforms how modern teams create, collaborate and launch products at light speed.",
  cta: "Start for free",
  ctaSecondary: "Watch demo",
  accentColor: "#00f5d4",
  features: [
    {
      icon: "⬡",
      title: "Instant Deploy",
      desc: "Push to production in seconds. Zero config, zero headaches.",
    },
    {
      icon: "◈",
      title: "AI-Powered",
      desc: "Intelligent automation that learns your workflow and accelerates it.",
    },
    {
      icon: "⬟",
      title: "Scale Freely",
      desc: "From 1 user to 1 million. Infrastructure that grows with you.",
    },
    {
      icon: "◇",
      title: "Secure by Default",
      desc: "Enterprise-grade security baked in at every layer.",
    },
  ],
  stats: [
    { value: "10x", label: "Faster shipping" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "50k+", label: "Teams worldwide" },
    { value: "$0", label: "To get started" },
  ],
  nav: ["Product", "Pricing", "Docs", "Blog"],
};
// ═══════════════════════════════════════════════════════

// Three.js Canvas Background
function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const W = el.clientWidth;
    const H = el.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.position.set(0, 0, 80);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // ── Particle Field ──────────────────────────────────
    const particleCount = 3000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const palette = [
      new THREE.Color("#00f5d4"),
      new THREE.Color("#0099ff"),
      new THREE.Color("#7b2fff"),
      new THREE.Color("#ffffff"),
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // ── Floating Geometric Rings ────────────────────────
    const meshes = [];
    const ringData = [
      { r: 28, tube: 0.15, color: "#00f5d4", x: -20, y: 10, z: -30 },
      { r: 18, tube: 0.1, color: "#0099ff", x: 25, y: -8, z: -20 },
      { r: 40, tube: 0.08, color: "#7b2fff", x: 5, y: 20, z: -60 },
    ];

    ringData.forEach((d) => {
      const g = new THREE.TorusGeometry(d.r, d.tube, 16, 100);
      const m = new THREE.MeshBasicMaterial({
        color: d.color,
        transparent: true,
        opacity: 0.35,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(d.x, d.y, d.z);
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      meshes.push(mesh);
      scene.add(mesh);
    });

    // ── Icosahedron ─────────────────────────────────────
    const icoGeo = new THREE.IcosahedronGeometry(12, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: "#00f5d4",
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.position.set(30, -5, -10);
    scene.add(ico);

    // ── Grid Plane ──────────────────────────────────────
    const gridHelper = new THREE.GridHelper(400, 40, "#0a1628", "#0a1628");
    gridHelper.position.y = -60;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);

    // ── Mouse parallax ──────────────────────────────────
    let mouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Resize ──────────────────────────────────────────
    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Animate ─────────────────────────────────────────
    let frame;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      particles.rotation.y = t * 0.015;
      particles.rotation.x = t * 0.005;

      meshes.forEach((m, i) => {
        m.rotation.x += 0.001 + i * 0.0005;
        m.rotation.y += 0.002 + i * 0.0003;
        m.position.y += Math.sin(t * 0.3 + i) * 0.015;
      });

      ico.rotation.x += 0.003;
      ico.rotation.y += 0.005;

      // Smooth parallax
      camera.position.x += (mouse.x * 15 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 8 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "radial-gradient(ellipse at 30% 20%, #050d1a 0%, #020609 60%, #000 100%)",
      }}
    />
  );
}

// Animated counter hook
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const isNum = !isNaN(parseFloat(target));
        if (!isNum) return;
        const num = parseFloat(target);
        const step = num / (duration / 16);
        let cur = 0;
        const timer = setInterval(() => {
          cur = Math.min(cur + step, num);
          setCount(cur);
          if (cur >= num) clearInterval(timer);
        }, 16);
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// Feature Card
function FeatureCard({ icon, title, desc, delay }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ${delay}ms ease, transform 0.7s ${delay}ms ease`,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(0,245,212,0.12)",
        borderRadius: "16px",
        padding: "36px 32px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(0,245,212,0.06)";
        e.currentTarget.style.borderColor = "rgba(0,245,212,0.4)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(0,245,212,0.12)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "80px", height: "80px",
        background: "radial-gradient(circle, rgba(0,245,212,0.08) 0%, transparent 70%)",
        borderRadius: "0 16px 0 0",
      }} />
      <div style={{
        fontSize: "28px", marginBottom: "20px",
        color: "#00f5d4", filter: "drop-shadow(0 0 8px rgba(0,245,212,0.5))",
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: "18px", fontWeight: 700, color: "#fff",
        marginBottom: "12px", fontFamily: "'Syne', sans-serif",
        letterSpacing: "0.02em",
      }}>
        {title}
      </h3>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", margin: 0 }}>
        {desc}
      </p>
    </div>
  );
}

// Stat Item
function StatItem({ value, label, delay }) {
  const isSpecial = isNaN(parseFloat(value));
  const { count, ref } = useCounter(isSpecial ? "0" : parseFloat(value));
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const display = isSpecial ? value : (
    value.includes("%") ? count.toFixed(1) + "%" :
    value.includes("k") ? Math.floor(count) + "k+" :
    value.includes("x") ? Math.floor(count) + "x" : value
  );

  return (
    <div
      ref={wrapRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: `all 0.6s ${delay}ms ease`,
        textAlign: "center",
      }}
    >
      <div
        ref={ref}
        style={{
          fontSize: "clamp(42px, 6vw, 72px)",
          fontWeight: 900,
          fontFamily: "'Syne', sans-serif",
          background: "linear-gradient(135deg, #00f5d4, #0099ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
          marginBottom: "10px",
          filter: "drop-shadow(0 0 20px rgba(0,245,212,0.3))",
        }}
      >
        {display}
      </div>
      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// Main Landing Page
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);

    // Inject fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400&display=swap";
    document.head.appendChild(link);

    // Inject global styles
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { font-family: 'Syne', sans-serif; background: #000; overflow-x: hidden; }
      ::selection { background: rgba(0,245,212,0.25); }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #000; }
      ::-webkit-scrollbar-thumb { background: #00f5d4; border-radius: 3px; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(50px); } to { opacity:1; transform:translateY(0); } }
      @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,245,212,0.3); } 50% { box-shadow: 0 0 40px rgba(0,245,212,0.6); } }
      @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }
      @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
      @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
      @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      @keyframes gradShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const S = {
    page: {
      position: "relative",
      minHeight: "100vh",
      color: "#fff",
      fontFamily: "'Syne', sans-serif",
      overflowX: "hidden",
    },

    // NAV
    nav: {
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      padding: "0 40px",
      height: "72px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: scrolled ? "rgba(2,6,9,0.85)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(0,245,212,0.08)" : "none",
      transition: "all 0.4s ease",
    },
    logo: {
      fontSize: "22px",
      fontWeight: 900,
      letterSpacing: "0.15em",
      color: "#fff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    logoAccent: {
      color: "#00f5d4",
      filter: "drop-shadow(0 0 6px rgba(0,245,212,0.6))",
    },
    navLinks: {
      display: "flex",
      gap: "36px",
      listStyle: "none",
    },
    navLink: {
      fontSize: "13px",
      letterSpacing: "0.08em",
      color: "rgba(255,255,255,0.6)",
      cursor: "pointer",
      textTransform: "uppercase",
      transition: "color 0.2s",
      fontWeight: 500,
    },

    // HERO
    hero: {
      position: "relative",
      zIndex: 1,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "120px 24px 80px",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: "rgba(0,245,212,0.08)",
      border: "1px solid rgba(0,245,212,0.25)",
      borderRadius: "100px",
      padding: "6px 16px",
      fontSize: "12px",
      letterSpacing: "0.1em",
      color: "#00f5d4",
      marginBottom: "36px",
      textTransform: "uppercase",
      animation: "fadeUp 0.8s ease both",
    },
    badgeDot: {
      width: "6px", height: "6px",
      borderRadius: "50%",
      background: "#00f5d4",
      animation: "pulse 2s ease infinite",
    },
    h1: {
      fontSize: "clamp(52px, 9vw, 120px)",
      fontWeight: 900,
      lineHeight: 1.0,
      letterSpacing: "-0.03em",
      marginBottom: "28px",
      animation: "fadeUp 0.9s 0.1s ease both",
    },
    h1Line1: { color: "#fff", display: "block" },
    h1Line2: {
      display: "block",
      background: "linear-gradient(135deg, #00f5d4 0%, #0099ff 50%, #7b2fff 100%)",
      backgroundSize: "200% 200%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animation: "fadeUp 0.9s 0.1s ease both, gradShift 4s ease infinite",
    },
    desc: {
      maxWidth: "560px",
      fontSize: "clamp(15px, 2vw, 18px)",
      lineHeight: 1.8,
      color: "rgba(255,255,255,0.5)",
      marginBottom: "52px",
      animation: "fadeUp 1s 0.2s ease both",
    },
    ctaGroup: {
      display: "flex",
      gap: "16px",
      justifyContent: "center",
      flexWrap: "wrap",
      animation: "fadeUp 1s 0.3s ease both",
    },
    ctaBtn: {
      padding: "16px 36px",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: 700,
      letterSpacing: "0.05em",
      cursor: "pointer",
      border: "none",
      background: "linear-gradient(135deg, #00f5d4, #0099ff)",
      color: "#020609",
      fontFamily: "'Syne', sans-serif",
      animation: "glow 3s ease infinite",
      transition: "transform 0.2s, filter 0.2s",
    },
    ctaBtnGhost: {
      padding: "16px 36px",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: 600,
      letterSpacing: "0.05em",
      cursor: "pointer",
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.15)",
      color: "rgba(255,255,255,0.75)",
      fontFamily: "'Syne', sans-serif",
      transition: "all 0.2s",
    },

    // Scroll hint
    scrollHint: {
      position: "absolute",
      bottom: "40px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      opacity: 0.4,
      animation: "float 3s ease infinite",
    },

    // SECTION
    section: {
      position: "relative",
      zIndex: 1,
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "120px 40px",
    },
    sectionLabel: {
      fontSize: "11px",
      letterSpacing: "0.2em",
      color: "#00f5d4",
      textTransform: "uppercase",
      fontWeight: 600,
      marginBottom: "16px",
    },
    sectionTitle: {
      fontSize: "clamp(32px, 5vw, 56px)",
      fontWeight: 900,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      marginBottom: "20px",
      color: "#fff",
    },
    sectionSub: {
      fontSize: "16px",
      color: "rgba(255,255,255,0.45)",
      lineHeight: 1.8,
      maxWidth: "480px",
      marginBottom: "72px",
    },
    grid4: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "20px",
    },

    // STATS
    statsWrap: {
      position: "relative",
      zIndex: 1,
      background: "rgba(0,245,212,0.03)",
      borderTop: "1px solid rgba(0,245,212,0.08)",
      borderBottom: "1px solid rgba(0,245,212,0.08)",
    },
    statsInner: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "100px 40px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "60px",
    },

    // CTA SECTION
    ctaSection: {
      position: "relative",
      zIndex: 1,
      maxWidth: "900px",
      margin: "0 auto",
      padding: "140px 40px",
      textAlign: "center",
    },
    ctaCard: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(0,245,212,0.15)",
      borderRadius: "24px",
      padding: "80px 60px",
      position: "relative",
      overflow: "hidden",
    },

    // FOOTER
    footer: {
      position: "relative",
      zIndex: 1,
      borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "40px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      maxWidth: "1200px",
      margin: "0 auto",
      flexWrap: "wrap",
      gap: "16px",
    },
  };

  return (
    <div style={S.page}>
      {/* 3D Background */}
      <ThreeBackground />

      {/* Noise overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundSize: "200px 200px", opacity: 0.4,
      }} />

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.logo}>
          <span style={S.logoAccent}>◈</span>
          {CONFIG.brand}
        </div>
        <ul style={S.navLinks}>
          {CONFIG.nav.map((item) => (
            <li key={item}>
              <span
                style={S.navLink}
                onMouseEnter={e => e.target.style.color = "#00f5d4"}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
        <button
          style={{
            ...S.ctaBtn,
            padding: "10px 24px",
            fontSize: "13px",
            animation: "none",
            boxShadow: "none",
          }}
        >
          <a href="/register">Get Started</a>
        </button>
      </nav>

      {/* HERO */}
      <section style={S.hero} ref={heroRef}>
        <div style={S.badge}>
          <span style={S.badgeDot} />
          Now in public beta — Free forever
        </div>

        <h1 style={S.h1}>
          <span style={S.h1Line1}>{CONFIG.tagline}</span>
          <span style={S.h1Line2}>{CONFIG.tagline2}</span>
        </h1>

        <p style={S.desc}>{CONFIG.description}</p>

        <div style={S.ctaGroup}>
          <button
            style={S.ctaBtn}
            onMouseEnter={e => { e.target.style.transform = "scale(1.04)"; e.target.style.filter = "brightness(1.15)"; }}
            onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.filter = "none"; }}
          >
            {CONFIG.cta} →
          </button>
          <button
            style={S.ctaBtnGhost}
            onMouseEnter={e => { e.target.style.borderColor = "rgba(0,245,212,0.4)"; e.target.style.color = "#fff"; }}
            onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.color = "rgba(255,255,255,0.75)"; }}
          >
            ▶ {CONFIG.ctaSecondary}
          </button>
        </div>

        {/* Floating dashboard mockup */}
        <div style={{
          marginTop: "80px",
          width: "min(860px, 90vw)",
          height: "min(440px, 45vw)",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0,245,212,0.15)",
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
          animation: "float 6s ease infinite",
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 60px rgba(0,245,212,0.04)",
        }}>
          {/* Fake browser chrome */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            {["#ff5f57","#febc2e","#28c840"].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
            <div style={{
              flex: 1, marginLeft: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "6px",
              height: "24px",
              display: "flex", alignItems: "center",
              paddingLeft: "12px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.05em",
            }}>
              app.nexus.io/dashboard
            </div>
          </div>
          {/* Dashboard content */}
          <div style={{ padding: "24px", display: "flex", gap: "16px", height: "calc(100% - 49px)" }}>
            {/* Sidebar */}
            <div style={{ width: "140px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {["Overview","Analytics","Projects","Settings","Deploy"].map((item, i) => (
                <div key={item} style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: i === 0 ? "rgba(0,245,212,0.1)" : "transparent",
                  border: i === 0 ? "1px solid rgba(0,245,212,0.2)" : "1px solid transparent",
                  fontSize: "11px",
                  color: i === 0 ? "#00f5d4" : "rgba(255,255,255,0.3)",
                }}>
                  {item}
                </div>
              ))}
            </div>
            {/* Main area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Metric cards */}
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { label: "Revenue", val: "$128.4k", change: "+24%" },
                  { label: "Users", val: "48,291", change: "+11%" },
                  { label: "Uptime", val: "99.99%", change: "stable" },
                ].map(m => (
                  <div key={m.label} style={{
                    flex: 1, padding: "14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                  }}>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "6px" }}>{m.label}</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{m.val}</div>
                    <div style={{ fontSize: "10px", color: "#00f5d4", marginTop: "4px" }}>{m.change}</div>
                  </div>
                ))}
              </div>
              {/* Fake chart */}
              <div style={{
                flex: 1,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "10px",
                position: "relative",
                overflow: "hidden",
                display: "flex", alignItems: "flex-end",
                padding: "16px",
                gap: "6px",
              }}>
                {[40,65,45,80,60,90,70,85,55,92,75,88].map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${h}%`,
                    background: `linear-gradient(180deg, rgba(0,245,212,${0.3 + i/30}) 0%, rgba(0,153,255,0.1) 100%)`,
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s ease",
                  }} />
                ))}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(0deg, rgba(0,245,212,0.03) 0%, transparent 60%)",
                }} />
              </div>
            </div>
          </div>
          {/* Scan line animation */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(180deg, transparent 0%, rgba(0,245,212,0.03) 50%, transparent 100%)",
            height: "40%",
            animation: "scan 4s ease infinite",
          }} />
        </div>

        <div style={S.scrollHint}>
          <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: "1px", height: "40px", background: "linear-gradient(180deg, rgba(0,245,212,0.6), transparent)" }} />
        </div>
      </section>

      {/* FEATURES */}
      <section style={S.section}>
        <div style={S.sectionLabel}>Features</div>
        <h2 style={S.sectionTitle}>Everything you need.<br />Nothing you don't.</h2>
        <p style={S.sectionSub}>
          We stripped away the complexity so you can focus on building what matters.
        </p>
        <div style={S.grid4}>
          {CONFIG.features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 100} />
          ))}
        </div>
      </section>

      {/* STATS */}
      <div style={S.statsWrap}>
        <div style={S.statsInner}>
          {CONFIG.stats.map((s, i) => (
            <StatItem key={s.label} {...s} delay={i * 120} />
          ))}
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <section style={S.section}>
        <div style={S.sectionLabel}>Testimonials</div>
        <h2 style={{ ...S.sectionTitle, marginBottom: "56px" }}>Loved by builders</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {[
            { quote: "Nexus cut our deploy time from 40 minutes to under 30 seconds. It's not even a comparison anymore.", name: "Sarah Chen", role: "CTO at Verve" },
            { quote: "The developer experience is in a league of its own. Our team was productive from day one.", name: "Marcus Rodriguez", role: "Lead Engineer at Drift" },
            { quote: "We scaled from 0 to 200k users without touching infra once. That's the magic of Nexus.", name: "Aisha Patel", role: "Founder at Solana Labs" },
          ].map((t, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "32px",
              transition: "all 0.3s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,245,212,0.25)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ fontSize: "24px", color: "#00f5d4", marginBottom: "16px" }}>❝</div>
              <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", marginBottom: "24px" }}>
                {t.quote}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #00f5d4, #0099ff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 700, color: "#020609",
                }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={S.ctaSection}>
        <div style={S.ctaCard}>
          {/* Glow blobs */}
          <div style={{
            position: "absolute", top: "-60px", left: "-60px",
            width: "200px", height: "200px",
            background: "radial-gradient(circle, rgba(0,245,212,0.15) 0%, transparent 70%)",
            borderRadius: "50%", filter: "blur(20px)",
          }} />
          <div style={{
            position: "absolute", bottom: "-60px", right: "-60px",
            width: "200px", height: "200px",
            background: "radial-gradient(circle, rgba(123,47,255,0.15) 0%, transparent 70%)",
            borderRadius: "50%", filter: "blur(20px)",
          }} />

          <div style={{ position: "relative" }}>
            <div style={S.sectionLabel}>Get started today</div>
            <h2 style={{ ...S.sectionTitle, marginBottom: "16px" }}>
              Ready to build<br />something great?
            </h2>
            <p style={{ ...S.sectionSub, margin: "0 auto 48px", textAlign: "center" }}>
              Join 50,000+ teams already shipping faster with {CONFIG.brand}.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                style={{ ...S.ctaBtn, padding: "18px 48px", fontSize: "16px" }}
                onMouseEnter={e => { e.target.style.transform = "scale(1.05)"; }}
                onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}
              >
                {CONFIG.cta} — it's free →
              </button>
              <button style={S.ctaBtnGhost}>Talk to sales</button>
            </div>
            <p style={{ marginTop: "24px", fontSize: "12px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
              No credit card required · Setup in 60 seconds · Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ ...S.footer, borderTop: "1px solid rgba(255,255,255,0.06)", maxWidth: "100%", padding: "40px 80px" }}>
        <div style={S.logo}>
          <span style={S.logoAccent}>◈</span>
          {CONFIG.brand}
          <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
            © 2025
          </span>
        </div>
        <div style={{ display: "flex", gap: "32px" }}>
          {["Privacy", "Terms", "Security", "Status"].map(item => (
            <span
              key={item}
              style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", cursor: "pointer", letterSpacing: "0.05em", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#00f5d4"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
            >
              {item}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
