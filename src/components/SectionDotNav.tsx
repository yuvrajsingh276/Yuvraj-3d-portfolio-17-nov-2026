import { motion } from 'motion/react';
import { PAGE_SECTIONS, type PageSectionId } from './sectionNavUtils';

interface SectionDotNavProps {
  activeSection: PageSectionId;
  onSelectSection: (sectionId: PageSectionId, targetId: string) => void;
}

export function SectionDotNav({ activeSection, onSelectSection }: SectionDotNavProps) {
  return (
    <nav
      aria-label="Section progress navigation"
      className="fixed right-2.5 top-1/2 z-[55] flex -translate-y-1/2 flex-col items-end gap-1.5 sm:right-4"
    >
      {PAGE_SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelectSection(section.id, section.targetId)}
            aria-label={`Jump to ${section.label} section`}
            aria-current={isActive ? 'true' : undefined}
            data-section-dot={section.id}
            data-active={String(isActive)}
            className="group relative flex h-7 items-center justify-end gap-2 px-1 focus-visible:outline-none"
          >
            <span
              style={
                isActive
                  ? {
                      borderColor: `${section.accentHex}66`,
                      color: section.accentHex,
                      backgroundColor: 'rgba(8, 11, 24, 0.92)',
                    }
                  : undefined
              }
              className={`pointer-events-none hidden select-none rounded-md border px-2 py-0.5 text-[0.618rem] font-semibold uppercase tracking-[0.2em] backdrop-blur-md transition-all duration-200 sm:block translate-x-1.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 ${
                isActive
                  ? ''
                  : 'border-white/15 bg-[#080b18]/88 text-white/85'
              }`}
            >
              {section.label}
            </span>

            <span className="relative flex h-4 w-4 items-center justify-center">
              {isActive && (
                <motion.span
                  layoutId="section-dot-active-ring"
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  aria-hidden="true"
                  style={{
                    borderColor: `${section.accentHex}b3`,
                    backgroundColor: `${section.accentHex}24`,
                    boxShadow: `0 0 12px ${section.accentGlow}`,
                  }}
                  className="absolute inset-0 rounded-full border"
                />
              )}
              <span
                aria-hidden="true"
                style={
                  isActive
                    ? {
                        backgroundColor: section.accentHex,
                        boxShadow: `0 0 9px ${section.accentGlow}`,
                      }
                    : undefined
                }
                className={`relative rounded-full transition-all duration-300 ${
                  isActive
                    ? 'h-2 w-2'
                    : 'h-1.5 w-1.5 bg-white/35 group-hover:scale-125 group-hover:bg-white/90 group-focus-visible:scale-125 group-focus-visible:bg-white'
                }`}
              />
            </span>
          </button>
        );
      })}
    </nav>
  );
}
