import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ShowcaseStage } from './scene/ShowcaseStage';
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
  const [bloomIntensity, setBloomIntensity] = useState(0.42);
  const [dofStrength, setDofStrength] = useState(0.55);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const stage = new ShowcaseStage(container, {
      onHoverChange: (tool) => setHoveredTool(tool),
      onSelectChange: (tool) => setSelectedTool(tool),
      onContextLostChange: (lost) => setContextLost(lost),
    });
    stage.setBloomIntensity(0.42);
    stage.setDofStrength(0.55);
    stageRef.current = stage;

    return () => {
      stage.dispose();
      stageRef.current = null;
    };
  }, []);

  const handleBloomChange = useCallback((nextIntensity: number) => {
    const clamped = Math.max(0, Math.min(1, nextIntensity));
    setBloomIntensity(clamped);
    stageRef.current?.setBloomIntensity(clamped);
  }, []);

  const handleDofChange = useCallback((nextStrength: number) => {
    const clamped = Math.max(0, Math.min(1, nextStrength));
    setDofStrength(clamped);
    stageRef.current?.setDofStrength(clamped);
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

  const bloomPercent = Math.round(bloomIntensity * 100);
  const dofPercent = Math.round(dofStrength * 100);

  return (
    <MotionConfig reducedMotion="user">
      <main
        className="relative h-screen w-screen overflow-hidden bg-[#05060c]"
        data-selected-tool={selectedTool?.id ?? 'none'}
        data-hovered-tool={hoveredTool?.id ?? 'none'}
        data-motion-paused={String(motionPaused)}
        data-bloom-intensity={bloomPercent}
        data-dof-strength={dofPercent}
      >
        {/* Isolated WebGL canvas mount container (never re-rendered on HUD state updates) */}
        <div
          ref={canvasMountRef}
          data-testid="showcase-canvas-mount"
          className="absolute inset-0 h-full w-full"
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

        {/* Non-intrusive solid-slate studio optical controls (Bloom + Depth of Field) */}
        {!contextLost && (
          <div
            className="fixed top-4 right-4 sm:top-auto sm:bottom-5 sm:right-5 z-20 flex items-center gap-3 rounded-xl border border-[#23273d] bg-[#0b0d18]/95 px-3 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            role="group"
            aria-label="Studio optical post-processing controls"
          >
            <div className="flex items-center gap-2">
              <label
                htmlFor="bloom-intensity-slider"
                className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#9aa4bc] select-none"
              >
                Bloom
              </label>
              <input
                id="bloom-intensity-slider"
                type="range"
                min={0}
                max={100}
                step={1}
                value={bloomPercent}
                onChange={(e) => handleBloomChange(Number(e.target.value) / 100)}
                aria-label="Bloom glow intensity"
                aria-valuetext={`${bloomPercent}%`}
                className="h-1 w-14 sm:w-20 cursor-pointer accent-[#6366f1]"
              />
              <span className="min-w-[32px] text-right font-mono text-[11px] tabular-nums text-[#dbe3f5]">
                {bloomPercent}%
              </span>
            </div>
            <span aria-hidden="true" className="h-3.5 w-px bg-[#23273d]" />
            <div className="flex items-center gap-2">
              <label
                htmlFor="dof-strength-slider"
                className="text-[11px] font-medium tracking-[0.12em] uppercase text-[#9aa4bc] select-none"
              >
                DOF
              </label>
              <input
                id="dof-strength-slider"
                type="range"
                min={0}
                max={100}
                step={1}
                value={dofPercent}
                onChange={(e) => handleDofChange(Number(e.target.value) / 100)}
                aria-label="Depth of field blur strength"
                aria-valuetext={`${dofPercent}%`}
                className="h-1 w-14 sm:w-20 cursor-pointer accent-[#8b5cf6]"
              />
              <span className="min-w-[32px] text-right font-mono text-[11px] tabular-nums text-[#dbe3f5]">
                {dofPercent}%
              </span>
            </div>
          </div>
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
