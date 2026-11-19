import { useEffect, useRef, useState, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Film, Menu, X } from 'lucide-react';
import { ShowcaseStage } from './scene/ShowcaseStage';
import { ParticleWaveBackground } from './components/ParticleWaveBackground';
import { ShowcaseHUD } from './components/ShowcaseHUD';
import type { ToolSpec } from './scene/showcaseLogic';
import { WorkGallery, ProjectDetailPage } from './components/WorkGallery';
import { ExperienceAbout } from './components/ExperienceAbout';
import { MagneticNavLink } from './components/MagneticNavLink';
import { SectionDotNav } from './components/SectionDotNav';
import { CustomCursor } from './components/CustomCursor';
import {
  resolveActiveSection,
  SECTION_THEMES,
  type PageSectionId,
} from './components/sectionNavUtils';

type NavSectionId = 'home' | 'work' | 'experience' | 'about';

const NAV_ITEMS: readonly { id: NavSectionId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'about', label: 'About' },
];

const HERO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<ShowcaseStage | null>(null);

  const [hoveredTool, setHoveredTool] = useState<ToolSpec | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolSpec | null>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [activeSection, setActiveSection] = useState<PageSectionId>('home');
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(() => window.location.hash.match(/^#project\/(\d{2})$/)?.[1] ?? null);

  useEffect(() => {
    const syncProjectRoute = () => setProjectId(window.location.hash.match(/^#project\/(\d{2})$/)?.[1] ?? null);
    window.addEventListener('hashchange', syncProjectRoute);
    return () => window.removeEventListener('hashchange', syncProjectRoute);
  }, []);

  const openProject = useCallback((id: string) => { window.location.hash = `project/${id}`; }, []);
  const returnToCollection = useCallback(() => { window.location.hash = 'work'; }, []);

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

  useEffect(() => {
    const updateActiveNav = () => {
      const vh = window.innerHeight || 900;
      setNavScrolled(window.scrollY > vh * 0.25);

      const videoEl = document.getElementById('intro-video');
      const workEl = document.getElementById('work');
      const expEl = document.getElementById('experience');
      const aboutEl = document.getElementById('about');

      const next = resolveActiveSection(
        {
          videoTop: videoEl ? videoEl.getBoundingClientRect().top : null,
          workTop: workEl ? workEl.getBoundingClientRect().top : null,
          experienceTop: expEl ? expEl.getBoundingClientRect().top : null,
          aboutTop: aboutEl ? aboutEl.getBoundingClientRect().top : null,
        },
        vh
      );
      setActiveSection((prev) => (prev === next ? prev : next));
    };

    updateActiveNav();
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveNav);
  }, []);

  const scrollToSection = useCallback((sectionId: PageSectionId, targetId: string) => {
    setMobileMenuOpen(false);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.getElementById(targetId);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY + (sectionId === 'about' ? 0 : 2);
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const handleNavClick = useCallback(
    (e: ReactMouseEvent<HTMLAnchorElement>, id: NavSectionId) => {
      e.preventDefault();
      window.dispatchEvent(new Event('portfolio:navigate'));
      if (projectId) {
        window.location.hash = id;
        requestAnimationFrame(() => scrollToSection(id, id));
      } else {
        scrollToSection(id, id);
      }
    },
    [scrollToSection, projectId]
  );

  useEffect(() => {
    if (!projectId) {
      const section = window.location.hash.slice(1) as PageSectionId;
      if (['home', 'work', 'experience', 'about'].includes(section)) {
        requestAnimationFrame(() => scrollToSection(section, section));
      }
    }
  }, [projectId, scrollToSection]);

  const activeTheme = SECTION_THEMES[activeSection];

  return (
    <MotionConfig reducedMotion="user">
      <div id="home" className={`relative isolate flow-root min-h-screen bg-[#010207] ${projectId ? "min-h-0 overflow-x-hidden" : ""}`}>
      {!projectId && <>
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

        {/* Interactive WebGL scene above particle grid */}
        <div
          ref={canvasMountRef}
          data-testid="showcase-canvas-mount"
          className="absolute inset-0 z-[2] h-full w-full"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[3]"
          style={{
            background: 'radial-gradient(460px circle at var(--pointer-x, 50%) var(--pointer-y, 50%), rgba(139, 92, 246, 0.14), transparent 64%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Centralized Golden Ratio hero typography aligned inside orbital ring */}
        <AnimatePresence>
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
            className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center px-6 sm:pt-12"
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
                className="mx-auto mt-1.5 max-w-[230px] sm:mt-2 sm:max-w-none text-[0.786rem] sm:text-[1.272rem] leading-[1.382] font-medium tracking-[0.02em] text-[#c8d1e6] text-balance"
              >
                Creative Technologist • 3D Artist • Motion Designer
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.28, ease: HERO_EASE }}
                className="mx-auto mt-2 max-w-[210px] sm:mt-3 sm:max-w-[540px] text-[0.6875rem] sm:text-[1rem] leading-[1.48] sm:leading-[1.618] font-normal text-[#8e98b2] text-balance"
              >
                Designing immersive digital experiences through 3D, motion, CGI and interactive technology.
              </motion.p>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Animated mouse-wheel scroll indicator (only active while hero is uncovered) */}
        {!contextLost && !navScrolled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.4, ease: HERO_EASE }}
            aria-label="Scroll down"
            className="pointer-events-none fixed bottom-6 left-1/2 z-10 flex h-11 w-7 -translate-x-1/2 items-start justify-center rounded-full border border-violet-300/40 bg-[#090d1b]/45 p-1.5 shadow-[0_0_22px_rgba(139,92,246,0.22)]"
          >
            <motion.span
              aria-hidden="true"
              animate={{ y: [0, 10, 0], opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
              className="h-2 w-1 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.9)]"
            />
          </motion.div>
        )}

        {/* WebGL Context Lost fallback HUD */}
        <ShowcaseHUD
          hoveredTool={null}
          selectedTool={null}
          contextLost={contextLost}
          onResetView={handleResetView}
        />
      </main>

      </>}

      {/* Architectural 3-zone top navigation bar */}
      <header
        className={`fixed inset-x-0 top-0 z-[60] border-b backdrop-blur-md transition-colors duration-300 ${
          navScrolled
            ? 'border-white/[0.1] bg-[#04060e]/92 shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
            : 'border-white/[0.06] bg-[#04060e]/75'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-5 sm:px-8 lg:px-12">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, 'home')}
            className="shrink-0 whitespace-nowrap portfolio-body font-semibold tracking-[0.16em] text-white transition-opacity duration-200 hover:opacity-85"
          >
            YUVRAJ<span className="transition-colors duration-300" style={{ color: activeTheme.accentHex }}>.</span>
          </a>

          {/* Zone 2: Clean single-line typographic nav links with magnetic Framer Motion hover */}
          <nav aria-label="Main navigation" className="hidden items-center gap-3 sm:flex md:gap-5">
            {NAV_ITEMS.map((item) => (
              <MagneticNavLink
                key={item.id}
                href={`#${item.id}`}
                label={item.label}
                isActive={activeSection === item.id}
                accentHex={SECTION_THEMES[item.id].accentHex}
                onClick={(e) => handleNavClick(e, item.id)}
              />
            ))}
          </nav>

          {/* Zone 3: Single primary action + mobile menu toggle */}
          <div className="flex shrink-0 items-center gap-3">
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, 'about')}
              style={{
                borderColor: `${activeTheme.accentHex}59`,
                backgroundColor: `${activeTheme.accentHex}1f`,
              }}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 portfolio-meta font-medium tracking-[0.04em] text-white transition-all duration-200 hover:brightness-125"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: activeTheme.accentHex }}
              />
              <span>Let’s Talk</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] text-white/85 transition-colors hover:bg-white/[0.08] sm:hidden"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-white/[0.08] bg-[#04060e]/95 px-5 py-3 sm:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                const itemAccent = SECTION_THEMES[item.id].accentHex;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 portfolio-body font-medium transition-colors ${
                      isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-[#9aa5bd] hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span
                        className="h-3.5 w-0.5 rounded-full"
                        style={{ backgroundColor: itemAccent }}
                        aria-hidden="true"
                      />
                    )}
                  </a>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {!projectId && <>
      {/* Persistent right-side dot navigation */}
      {!projectId && <SectionDotNav activeSection={activeSection} onSelectSection={scrollToSection} />}

      {/* Hero viewport spacer before Video section slides up over the fixed hero */}
      {!projectId && <div className="pointer-events-none h-[100svh]" aria-hidden="true" />}

      {/* Section 01 · Video: Warm Cinema Amber & Crimson Velvet (#11090e) */}
      {!projectId && <section id="intro-video" aria-label="Video introduction" className="relative z-20 h-[230svh]">
        <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden border-t border-amber-300/15 bg-[#11090e] px-5 pt-20 pb-8 sm:px-8 sm:pt-24 sm:pb-12 lg:px-12">
          {/* Layer 1: Atmospheric warm cinema lighting */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 74% 58% at 50% 42%, rgba(245, 158, 11, 0.16), rgba(225, 29, 72, 0.07) 46%, transparent 74%), linear-gradient(155deg, #1b0e15 0%, #11090e 58%, #0a0508 100%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'linear-gradient(rgba(245, 158, 11, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.045) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Layer 2: Framed architectural cinema stage with specular border depth */}
          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <div className="relative flex min-h-[58svh] sm:min-h-[66svh] flex-col items-center justify-center overflow-hidden rounded-2xl border border-amber-300/20 bg-gradient-to-b from-[#1e1218]/90 via-[#150b11]/95 to-[#0c0609]/95 px-6 py-12 text-center shadow-[0_32px_90px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(253,230,138,0.14)] backdrop-blur-sm">
              {/* Viewfinder corner ticks */}
              <span aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l border-t border-amber-300/45 sm:left-6 sm:top-6" />
              <span aria-hidden="true" className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r border-t border-amber-300/45 sm:right-6 sm:top-6" />
              <span aria-hidden="true" className="pointer-events-none absolute bottom-4 left-4 h-4 w-4 border-b border-l border-amber-300/45 sm:bottom-6 sm:left-6" />
              <span aria-hidden="true" className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 border-b border-r border-amber-300/45 sm:bottom-6 sm:right-6" />

              <div className="mb-5 inline-flex items-center gap-2.5 rounded-md border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-amber-200">
                <Film size={14} className="text-amber-300" aria-hidden="true" />
                <span className="portfolio-eyebrow text-amber-200/90">01 / SHOWREEL &amp; INTRODUCTION</span>
              </div>

              <h2 className="portfolio-heading-heroic bg-gradient-to-b from-amber-50 via-amber-100 to-amber-300/80 bg-clip-text font-semibold tracking-[0.12em] text-transparent sm:tracking-[0.18em]">
                VIDEO
              </h2>

              <p className="portfolio-meta mt-5 max-w-md uppercase tracking-[0.24em] text-amber-100/50">
                Full-screen 16:9 cinema reel slot
              </p>
            </div>
          </div>
        </div>
      </section>}

      {/* Section 02 · Work: Deep Oceanic Slate & Electric Cyan (#071019) */}
      {!projectId && <div id="work" className="relative z-30 -mt-[100svh] h-[230svh]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden border-t border-sky-300/15 bg-[#071019] pt-16">
          <WorkGallery onOpenProject={openProject} />
        </div>
      </div>}

      {/* Sections 03 & 04 · Experience (Deep Emerald Slate) & About (Aubergine Indigo) */}
      {!projectId && <ExperienceAbout />}

      {/* Precision dual-layer magnetic custom cursor */}
      {!projectId && <CustomCursor accentHex={activeTheme.accentHex} accentGlow={activeTheme.accentGlow} />}
      </>}

      {projectId && <ProjectDetailPage projectId={projectId} onBack={returnToCollection} onNext={openProject} />}
      </div>
    </MotionConfig>
  );
}
