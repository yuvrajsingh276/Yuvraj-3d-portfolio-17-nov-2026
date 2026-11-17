import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ShowcaseStage } from './scene/ShowcaseStage';
import { ParticleWaveBackground } from './components/ParticleWaveBackground';
import { ShowcaseHUD } from './components/ShowcaseHUD';
import type { ToolSpec } from './scene/showcaseLogic';
import { WorkGallery } from './components/WorkGallery';
import { ExperienceAbout } from './components/ExperienceAbout';

const HERO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<ShowcaseStage | null>(null);

  const [hoveredTool, setHoveredTool] = useState<ToolSpec | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolSpec | null>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    let stage: ShowcaseStage | null = null;
    try {
      stage = new ShowcaseStage(container, {
        onHoverChange: (tool) => setHoveredTool(tool),
        onSelectChange: (tool) => setSelectedTool(tool),
        onContextLostChange: (lost) => setContextLost(lost),
      });
      stageRef.current = stage;
    } catch (error) {
      console.error('3D showcase failed to initialize; keeping portfolio content visible.', error);
      setContextLost(true);
    }

    return () => {
      stage?.dispose();
      stageRef.current = null;
    };
  }, []);

  const handleToggleMotion = useCallback(() => {
    setMotionPaused((prev) => {
      const next = !prev;
      stageRef.current?.setMotionPaused(next);
      return next;
    });
  }, []);

  const handleResetView = useCallback(() => {
    stageRef.current?.resetView();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      const interactive = target instanceof HTMLElement && (
        target.isContentEditable || !!target.closest('button, a, input, textarea, select, [role="button"]')
      );
      if (e.key === 'Escape') {
        stageRef.current?.resetView();
      } else if (e.code === 'Space' && !interactive && window.scrollY < window.innerHeight * 0.8) {
        e.preventDefault();
        handleToggleMotion();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleMotion]);

  return (
    <MotionConfig reducedMotion="user">
      <div id="home" className="relative isolate min-h-screen bg-[#010207]">
      <main
        onPointerMove={(e) => {
          e.currentTarget.style.setProperty('--pointer-x', e.clientX + 'px');
          e.currentTarget.style.setProperty('--pointer-y', e.clientY + 'px');
        }}
        className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#010207]"
        data-selected-tool={selectedTool?.id ?? 'none'}
        data-hovered-tool={hoveredTool?.id ?? 'none'}
        data-motion-paused={String(motionPaused)}
      >
        <ParticleWaveBackground />



        {/* Existing interactive WebGL scene stays above the lightweight background */}
        <div
          ref={canvasMountRef}
          data-testid="showcase-canvas-mount"
          className="absolute inset-0 z-[1] h-full w-full"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[1]"
          style={{
            background: 'radial-gradient(560px circle at var(--pointer-x, 50%) var(--pointer-y, 50%), rgba(105, 116, 190, 0.10), transparent 62%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Centralized typography aligned inside orbital ring */}
        <AnimatePresence>
          {(
            <motion.section
              key="hero-profile-layer"
              aria-label="Designer profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{
                opacity: 0,
                y: -12,
                transition: { duration: 0.36, ease: HERO_EASE },
              }}
              transition={{ duration: 0.72, ease: HERO_EASE }}
              className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center px-6"
            >
              <div className="w-full max-w-[92vw] sm:max-w-[760px] lg:max-w-[min(92vw,1100px)] text-center overflow-visible">
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.08, ease: HERO_EASE }}
                  className="hero-gradient-text overflow-visible whitespace-nowrap pb-[0.06em] text-[clamp(1.618rem,6.2vw,4.236rem)] font-bold tracking-[0.04em] leading-[1.12]"
                >
                  YUVRAJ SINGH
                </motion.h1>
                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.18, ease: HERO_EASE }}
                  className="mt-1 sm:mt-1.5 text-[13.5px] sm:text-[17px] md:text-[18px] font-medium leading-snug tracking-[0.02em] text-[#b6bfd3] text-balance"
                >
                  Creative Technologist • 3D Artist • Motion Designer
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.28, ease: HERO_EASE }}
                  className="mt-2 sm:mt-2.5 mx-auto max-w-[230px] sm:max-w-[540px] text-[12px] sm:text-[14px] md:text-[15px] font-normal leading-relaxed text-[#7f889e] text-balance"
                >
                  Designing immersive digital experiences through 3D, motion, CGI and interactive technology.
                </motion.p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Animated mouse-wheel scroll indicator */}
        {!contextLost && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.4, ease: HERO_EASE }}
            aria-label="Scroll down"
            className="pointer-events-none fixed bottom-6 left-1/2 z-10 flex h-11 w-7 -translate-x-1/2 items-start justify-center rounded-full border border-white/45 bg-[#090d1b]/35 p-1.5 shadow-[0_0_22px_rgba(129,92,246,0.18)]"
          >
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, 10, 0], opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-1 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.9)]"
            />
          </motion.div>
        )}

        {/* WebGL Context Lost fallback HUD only (clicking icons scatters without revealing text) */}
        <ShowcaseHUD
          hoveredTool={null}
          selectedTool={null}
          contextLost={contextLost}
          onResetView={handleResetView}
        />
      </main>

      {/* Centered floating navigation */}
      <nav
        aria-label="Main navigation"
        className="portfolio-nav fixed left-1/2 top-4 z-30 -translate-x-1/2 sm:top-5"
      >
        <div className="portfolio-nav-list flex items-center gap-1 rounded-full border border-white/[0.09] bg-[#0a1222]/75 p-1.5 shadow-[0_8px_36px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          {[
            { label: 'Home', href: '#home' },
            { label: 'Work', href: '#work' },
            { label: 'Experience', href: '#experience' },
            { label: 'About', href: '#about' },
          ].map((item) => (
            <a
            key={item.label}
            href={item.href}
            className="portfolio-nav-link rounded-full px-3 py-2.5 text-[10px] font-medium tracking-[0.08em] text-[#aab6cb] transition-all duration-300 hover:bg-white/[0.07] hover:text-white sm:px-5 sm:text-[12px]"
            >
            {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Video section slides over the pinned hero as the visitor scrolls */}
      <section
        id="intro-video"
        aria-label="Video introduction"
        className="relative z-20 mt-[100vh] flex min-h-screen w-full items-center justify-center border-t border-white/[0.06] bg-[#070912] px-6 py-24"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,rgba(111,76,190,0.20),transparent_55%),linear-gradient(135deg,#111525,#080a12_65%,#160d19)]">
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-[#070912]/35 via-transparent to-[#070912]/55" />
          </div>
          <div className="relative z-10 flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center text-center">
            <span className="mb-5 text-[11px] font-medium uppercase tracking-[0.3em] text-violet-300/70">01 / INTRODUCTION</span>
            <span className="text-[clamp(3.5rem,12vw,9rem)] font-semibold tracking-[0.18em] text-white/80">VIDEO</span>
            <span className="mt-4 text-[10px] uppercase tracking-[0.28em] text-white/35">Full-screen video placeholder</span>
          </div>
        </div>
      </section>

      {/* Cinematic horizontal project exhibition; all other portfolio sections remain unchanged */}
      <div id="work" className="relative z-20 border-t border-white/[0.06]">
        <WorkGallery />
      </div>

      {/* Experience marquee and personal profile sections follow the work gallery */}
      <ExperienceAbout />
      </div>
    </MotionConfig>
  );
}
