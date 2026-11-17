import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { ToolSpec } from '../scene/showcaseLogic';

interface ShowcaseHUDProps {
  hoveredTool: ToolSpec | null;
  selectedTool: ToolSpec | null;
  contextLost: boolean;
  onResetView: () => void;
}

const HUD_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ShowcaseHUD: React.FC<ShowcaseHUDProps> = ({
  hoveredTool,
  selectedTool,
  contextLost,
  onResetView,
}) => {
  const activeInspect = selectedTool ?? hoveredTool;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-end p-3 sm:p-5">

      {/* WebGL Context Lost Fallback */}
      <AnimatePresence>
        {contextLost && (
          <motion.div
            key="hud-context-lost"
            role="alert"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.35, ease: HUD_EASE }}
            className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-amber-400/30 bg-[#121622] p-5 text-center shadow-2xl"
          >
            <p className="text-sm font-semibold text-slate-100">
              3D Rendering Context Interrupted
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              Your browser paused WebGL rendering. Reload the page to restore the 3D orbital stage.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Hover / Selection Detail Readout */}
      <div className="pointer-events-none flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          {activeInspect && (
            <motion.div
              key={`${activeInspect.id}-${selectedTool ? 'selected' : 'hover'}`}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.32, ease: HUD_EASE }}
              style={{ borderColor: `${activeInspect.accentHex}38` }}
              className="pointer-events-auto w-full max-w-[min(640px,94vw)] rounded-xl border bg-[#0b0f19]/92 px-4 py-2.5 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm transition-transform duration-300"
                      style={{ backgroundColor: activeInspect.accentHex }}
                      aria-hidden="true"
                    />
                    <h2 className="text-sm font-semibold text-slate-50 truncate">
                      {activeInspect.name}
                    </h2>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      · {activeInspect.category}
                    </span>
                  </div>
                  {selectedTool ? (
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      {selectedTool.summary}{' '}
                      <span className="text-slate-400">{selectedTool.craftNote}</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-400 truncate">
                      {activeInspect.craftNote} · Click to inspect
                    </p>
                  )}
                </div>

                {selectedTool && (
                  <button
                    type="button"
                    onClick={onResetView}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
                    aria-label="Close inspection and reset camera"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
