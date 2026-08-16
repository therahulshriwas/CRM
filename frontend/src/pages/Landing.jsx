// frontend/src/pages/Landing.jsx
// Public marketing landing page. Cinematic hero with animated headline, perspective cyber grid,
// cursor spotlight, floating orbs, live-ish KPI counters, feature grid with 3D tilt cards,
// and CTA funnel into login/register. Fully Framer Motion driven.
// Used in: App.jsx public "/" route (redirects to /app when authenticated).

import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Zap,
  BarChart3,
  Users2,
  GitBranch,
  MessageSquare,
  ShieldCheck,
  Rocket,
  Bot,
  CalendarDays,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  staggerWords,
  wordVariants,
  heroLineVariants,
  heroScaleVariants,
  staggerContainer,
  revealVariants,
  hoverLift,
  iconPop,
  magnetic,
  easeOutExpo,
} from '../animations/variants';

const HERO_WORDS = ['Command', 'every', 'revenue', 'signal'];

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Pipeline Intelligence',
    desc: 'Drag, drop and watch deals flow through a living 9-stage pipeline with instant velocity insights.',
    color: '#7C3AED',
  },
  {
    icon: Users2,
    title: 'Lead War Room',
    desc: 'Capture, qualify and route leads with role-scoped visibility — no more data silos.',
    color: '#3B82F6',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Live revenue, source mix, funnels and heatmaps stream to your dashboard over websockets.',
    color: '#10B981',
  },
  {
    icon: MessageSquare,
    title: 'Team Telemetry',
    desc: 'Conversations, notifications and AI copilot support ride alongside every sales decision.',
    color: '#A855F7',
  },
  {
    icon: Bot,
    title: 'AI Copilot',
    desc: 'An embedded assistant that summarizes deals and surfaces next-best-actions while you work.',
    color: '#C084FC',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Scoped Security',
    desc: 'Admin, team lead and agent tiers keep sensitive revenue data locked to the right people.',
    color: '#F59E0B',
  },
];

const KPIS = [
  { value: 99.99, decimals: 2, suffix: '%', label: 'Uptime' },
  { value: 40, decimals: 0, suffix: '%', label: 'Faster Close' },
  { value: 3, decimals: 0, suffix: '×', label: 'Pipeline Speed' },
  { value: 24, decimals: 0, suffix: '/7', label: 'Live Telemetry' },
];

const MODULE_TAGS = [
  'Leads', 'Deals Pipeline', 'Customers', 'Calendar', 'Team Chat', 'Invoices', 'Reports', 'Employees', 'AI Copilot',
];

function CountUp({ value, decimals = 0, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="text-shimmer font-display text-4xl font-bold tracking-tight">
      {display.toFixed(decimals)}{suffix}
    </span>
  );
}

