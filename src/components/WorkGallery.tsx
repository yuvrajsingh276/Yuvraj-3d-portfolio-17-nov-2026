import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';

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

export function WorkGallery() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const detailScrollRef = useRef<HTMLDivElement>(null);
  const previousPageScroll = useRef(0);
  const previousBodyOverflow = useRef('');
  const previousHtmlOverflow = useRef('');
  const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dragging, setDragging] = useState(false);

  const moveTrack = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.min(track.clientWidth * 0.72, 560), behavior: reduceMotion ? 'auto' : 'smooth' });
  };

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
    drag.current = { active: true, moved: false, startX: event.clientX, scrollLeft: track.scrollLeft };
    setDragging(true);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || !trackRef.current) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 5) drag.current.moved = true;
    trackRef.current.scrollLeft = drag.current.scrollLeft - delta;
  };
  const onPointerUp = () => {
    drag.current.active = false;
    setDragging(false);
    requestAnimationFrame(() => { drag.current.moved = false; });
  };

  return (
    <section className="work-exhibition relative w-full overflow-hidden bg-[#03050b] py-20 sm:py-28" aria-label="Selected projects">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-9 flex items-end justify-between gap-5 px-6 sm:px-10 lg:px-16">
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[.32em] text-violet-300/75">02 / Selected projects</p>
            <h2 className="text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-none tracking-[-.055em] text-white">A few things I’ve made<span className="text-violet-300">.</span></h2>
            <p className="mt-3 text-xs tracking-wide text-white/40 sm:text-sm">An ongoing collection of motion, image and digital craft.</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button type="button" onClick={() => moveTrack(-1)} aria-label="Scroll projects left" className="portfolio-icon-button rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"><ArrowLeft size={17} /></button>
            <button type="button" onClick={() => moveTrack(1)} aria-label="Scroll projects right" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"><ArrowRight size={17} /></button>
          </div>
        </div>

        <div
          ref={trackRef}
          className={`work-gallery-track group/gallery no-scrollbar flex items-center gap-4 overflow-x-auto px-6 pb-8 pt-5 sm:gap-6 sm:px-10 lg:gap-8 lg:px-16 ${dragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
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
              whileHover={reduceMotion ? undefined : { y: -10, scale: 1.035 }}
              whileFocus={reduceMotion ? undefined : { y: -8, scale: 1.025 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              aria-label={`Open project: ${project.title}`}
              className={`group relative w-[126px] min-w-[126px] sm:w-[150px] sm:min-w-[150px] hover:w-[250px] hover:min-w-[250px] sm:hover:w-[310px] sm:hover:min-w-[310px] focus-visible:w-[250px] focus-visible:min-w-[250px] sm:focus-visible:w-[310px] sm:focus-visible:min-w-[310px] shrink-0 overflow-hidden rounded-[5px] border border-white/[.12] bg-[#10121b] text-left shadow-[0_18px_55px_rgba(0,0,0,.32)] outline-none transition-[width,min-width,filter,border-color,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] opacity-80 group-hover/gallery:opacity-45 hover:!opacity-100 focus-visible:!opacity-100 hover:border-white/35 focus-visible:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/70 ${index % 2 === 0 ? 'mt-0' : 'mt-14'}`}
              style={{ aspectRatio: '0.69' }}
            >
              <Artwork mood={project.mood} label={`PROJECT ${project.id}`} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:p-5">
                <p className="mb-2 text-[8px] font-semibold tracking-[.25em] text-white/55 sm:text-[9px]">{project.category}</p>
                <h3 className="max-w-[15ch] text-lg font-medium leading-tight tracking-[-.025em] text-white sm:text-xl">{project.title}</h3>
                <span className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[.2em] text-white/55 transition-colors group-hover:text-white">Explore project <ArrowUpRight size={12} /></span>
              </div>
              <span className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 text-[9px] uppercase tracking-[.24em] text-white/30 sm:px-10 lg:px-16">
          <span>Drag to explore</span><span>01 — 05</span>
        </div>
      </div>

      <AnimatePresence>
        {activeProject && (
          <motion.div
            key="project-detail-overlay"
            className="fixed inset-0 z-[100] bg-[#05060b] text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          >
            <div ref={detailScrollRef} className="h-full overflow-y-auto overscroll-contain" tabIndex={-1}>
              <div className="relative min-h-[78vh] sm:min-h-[88vh]">
                <motion.div layoutId={`project-cover-${activeProject.id}`} className="absolute inset-0 overflow-hidden">
                  <Artwork mood={activeProject.mood} label={`PROJECT ${activeProject.id} / SELECTED WORK`} className="h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05060b] via-black/20 to-black/25" />
                </motion.div>
                <button data-close-project type="button" onClick={closeProject} aria-label="Close project and return to gallery" className="portfolio-icon-button fixed right-5 top-5 z-[110] rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-xl transition hover:rotate-90 hover:bg-white/15 sm:right-8 sm:top-8"><X size={21} /></button>
                <div className="relative z-10 flex min-h-[78vh] flex-col justify-end px-6 pb-12 pt-28 sm:min-h-[88vh] sm:px-12 sm:pb-16 lg:px-20">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[.32em]" style={{ color: activeProject.accent }}>{activeProject.category}</p>
                  <h2 className="max-w-4xl text-[clamp(2.7rem,8vw,7.5rem)] font-semibold leading-[.94] tracking-[-.06em]">{activeProject.title}</h2>
                  <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">{activeProject.description}</p>
                  <div className="mt-8 flex items-center gap-3 text-[9px] uppercase tracking-[.25em] text-white/45"><span className="h-px w-10 bg-white/35" /> Scroll to explore the project</div>
                </div>
              </div>

              <div className="mx-auto max-w-[1500px] px-6 pb-24 pt-12 sm:px-10 sm:pt-20 lg:px-16">
                <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-5">
                  <div><p className="mb-2 text-[9px] uppercase tracking-[.3em] text-white/35">Selected frames / {activeProject.id}</p><h3 className="text-3xl font-medium tracking-[-.04em] sm:text-5xl">Gallery<span style={{ color: activeProject.accent }}>.</span></h3></div>
                  <span className="pb-1 text-[9px] uppercase tracking-[.22em] text-white/35">{activeProject.galleryImages.length} frames</span>
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
                        className={`relative overflow-hidden border border-white/10 bg-[#11131c] ${spans[index % spans.length]}`}
                        style={{ aspectRatio: index % 3 === 1 ? '4 / 5' : index % 3 === 2 ? '5 / 4' : '16 / 10' }}
                      >
                        <Artwork mood={artworkColors[(projects.findIndex((project) => project.id === activeProject.id) * 3 + index) % artworkColors.length]} label={`FRAME 0${index + 1}`} className="h-full w-full min-h-[240px]" />
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-20 flex justify-between border-t border-white/10 pt-6 text-[9px] uppercase tracking-[.24em] text-white/40"><span>End of project</span><button type="button" onClick={closeProject} className="transition hover:text-white">Back to all work ↑</button></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
