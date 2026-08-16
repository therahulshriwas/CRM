// frontend/src/components/common/GalacticBackground.jsx
// Global galactic backdrop: layered aurora blobs, drifting nebulae, a static starfield,
// and periodic shooting stars. Rendered behind all authenticated pages for the "living" feel.
// Used in: components/layout/AppLayout.jsx.

import React, { useEffect, useMemo, useRef } from 'react';

function GalacticBackground() {
  const engineRef = useRef(null);

  // Generate stable, depth-weighted particles once so rendering stays deterministic.
  const particles = useMemo(() => {
    const list = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 112; i++) {
      list.push({
        top: `${(rand() * 100).toFixed(2)}%`,
        left: `${(rand() * 100).toFixed(2)}%`,
        size: rand() > 0.9 ? 3 : rand() > 0.55 ? 2 : 1,
        opacity: (0.16 + rand() * 0.38).toFixed(2),
        depth: rand() > 0.72 ? 'far' : rand() > 0.38 ? 'mid' : 'near',
        delay: `${(-rand() * 28).toFixed(2)}s`,
      });
    }
    return list;
  }, []);

  const dust = useMemo(() => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: 46 }, (_, index) => ({
      top: `${(rand() * 100).toFixed(2)}%`,
      left: `${(rand() * 100).toFixed(2)}%`,
      size: `${(1 + rand() * 2).toFixed(1)}px`,
      delay: `${(-rand() * 22).toFixed(2)}s`,
      duration: `${(18 + rand() * 22).toFixed(2)}s`,
      index,
    }));
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    let frame = 0;

    const setPaused = () => engine.classList.toggle('is-paused', document.hidden || reducedMotion.matches);
    const onPointerMove = (event) => {
      if (coarsePointer.matches || reducedMotion.matches) return;
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        engine.style.setProperty('--cursor-x', `${(x * 100).toFixed(2)}%`);
        engine.style.setProperty('--cursor-y', `${(y * 100).toFixed(2)}%`);
        engine.style.setProperty('--cursor-dx', `${((x - 0.5) * 18).toFixed(2)}px`);
        engine.style.setProperty('--cursor-dy', `${((y - 0.5) * 14).toFixed(2)}px`);
      });
    };

    setPaused();
    document.addEventListener('visibilitychange', setPaused);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    reducedMotion.addEventListener?.('change', setPaused);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', setPaused);
      window.removeEventListener('pointermove', onPointerMove);
      reducedMotion.removeEventListener?.('change', setPaused);
    };
  }, []);

  return (
    <div ref={engineRef} className="galaxy-engine" aria-hidden="true">
      <div className="galaxy-canvas" />
      <div className="galaxy-disk" />
      <div className="galaxy-nebula galaxy-nebula-one" />
      <div className="galaxy-nebula galaxy-nebula-two" />
      <div className="galaxy-nebula galaxy-nebula-three" />
      <div className="galaxy-beam galaxy-beam-one" />
      <div className="galaxy-beam galaxy-beam-two" />
      <div className="galaxy-ribbon galaxy-ribbon-one" />
      <div className="galaxy-ribbon galaxy-ribbon-two" />

      <div className="galaxy-stars">
        {particles.map((particle, index) => (
          <span
            key={index}
            className={`galaxy-star galaxy-star-${particle.depth}`}
            style={{ top: particle.top, left: particle.left, width: particle.size, height: particle.size, opacity: particle.opacity, animationDelay: particle.delay }}
          />
        ))}
      </div>

      <div className="galaxy-dust">
        {dust.map((particle) => (
          <span
            key={particle.index}
            className="galaxy-dust-particle"
            style={{ top: particle.top, left: particle.left, width: particle.size, height: particle.size, animationDelay: particle.delay, '--dust-duration': particle.duration }}
          />
        ))}
      </div>

      <svg className="galaxy-constellations" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <g>
          <path d="M80 150 L190 98 L286 168 L372 116" />
          <path d="M840 112 L935 196 L1035 132 L1130 210" />
          <path d="M170 650 L280 570 L390 632 L470 548" />
          <path d="M770 600 L860 520 L970 582 L1080 492" />
        </g>
        <g className="constellation-nodes">
          {[['80', '150'], ['190', '98'], ['286', '168'], ['372', '116'], ['840', '112'], ['935', '196'], ['1035', '132'], ['1130', '210'], ['170', '650'], ['280', '570'], ['390', '632'], ['470', '548'], ['770', '600'], ['860', '520'], ['970', '582'], ['1080', '492']].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" />
          ))}
        </g>
      </svg>

      <div className="galaxy-cursor-field" />
      <div className="galaxy-grain" />
      <div className="galaxy-vignette" />
    </div>
  );
}

export default GalacticBackground;
