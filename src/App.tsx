import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ShowcaseStage } from './scene/ShowcaseStage';
import { ParticleWaveBackground } from './components/ParticleWaveBackground';
import { ShowcaseHUD } from './components/ShowcaseHUD';
import type { ToolSpec } from './scene/showcaseLogic';

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        stageRef.current?.resetView();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleToggleMotion();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToggleMotion]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-screen bg-[#010207]">
      <main
        id="home"
        onPointerMove={(e) => {
          e.currentTarget.style.setProperty('--pointer-x', e.clientX + 'px');
          e.currentTarget.style.setProperty('--pointer-y', e.clientY + 'px');
        }}
        className="sticky top-0 z-0 h-screen w-screen overflow-hidden bg-[#010207]"
        data-selected-tool={selectedTool?.id ?? 'none'}
        data-hovered-tool={hoveredTool?.id ?? 'none'}
        data-motion-paused={String(motionPaused)}
      >
        <ParticleWaveBackground />

        {/* Centered floating navigation */}
        <nav
          aria-label="Main navigation"
          className="fixed left-1/2 top-5 z-30 -translate-x-1/2"
        >
          <div className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-[#0a1222]/55 p-1.5 shadow-[0_8px_36px_rgba(0,0,0,0.22)]">
            {[
              { label: 'Home', href: '#home' },
              { label: 'About', href: '#about' },
              { label: 'Work', href: '#work' },
              { label: 'Contact', href: '#contact' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-[11px] font-medium tracking-[0.12em] text-[#aab6cb] transition-all duration-300 hover:bg-white/[0.07] hover:text-white sm:px-5 sm:text-[12px]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

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
                  className="hero-gradient-text overflow-visible whitespace-nowrap pb-[0.06em] text-[clamp(2.1rem,6.2vw,5.75rem)] font-bold tracking-[0.04em] leading-[1.12]"
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

        {/* Bottom-center scroll cue */}
        {!contextLost && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.4, ease: HERO_EASE }}
            className="pointer-events-none fixed bottom-5 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-1.5"
          >
            <span className="text-[10.5px] sm:text-[11px] font-medium tracking-[0.26em] text-[#7f889e] uppercase whitespace-nowrap">
              SCROLL TO EXPLORE
            </span>
            <span
              aria-hidden="true"
              className="h-3.5 w-px bg-gradient-to-b from-[#6366f1]/80 to-transparent"
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

      {/* Video section slides over the pinned hero as the visitor scrolls */}
      <section
        id="about"
        aria-label="Video introduction"
        className="relative z-20 flex min-h-screen w-full items-center justify-center border-t border-white/[0.06] bg-[#070912] px-6 py-24"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-violet-300/70">01 / INTRODUCTION</span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-white/30">VIDEO</span>
          </div>
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_45%,rgba(111,76,190,0.16),transparent_58%),linear-gradient(135deg,#111525,#080a12_65%,#160d19)] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
            <div className="relative flex flex-col items-center gap-3">
              <span className="text-[clamp(2.5rem,8vw,6rem)] font-semibold tracking-[0.18em] text-white/80">VIDEO</span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">Video placeholder</span>
            </div>
          </div>
        </div>
      </section>

      {/* Work section placeholder; visual treatment and animation to be designed next */}
      <section
        id="work"
        aria-label="Selected work"
        className="relative z-20 flex min-h-screen w-full items-center justify-center border-t border-white/[0.06] bg-[#03050b] px-6 py-24"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 text-[11px] font-medium uppercase tracking-[0.3em] text-violet-300/70">02 / SELECTED PROJECTS</div>
          <div className="flex min-h-[55vh] items-center justify-center rounded-2xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_50%,rgba(70,80,130,0.13),transparent_60%),#080b14]">
            <span className="text-[clamp(3rem,11vw,8rem)] font-semibold tracking-[0.2em] text-white/75">WORK</span>
          </div>
        </div>
      </section>
      </div>
    </MotionConfig>
  );
}