function Landing() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const heroRef = useRef(null);
  const [spot, setSpot] = useState({ x: 50, y: 50 });
  const [featureTilt, setFeatureTilt] = useState(null);

  // Signed-in users are routed straight into the command deck.
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const onMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-bg-base text-text-primary overflow-x-hidden">
      {/* ============ ANIMATED GALACTIC BACKDROP ============ */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-base via-bg-secondary to-bg-base" />
        <div className="aurora-blob top-[-10%] left-[-5%] w-[560px] h-[560px] bg-accent-primary opacity-25" />
        <div className="aurora-blob top-[15%] right-[-10%] w-[520px] h-[520px] bg-accent-highlight opacity-20" />
        <div className="aurora-blob bottom-[-15%] left-[30%] w-[600px] h-[600px] bg-info opacity-15" />
        <div className="starfield">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="rounded-full absolute"
              style={{
                top: `${(i * 37) % 100}%`,
                left: `${(i * 53) % 100}%`,
                width: i % 7 === 0 ? 3 : 2,
                height: i % 7 === 0 ? 3 : 2,
                opacity: 0.2 + ((i * 13) % 40) / 100,
              }}
            />
          ))}
        </div>
      </div>

      {/* ============ NAV BAR ============ */}
      <motion.header
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOutExpo }}
        className="relative z-30 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="p-2 rounded-xl bg-gradient-to-br from-accent-primary via-accent-highlight to-accent-secondary-glow shadow-[0_0_20px_rgba(124,58,237,0.5)]"
          >
            <Rocket size={18} className="text-white" />
          </motion.div>
          <div>
            <h1 className="font-display font-semibold text-base leading-tight text-text-primary">Trimax-CRM</h1>
            <span className="text-[9px] uppercase tracking-[0.3em] text-text-secondary font-medium">Sales Engine</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-text-secondary font-medium">
          {['Platform', 'Pipeline', 'Analytics', 'Security'].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-text-primary transition-colors cursor-pointer">
              {l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/login">
            <motion.span
              whileHover={{ y: -2 }}
              className="text-xs font-semibold text-text-secondary hover:text-text-primary px-3 py-2 rounded-xl transition-colors cursor-pointer inline-block"
            >
              Sign In
            </motion.span>
          </Link>
          <Link to="/register">
            <motion.span
              whileHover={{ y: -2, boxShadow: '0 6px 28px rgba(124,58,237,0.55)' }}
              className="shine-sweep text-xs font-semibold text-white px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary via-accent-highlight to-accent-primary bg-[length:200%_100%] cursor-pointer inline-block"
            >
              Get Started
            </motion.span>
          </Link>
        </div>
      </motion.header>

      {/* ============ HERO ============ */}
      <section ref={heroRef} onMouseMove={onMove} className="relative z-20 max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="cyber-grid" />
        <div className="scanlines" />
        <div className="spotlight" style={{ '--mx': `${spot.x}%`, '--my': `${spot.y}%` }} />

        {/* Floating orbs */}
        <motion.div
          className="float-bob absolute top-16 left-[8%] w-3 h-3 rounded-full bg-accent-highlight shadow-[0_0_18px_#A855F7]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        />
        <motion.div
          className="float-bob-delay absolute top-40 right-[12%] w-2 h-2 rounded-full bg-info shadow-[0_0_16px_#3B82F6]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        />
        <motion.div
          className="float-bob absolute bottom-24 left-[42%] w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_16px_#10B981]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        />

        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-accent-primary/20 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-glow mb-8"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-glow opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-glow" />
            </span>
            Trimax-CRM Sales Engine.
          </motion.div>

          {/* Split-word animated headline */}
          <motion.h1
            variants={staggerWords}
            initial="initial"
            animate="animate"
            className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight text-text-primary"
            style={{ perspective: 600 }}
          >
            {HERO_WORDS.map((w, i) => (
              <motion.span key={i} variants={wordVariants} className="inline-block mr-[0.22em]">
                {i === 3 ? (
                  <span className="text-shimmer">{w}</span>
                ) : (
                  w
                )}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            variants={heroLineVariants}
            initial="initial"
            animate="animate"
            className="mt-6 text-base md:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed"
          >
            Trimax-CRM fuses a living pipeline, real-time analytics and an AI copilot into one
            galactic command deck for high-velocity sales teams.
          </motion.p>

          <motion.div
            variants={heroLineVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register">
              <motion.span
                variants={magnetic}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="shine-sweep inline-flex items-center gap-2 text-sm font-semibold text-white px-7 py-3.5 rounded-2xl bg-gradient-to-r from-accent-primary via-accent-highlight to-accent-primary bg-[length:200%_100%] shadow-[0_8px_40px_rgba(124,58,237,0.5)] cursor-pointer"
              >
                Launch Command Deck
                <ArrowRight size={16} />
              </motion.span>
            </Link>
            <Link to="/login">
              <motion.span
                variants={magnetic}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="glass inline-flex items-center gap-2 text-sm font-semibold text-text-primary px-7 py-3.5 rounded-2xl hover:bg-overlay/5 cursor-pointer"
              >
                <Sparkles size={16} className="text-accent-glow" />
                Explore the Live Demo
              </motion.span>
            </Link>
          </motion.div>
        </div>

        {/* Floating dashboard mock */}
        <motion.div
          variants={heroScaleVariants}
          initial="initial"
          animate="animate"
          className="relative mt-20 max-w-4xl mx-auto"
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-accent-primary/40 via-accent-highlight/30 to-info/40 blur-2xl opacity-60" />
          <div className="relative glass-deep rounded-3xl p-6 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-5">
              <span className="w-3 h-3 rounded-full bg-danger/70" />
              <span className="w-3 h-3 rounded-full bg-warning/70" />
              <span className="w-3 h-3 rounded-full bg-success/70" />
              <span className="ml-3 text-[10px] uppercase tracking-widest text-text-secondary/60 font-mono">Trimax://command-deck</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { k: 'Total Revenue', v: '$1.24M', c: 'text-success' },
                { k: 'Pipeline Value', v: '$3.8M', c: 'text-accent-glow' },
                { k: 'Active Deals', v: '142', c: 'text-info' },
                { k: 'Conversion', v: '28.6%', c: 'text-warning' },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl bg-overlay/3 border border-overlay/8 p-3.5">
                  <span className="block text-[9px] uppercase tracking-wider text-text-secondary/50 font-semibold">{s.k}</span>
                  <span className={`block mt-1 font-display font-bold text-lg ${s.c}`}>{s.v}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-overlay/3 border border-overlay/8 p-4 flex items-end gap-1.5 h-[120px]">
                {[40, 65, 50, 80, 60, 92, 74].map((h, i) => (
                  <motion.span
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-accent-primary to-accent-secondary-glow"
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.7, ease: easeOutExpo }}
                  />
                ))}
              </div>
              <div className="rounded-2xl bg-overlay/3 border border-overlay/8 p-4 flex flex-col gap-2 justify-center">
                {[
                  { l: 'Qualified', pct: 82, c: 'from-accent-primary to-accent-highlight' },
                  { l: 'Proposal Sent', pct: 64, c: 'from-accent-highlight to-accent-secondary-glow' },
                  { l: 'Won', pct: 41, c: 'from-info to-success' },
                ].map((b) => (
                  <div key={b.l}>
                    <div className="flex justify-between text-[9px] uppercase tracking-wider text-text-secondary/60 font-semibold mb-1">
                      <span>{b.l}</span><span>{b.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-overlay/10 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${b.c}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${b.pct}%` }}
                        transition={{ delay: 0.9 + b.pct / 100, duration: 0.9, ease: easeOutExpo }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ LOGO / MODULE MARQUEE ============ */}
      <section className="relative z-20 py-10 border-y border-overlay/5">
        <div className="overflow-hidden relative">
          <div className="flex gap-8 w-max animate-marquee">
            {[...MODULE_TAGS, ...MODULE_TAGS].map((tag, i) => (
              <span key={i} className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-text-secondary/50 font-semibold whitespace-nowrap">
                <span className="w-1 h-1 rounded-full bg-accent-glow" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="platform" className="relative z-20 max-w-7xl mx-auto px-6 py-16 md:py-20">
        <motion.div
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center max-w-2xl mx-auto mb-8"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-accent-glow font-bold">The Platform</span>
          <h2 className="mt-3 font-display font-bold text-3xl md:text-5xl tracking-tight text-text-primary">
            One command deck for the <span className="text-shimmer">entire revenue loop</span>
          </h2>
          <p className="mt-4 text-text-secondary text-sm md:text-base">
            Every module shares one live nervous system — update a deal and the pipeline,
            analytics and team feed react instantly.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={hoverLift}
              whileHover="hover"
              whileTap="tap"
              onMouseEnter={() => setFeatureTilt(f.title)}
              onMouseLeave={() => setFeatureTilt(null)}
              className="hover-lift group relative rounded-3xl glass p-6 cursor-pointer"
              style={{
                transform: featureTilt === f.title ? 'perspective(900px) rotateX(4deg) rotateY(-4deg)' : 'none',
                transition: 'transform 0.3s ease',
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(420px circle at 50% 0%, ${f.color}1f, transparent 65%)` }}
              />
              <motion.div
                variants={iconPop}
                whileHover="hover"
                className="relative w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${f.color}14`, boxShadow: `0 0 24px ${f.color}40` }}
              >
                <f.icon size={20} style={{ color: f.color }} />
              </motion.div>
              <h3 className="relative text-text-primary font-display font-semibold text-base mb-2">{f.title}</h3>
              <p className="relative text-text-secondary text-xs leading-relaxed">{f.desc}</p>
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-2/3 transition-all duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ============ KPI STRIP ============ */}
      <section className="relative z-20 max-w-6xl mx-auto px-6 py-10">
        <div className="gradient-card p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {KPIS.map((k) => (
            <div key={k.label} className="flex flex-col items-center gap-1.5">
              <CountUp value={k.value} decimals={k.decimals} suffix={k.suffix} />
              <span className="text-[10px] uppercase tracking-[0.25em] text-text-secondary/60 font-semibold">{k.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section id="security" className="relative z-20 max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
        <motion.div
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="relative glass-deep rounded-3xl p-10 md:p-16 overflow-hidden"
        >
          <div className="cyber-grid opacity-30" />
          <div className="float-bob absolute top-8 right-10 w-2.5 h-2.5 rounded-full bg-accent-highlight shadow-[0_0_20px_#A855F7]" />
          <div className="float-bob-delay absolute bottom-10 left-12 w-2 h-2 rounded-full bg-info shadow-[0_0_16px_#3B82F6]" />
          <div className="relative">
            <Zap size={26} className="mx-auto mb-5 text-accent-glow animate-pulse" />
            <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight text-text-primary">
              Ready to <span className="text-shimmer">launch</span>?
            </h2>
            <p className="mt-4 text-text-secondary text-sm md:text-base max-w-lg mx-auto">
              Spin up your workspace in seconds and put your pipeline into lightspeed.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <motion.span
                  variants={magnetic}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className="shine-sweep inline-flex items-center gap-2 text-sm font-semibold text-white px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent-primary via-accent-highlight to-accent-primary bg-[length:200%_100%] shadow-[0_8px_40px_rgba(124,58,237,0.5)] cursor-pointer"
                >
                  Start Free
                  <ArrowRight size={16} />
                </motion.span>
              </Link>
              <Link to="/login">
                <motion.span
                  variants={magnetic}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className="glass inline-flex items-center gap-2 text-sm font-semibold text-text-primary px-8 py-3.5 rounded-2xl hover:bg-overlay/5 cursor-pointer"
                >
                  <CalendarDays size={16} className="text-accent-glow" />
                  Book a Tour
                </motion.span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-20 border-t border-overlay/5 py-8 text-center text-[11px] text-text-secondary/50">
        <span className="flex items-center justify-center gap-1.5">
          <Sparkles size={12} className="text-accent-glow" />
          Trimax-CRM — Sales Engine. Made by Rahul Shriwas.
        </span>
      </footer>
    </div>
  );
}

export default Landing;
