import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { computeMagneticOffset } from './magneticUtils';

type Project = {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  heroImage: string;
  galleryImages: string[];
  description: string;
  accent: string;
  mood: string;
};

const projects: Project[] = [
  {
    id: '01', title: 'Future of Family Healthcare', category: '3D / CGI FILM',
    coverImage: 'cover-01', heroImage: 'hero-01',
    galleryImages: ['frame-01-a', 'frame-01-b', 'frame-01-c', 'frame-01-d'],
    description: 'A cinematic visual direction exploring the next generation of connected family healthcare.',
    accent: '#ff7777', mood: 'red',
  },
  {
    id: '02', title: 'Gemora — The Art of Detail', category: 'PRODUCT VISUALIZATION',
    coverImage: 'cover-02', heroImage: 'hero-02',
    galleryImages: ['frame-02-a', 'frame-02-b', 'frame-02-c'],
    description: 'A refined product story built around material, light, precision and elegant composition.',
    accent: '#ffe36a', mood: 'yellow',
  },
  {
    id: '03', title: 'Beyond the Frame', category: 'MOTION DESIGN',
    coverImage: 'cover-03', heroImage: 'hero-03',
    galleryImages: ['frame-03-a', 'frame-03-b', 'frame-03-c', 'frame-03-d'],
    description: 'An exploration of rhythm, graphic form and dimensional motion for a bold visual identity.',
    accent: '#65baff', mood: 'blue',
  },
  {
    id: '04', title: 'Digital Dimensions', category: 'BRAND EXPERIENCE',
    coverImage: 'cover-04', heroImage: 'hero-04',
    galleryImages: ['frame-04-a', 'frame-04-b', 'frame-04-c'],
    description: 'A visual system that brings brand language into a tactile, immersive digital space.',
    accent: '#ff9acb', mood: 'pink',
  },
  {
    id: '05', title: 'The Shape of Tomorrow', category: '3D ART DIRECTION',
    coverImage: 'cover-05', heroImage: 'hero-05',
    galleryImages: ['frame-05-a', 'frame-05-b', 'frame-05-c', 'frame-05-d'],
    description: 'A study in atmosphere, sculptural form and cinematic lighting.',
    accent: '#64e39b', mood: 'green',
  },
  {
    id: '06', title: 'Neon Form Studies', category: 'CONCEPT / 3D STUDY',
    coverImage: 'cover-06', heroImage: 'hero-06',
    galleryImages: ['frame-06-a', 'frame-06-b', 'frame-06-c'],
    description: 'A concept-led exploration of luminous forms, colour and premium product-style lighting.',
    accent: '#b49aff', mood: 'purple',
  },
  {
    id: '07', title: 'Motion in Nature', category: 'CONCEPT / MOTION STUDY',
    coverImage: 'cover-07', heroImage: 'hero-07',
    galleryImages: ['frame-07-a', 'frame-07-b', 'frame-07-c'],
    description: 'A visual study imagining organic movement translated into a bold motion language.',
    accent: '#64e1d1', mood: 'teal',
  },
  {
    id: '08', title: 'The Future Interface', category: 'CONCEPT / UI MOTION',
    coverImage: 'cover-08', heroImage: 'hero-08',
    galleryImages: ['frame-08-a', 'frame-08-b', 'frame-08-c'],
    description: 'A speculative interface concept combining dimensional graphics and kinetic typography.',
    accent: '#65baff', mood: 'blue',
  },
  {
    id: '09', title: 'Objects of Desire', category: 'CONCEPT / PRODUCT CGI',
    coverImage: 'cover-09', heroImage: 'hero-09',
    galleryImages: ['frame-09-a', 'frame-09-b', 'frame-09-c'],
    description: 'A mock product campaign focused on material finish, controlled reflections and visual impact.',
    accent: '#ff9acb', mood: 'pink',
  },
  {
    id: '10', title: 'Beyond the Ordinary', category: 'CONCEPT / BRAND FILM',
    coverImage: 'cover-10', heroImage: 'hero-10',
    galleryImages: ['frame-10-a', 'frame-10-b', 'frame-10-c'],
    description: 'A fictional brand-film direction created to explore cinematic composition and storytelling.',
    accent: '#ffad57', mood: 'orange',
  },
];

