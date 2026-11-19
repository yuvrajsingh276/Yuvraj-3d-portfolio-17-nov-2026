import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ToolSpec } from '../scene/showcaseLogic';

interface ShowcaseHUDProps {
  hoveredTool: ToolSpec | null;
  hoverAnchorRef: React.RefObject<HTMLDivElement | null>;
  latestAnchorRef: React.RefObject<{ x: number; y: number } | null>;
  contextLost: boolean;
}

const HUD_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ShowcaseHUD: React.FC<ShowcaseHUDProps> = ({
  hoveredTool,
  hoverAnchorRef,
  latestAnchorRef,
  contextLost,
}) => {
  React.useLayoutEffect(() => {
    const el = hoverAnchorRef.current;
    const anchor = latestAnchorRef.current;
    if (el && anchor) {
      el.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  }, [hoveredTool?.id, hoverAnchorRef, latestAnchorRef]);

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* WebGL Context Lost Fallback */}
      <AnimatePresence>
        {contextLost && (
          <div className="flex h-full w-full items-end justify-center p-4 sm:p-6">
            <motion.div
              key="hud-context-lost"
              role="alert"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.35, ease: HUD_EASE }}
              className="pointer-events-auto max-w-md rounded-2xl border border-amber-400/30 bg-[#121622] p-5 text-center shadow-2xl"
            >
              <p className="text-sm font-semibold text-slate-100">
                3D Rendering Context Interrupted
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                Your browser paused WebGL rendering. Reload the page to restore the 3D orbital stage.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Small floating tool name + role label anchored smoothly over the hovered orbiting icon */}
      <div
        ref={hoverAnchorRef}
        style={{ willChange: 'transform' }}
        className="pointer-events-none fixed left-0 top-0"
      >
        <AnimatePresence mode="wait">
          {hoveredTool && (
            <motion.div
              key={hoveredTool.id}
              role="status"
              aria-live="polite"
              data-testid="tool-hover-label"
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.16, ease: HUD_EASE }}
              style={{
                borderColor: `${hoveredTool.accentHex}55`,
                boxShadow: `0 10px 28px rgba(5, 4, 18, 0.72), 0 0 18px ${hoveredTool.accentHex}26`,
              }}
              className="flex items-center gap-2 rounded-xl border bg-[#0c0a22]/90 px-3 py-1.5 backdrop-blur-md"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: hoveredTool.accentHex,
                  boxShadow: `0 0 8px ${hoveredTool.accentHex}`,
                }}
              />
              <div className="flex flex-col leading-none">
                <span className="whitespace-nowrap text-[12px] font-semibold tracking-[0.01em] text-white">
                  {hoveredTool.name}
                </span>
                <span className="mt-0.5 whitespace-nowrap text-[10.5px] font-medium tracking-[0.02em] text-indigo-200/80">
                  {hoveredTool.role}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
