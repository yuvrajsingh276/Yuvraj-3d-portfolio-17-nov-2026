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

    const stage = new ShowcaseStage(container, {
      onHoverChange: (tool) => setHoveredTool(tool),
      onSelectChange: (tool) => setSelectedTool(tool),
      onContextLostChange: (lost) => setContextLost(lost),
    });
    stageRef.current = stage;

    return () => {
      stage.dispose();
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
      <main
        onPointerMove={(e) => {
          e.currentTarget.style.setProperty('--pointer-x', e.clientX + 'px');
          e.currentTarget.style.setProperty('--pointer-y', e.clientY + 'px');
        }}
        className="relative isolate h-screen w-screen overflow-hidden bg-[#02040a]"
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
          {!contextLost && (
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
              <div className="max-w-[240px] sm:max-w-[560px] text-center overflow-visible">
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.08, ease: HERO_EASE }}
                  className="hero-gradient-text overflow-visible pb-[0.06em] text-[clamp(2.5rem,6.2vw,5.75rem)] font-bold tracking-[0.04em] leading-[1.12]"
                >
                  YUVRAJ
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.18, ease: HERO_EASE }}
                  className="mt-1 sm:mt-1.5 text-[13.5px] sm:text-[17px] md:text-[18px] font-medium leading-snug tracking-[0.02em] text-[#b6bfd3] text-balance"
                >
                  Creative Technologist • 3D Artist • Motion Designer
                </motion.p>
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
    </MotionConfig>
  );
}