const palettes: Record<string, string> = {
  red: 'linear-gradient(145deg,#ff4545 0%,#c91536 100%)',
  yellow: 'linear-gradient(145deg,#ffe36a 0%,#e9a91b 100%)',
  green: 'linear-gradient(145deg,#4ed68a 0%,#087c58 100%)',
  blue: 'linear-gradient(145deg,#57b9ff 0%,#2456c7 100%)',
  pink: 'linear-gradient(145deg,#ff8fc8 0%,#bd3e91 100%)',
  orange: 'linear-gradient(145deg,#ffad57 0%,#e35b28 100%)',
  purple: 'linear-gradient(145deg,#b49aff 0%,#6642c8 100%)',
  teal: 'linear-gradient(145deg,#64e1d1 0%,#168c91 100%)',
};
const artworkColors = ['red', 'yellow', 'green', 'blue', 'pink', 'orange', 'purple', 'teal'];

function Artwork({ mood, label, className = '' }: { mood: string; label: string; className?: string }) {
  const color = palettes[mood] ? mood : artworkColors[Math.abs([...label].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % artworkColors.length];
  return <div aria-label={label} role="img" className={`relative overflow-hidden ${className}`} style={{ background: palettes[color] }} />;
}

const GALLERY_MAGNETIC_SPRING = { stiffness: 320, damping: 22, mass: 0.35 };

function MagneticButton({
  onClick,
  ariaLabel,
  className,
  children,
  dataCloseProject,
}: {
  onClick: () => void;
  ariaLabel: string;
  className: string;
  children: ReactNode;
  dataCloseProject?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, GALLERY_MAGNETIC_SPRING);
  const springY = useSpring(targetY, GALLERY_MAGNETIC_SPRING);

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (reducedMotion || e.pointerType === 'touch' || !buttonRef.current) return;
    const { x, y } = computeMagneticOffset(e.clientX, e.clientY, buttonRef.current.getBoundingClientRect(), {
      strength: 0.34,
      maxX: 9,
      maxY: 9,
      reducedMotion,
    });
    targetX.set(x);
    targetY.set(y);
  };

  const reset = () => {
    targetX.set(0);
    targetY.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      onBlur={reset}
      aria-label={ariaLabel}
      data-close-project={dataCloseProject ? '' : undefined}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

export function WorkGallery() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const previousPageScroll = useRef(0);
  const previousBodyOverflow = useRef('');
  const previousHtmlOverflow = useRef('');
  const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0, pointerId: -1 });
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dragging, setDragging] = useState(false);

  const openProject = useCallback((project: Project) => {
    previousPageScroll.current = window.scrollY;
    previousBodyOverflow.current = document.body.style.overflow;
    previousHtmlOverflow.current = document.documentElement.style.overflow;
    setActiveProject(project);
  }, []);

  const closeProject = useCallback(() => {
    setActiveProject(null);
    document.body.style.overflow = previousBodyOverflow.current;
    document.documentElement.style.overflow = previousHtmlOverflow.current;
    requestAnimationFrame(() => {
      window.scrollTo({ top: previousPageScroll.current, behavior: 'auto' });
      if (activeProject) cardRefs.current[activeProject.id]?.focus({ preventScroll: true });
    });
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    detailScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProject();
      if (event.key === 'Tab') {
        const root = detailScrollRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => detailScrollRef.current?.querySelector<HTMLButtonElement>('[data-close-project]')?.focus());
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousBodyOverflow.current;
      document.documentElement.style.overflow = previousHtmlOverflow.current;
    };
  }, [activeProject, closeProject]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    drag.current = { active: true, moved: false, startX: event.clientX, scrollLeft: track.scrollLeft, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || !trackRef.current) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 5) drag.current.moved = true;
    trackRef.current.scrollLeft = drag.current.scrollLeft - delta;
  };
  const onPointerUp = (event?: ReactPointerEvent<HTMLDivElement>) => {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current.active = false;
    setDragging(false);
    requestAnimationFrame(() => { drag.current.moved = false; });
  };

  const scrollGalleryBy = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * 340, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [reduceMotion]);

  return (
    <section
      className="work-exhibition relative flex h-full w-full items-center overflow-hidden bg-[#071019] py-6 sm:py-10"
      aria-label="Selected projects"
    >
      {/* Layer 1: Deep Oceanic Slate atmospheric keylight & bottom grounding vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 52% at 20% 14%, rgba(56, 189, 248, 0.14), transparent 64%), linear-gradient(180deg, #071019 0%, #091522 54%, #050b12 100%)',
        }}
      />

      <div className="relative z-10 w-full">
        <div className="mx-auto mb-6 flex w-full max-w-7xl items-end justify-between gap-6 pl-5 pr-10 sm:mb-8 sm:px-8 lg:px-12">
          <div>
            <p className="portfolio-eyebrow mb-2.5 text-sky-300/85">02 / Selected projects</p>
            <h2 className="portfolio-heading-section font-semibold tracking-[-0.045em] text-white">
              A few things I’ve made<span className="text-sky-400">.</span>
            </h2>
            <p className="portfolio-body mt-2.5 max-w-lg text-slate-300/65">
              An ongoing collection of motion, image and digital craft.
            </p>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <MagneticButton
              onClick={() => scrollGalleryBy(-1)}
              ariaLabel="Scroll projects left"
              className="portfolio-icon-button rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-400/20"
            >
              <ChevronLeft size={18} />
            </MagneticButton>
            <MagneticButton
              onClick={() => scrollGalleryBy(1)}
              ariaLabel="Scroll projects right"
              className="portfolio-icon-button rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-400/20"
            >
              <ChevronRight size={18} />
            </MagneticButton>
          </div>
        </div>

        <div
          ref={trackRef}
          className={`work-gallery-track group/gallery no-scrollbar flex items-center gap-4 overflow-x-auto pb-6 pt-4 pl-5 pr-6 sm:gap-6 sm:pl-8 sm:pr-10 lg:gap-8 lg:pl-[max(3rem,calc((100vw-80rem)/2+3rem))] lg:pr-16 ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onLostPointerCapture={onPointerUp}
        >
          {projects.map((project, index) => (
            <motion.button
              key={project.id}
              ref={(node) => { cardRefs.current[project.id] = node; }}
              type="button"
              layoutId={`project-cover-${project.id}`}
              onClick={() => { if (!drag.current.moved) openProject(project); drag.current.moved = false; }}
              whileHover={reduceMotion ? undefined : { y: -10, scale: 1.03 }}
              whileFocus={reduceMotion ? undefined : { y: -8, scale: 1.02 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              aria-label={`Open project: ${project.title}`}
              className={`group relative w-[126px] min-w-[126px] sm:w-[152px] sm:min-w-[152px] hover:w-[252px] hover:min-w-[252px] sm:hover:w-[310px] sm:hover:min-w-[310px] focus-visible:w-[252px] focus-visible:min-w-[252px] sm:focus-visible:w-[310px] sm:focus-visible:min-w-[310px] shrink-0 overflow-hidden rounded-xl border border-white/[0.14] bg-[#0b1623] text-left shadow-[0_24px_60px_rgba(0,0,0,0.52)] outline-none transition-[width,min-width,filter,border-color,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] opacity-88 group-hover/gallery:opacity-50 hover:!opacity-100 focus-visible:!opacity-100 hover:border-sky-300/45 focus-visible:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-300/70 ${index % 2 === 0 ? 'mt-0' : 'mt-12'}`}
              style={{ aspectRatio: '0.69' }}
            >
              <Artwork mood={project.mood} label={`PROJECT ${project.id}`} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04]" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20 transition-opacity duration-300 group-hover:from-black/75" />
              <span className="portfolio-meta pointer-events-none absolute left-3 top-3 font-mono font-medium tracking-[0.14em] text-white/75 drop-shadow sm:left-4 sm:top-4">
                {project.id}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:p-5">
                <p className="portfolio-eyebrow mb-2 text-white/75">{project.category}</p>
                <h3 className="portfolio-card-title max-w-[15ch] font-semibold tracking-[-0.025em] text-white">{project.title}</h3>
                <span className="portfolio-meta mt-3 flex items-center gap-2 uppercase tracking-[0.18em] text-white/75 transition-colors group-hover:text-white">
                  Explore project <ArrowUpRight size={13} />
                </span>
              </div>
              <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between pl-5 pr-10 sm:px-8 lg:px-12">
          <span className="portfolio-meta uppercase tracking-[0.22em] text-sky-200/45">Drag to explore</span>
          <span className="portfolio-meta font-mono uppercase tracking-[0.22em] text-sky-200/55">01 — 10</span>
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {activeProject && (
              <motion.div
                key="project-detail-overlay"
                role="dialog" aria-modal="true" aria-label={`${activeProject.title} project details`} tabIndex={-1} className="fixed inset-0 z-[100] bg-[#071019] text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.35 }}
              >
                <div ref={detailScrollRef} className="h-full overflow-y-auto overscroll-contain" tabIndex={-1}>
                  <div className="relative min-h-[78vh] sm:min-h-[88vh]">
                    <motion.div layoutId={`project-cover-${activeProject.id}`} className="absolute inset-0 overflow-hidden">
                      <Artwork mood={activeProject.mood} label={`PROJECT ${activeProject.id} / SELECTED WORK`} className="h-full w-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071019] via-black/25 to-black/30" />
                    </motion.div>
                    <MagneticButton
                      dataCloseProject
                      onClick={closeProject}
                      ariaLabel="Close project and return to gallery"
                      className="portfolio-icon-button fixed right-5 top-5 z-[110] rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-xl transition hover:rotate-90 hover:bg-white/15 sm:right-8 sm:top-8"
                    >
                      <X size={21} />
                    </MagneticButton>
                    <div className="relative z-10 flex min-h-[78vh] flex-col justify-end px-6 pb-12 pt-28 sm:min-h-[88vh] sm:px-12 sm:pb-16 lg:px-20">
                      <p className="portfolio-eyebrow mb-4" style={{ color: activeProject.accent }}>{activeProject.category}</p>
                      <h2 className="portfolio-heading-display max-w-4xl font-semibold tracking-[-0.045em]">{activeProject.title}</h2>
                      <p className="portfolio-body mt-6 max-w-xl text-white/75">{activeProject.description}</p>
                      <div className="portfolio-meta mt-8 flex items-center gap-3 uppercase tracking-[0.22em] text-white/55"><span className="h-px w-10 bg-white/35" /> Scroll to explore the project</div>
                    </div>
                  </div>

                  <div className="mx-auto max-w-[1500px] px-6 pb-24 pt-12 sm:px-10 sm:pt-20 lg:px-16">
                    <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-5">
                      <div><p className="portfolio-eyebrow mb-2 text-white/45">Selected frames / {activeProject.id}</p><h3 className="portfolio-heading-section font-medium tracking-[-0.04em]">Gallery<span style={{ color: activeProject.accent }}>.</span></h3></div>
                      <span className="portfolio-meta pb-1 uppercase tracking-[0.2em] text-white/45">{activeProject.galleryImages.length} frames</span>
                    </div>
                    <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-12 sm:gap-7 lg:gap-10">
                      {activeProject.galleryImages.map((image, index) => {
                        const spans = ['sm:col-span-7', 'sm:col-span-5 sm:mt-24', 'sm:col-span-5 sm:col-start-2', 'sm:col-span-6 sm:col-start-7 sm:-mt-16'];
                        return (
                          <motion.div
                            key={image}
                            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.65, delay: reduceMotion ? 0 : 0.05, ease: [0.22, 1, 0.36, 1] }}
                            className={`relative overflow-hidden rounded-xl border border-white/12 bg-[#0c1826] ${spans[index % spans.length]}`}
                            style={{ aspectRatio: index % 3 === 1 ? '4 / 5' : index % 3 === 2 ? '5 / 4' : '16 / 10' }}
                          >
                            <Artwork mood={artworkColors[(projects.findIndex((project) => project.id === activeProject.id) * 3 + index) % artworkColors.length]} label={`FRAME 0${index + 1}`} className="h-full w-full min-h-[240px]" />
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="portfolio-meta mt-20 flex justify-between border-t border-white/10 pt-6 uppercase tracking-[0.22em] text-white/50">
                      <span>End of project</span>
                      <button type="button" onClick={closeProject} className="transition hover:text-white">Back to all work ↑</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </section>
  );
}
