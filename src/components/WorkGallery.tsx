import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';

type Project = {
  id: string; title: string; category: string; description: string;
  accent: string; mood: string; galleryImages: string[];
};

const projects: Project[] = [
  { id: '01', title: 'Future of Family Healthcare', category: '3D / CGI FILM', description: 'A cinematic visual direction exploring the next generation of connected family healthcare.', accent: '#ff7777', mood: 'red', galleryImages: ['01 / Key visual', '02 / Product detail', '03 / Motion frame', '04 / Final composition'] },
  { id: '02', title: 'Gemora — The Art of Detail', category: 'PRODUCT VISUALIZATION', description: 'A refined product story built around material, light, precision and elegant composition.', accent: '#ffe36a', mood: 'yellow', galleryImages: ['01 / Hero render', '02 / Material study', '03 / Detail frame'] },
  { id: '03', title: 'Beyond the Frame', category: 'MOTION DESIGN', description: 'An exploration of rhythm, graphic form and dimensional motion for a bold visual identity.', accent: '#65baff', mood: 'blue', galleryImages: ['01 / Art direction', '02 / Motion frame', '03 / Graphic system', '04 / Final frame'] },
  { id: '04', title: 'Digital Dimensions', category: 'BRAND EXPERIENCE', description: 'A visual system that brings brand language into a tactile, immersive digital space.', accent: '#ff9acb', mood: 'pink', galleryImages: ['01 / Visual identity', '02 / Digital application', '03 / Final frame'] },
  { id: '05', title: 'The Shape of Tomorrow', category: '3D ART DIRECTION', description: 'A study in atmosphere, sculptural form and cinematic lighting.', accent: '#64e39b', mood: 'green', galleryImages: ['01 / Sculptural study', '02 / Lighting pass', '03 / Detail frame', '04 / Final render'] },
  { id: '06', title: 'Neon Form Studies', category: 'CONCEPT / 3D STUDY', description: 'A concept-led exploration of luminous forms, colour and premium product-style lighting.', accent: '#b49aff', mood: 'purple', galleryImages: ['01 / Form study', '02 / Lighting study', '03 / Final frame'] },
  { id: '07', title: 'Motion in Nature', category: 'CONCEPT / MOTION STUDY', description: 'A visual study imagining organic movement translated into a bold motion language.', accent: '#64e1d1', mood: 'teal', galleryImages: ['01 / Nature study', '02 / Motion frame', '03 / Final frame'] },
  { id: '08', title: 'The Future Interface', category: 'CONCEPT / UI MOTION', description: 'A speculative interface concept combining dimensional graphics and kinetic typography.', accent: '#65baff', mood: 'blue', galleryImages: ['01 / Interface system', '02 / UI motion', '03 / Final frame'] },
  { id: '09', title: 'Objects of Desire', category: 'CONCEPT / PRODUCT CGI', description: 'A product campaign study focused on material finish, controlled reflections and visual impact.', accent: '#ff9acb', mood: 'pink', galleryImages: ['01 / Product hero', '02 / Material detail', '03 / Final render'] },
  { id: '10', title: 'Beyond the Ordinary', category: 'CONCEPT / BRAND FILM', description: 'A brand-film direction created to explore cinematic composition and storytelling.', accent: '#ffad57', mood: 'orange', galleryImages: ['01 / Story frame', '02 / Visual direction', '03 / Final frame'] },
];

const palettes: Record<string, string> = {
  red: 'linear-gradient(145deg,#ff7777 0%,#4a1728 100%)',
  yellow: 'linear-gradient(145deg,#ffe36a 0%,#594018 100%)',
  green: 'linear-gradient(145deg,#64e39b 0%,#123e37 100%)',
  blue: 'linear-gradient(145deg,#65baff 0%,#142b55 100%)',
  pink: 'linear-gradient(145deg,#ff9acb 0%,#542347 100%)',
  orange: 'linear-gradient(145deg,#ffad57 0%,#54291e 100%)',
  purple: 'linear-gradient(145deg,#b49aff 0%,#30205d 100%)',
  teal: 'linear-gradient(145deg,#64e1d1 0%,#123d48 100%)',
};

function Artwork({ mood, label, className = '' }: { mood: string; label: string; className?: string }) {
  return (
    <div role="img" aria-label={label} className={`relative overflow-hidden ${className}`} style={{ background: palettes[mood] || palettes.blue }}>
      <div aria-hidden="true" className="absolute -right-[18%] -top-[22%] h-[76%] w-[76%] rounded-full border border-white/20 bg-white/[0.08] blur-[1px]" />
      <div aria-hidden="true" className="absolute -bottom-[38%] -left-[12%] h-[90%] w-[90%] rounded-full border border-white/20 bg-black/10" />
      <div aria-hidden="true" className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(125deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%)' }} />
      <span className="absolute bottom-5 left-5 font-mono text-[10px] tracking-[.28em] text-white/55">{label}</span>
    </div>
  );
}

export function WorkGallery() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const touchStart = useRef<number | null>(null);
  const previousScroll = useRef(0);

  const step = useCallback((direction: number) => {
    setActive((current) => (current + direction + projects.length) % projects.length);
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target as HTMLElement;
      if (target.dataset.slideIndex) {
        event.preventDefault();
        setActive(Number(target.dataset.slideIndex));
      }
    }
  }, [step]);

  const openProject = (project: Project) => {
    previousScroll.current = window.scrollY;
    setActiveProject(project);
  };

  const closeProject = useCallback(() => {
    setActiveProject(null);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    requestAnimationFrame(() => window.scrollTo({ top: previousScroll.current, behavior: 'auto' }));
  }, []);

  useEffect(() => {
    if (!activeProject) return;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') closeProject(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [activeProject, closeProject]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    touchStart.current = event.clientX;
    setDragStart(event.clientX);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (touchStart.current !== null) {
      const delta = event.clientX - touchStart.current;
      if (Math.abs(delta) > 45) step(delta < 0 ? 1 : -1);
    }
    touchStart.current = null;
    setDragStart(null);
  };

  return (
    <section aria-label="Selected projects" className="work-exhibition relative flex h-full w-full flex-col justify-center overflow-hidden bg-[#071019] py-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 38%,rgba(56,189,248,.13),transparent 68%),linear-gradient(180deg,#071019 0%,#091522 56%,#050b12 100%)' }} />
      <div className="relative z-10 mx-auto mb-2 flex w-full max-w-7xl items-end justify-between gap-4 px-5 sm:mb-0 sm:px-8 lg:px-12">
        <div>
          <p className="portfolio-eyebrow mb-2.5 text-sky-300/85">02 / SELECTED PROJECTS</p>
          <h2 className="portfolio-heading-section font-semibold tracking-[-0.045em] text-white">Selected <span className="text-sky-400">work.</span></h2>
          <p className="portfolio-body mt-2 max-w-lg text-slate-300/65">A collection of motion, image and digital craft.</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button type="button" onClick={() => step(-1)} aria-label="Previous project" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[.04] text-white/80 transition hover:border-sky-300/60 hover:bg-sky-300/10">←</button>
          <button type="button" onClick={() => step(1)} aria-label="Next project" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[.04] text-white/80 transition hover:border-sky-300/60 hover:bg-sky-300/10">→</button>
        </div>
      </div>

      <div
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Project coverflow. Use left and right arrow keys to navigate."
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative z-10 flex min-h-0 flex-1 touch-pan-y select-none items-center justify-center overflow-hidden outline-none ${dragStart !== null ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="relative h-[min(58svh,440px)] w-full" style={{ perspective: '1500px', transformStyle: 'preserve-3d' }}>
          {projects.map((project, index) => {
            let relative = index - active;
            if (relative > projects.length / 2) relative -= projects.length;
            if (relative < -projects.length / 2) relative += projects.length;
            const distance = Math.abs(relative);
            const visible = distance <= 2;
            const activeCard = relative === 0;
            const cardStyle: CSSProperties = {
              position: 'absolute', left: '50%', top: '50%',
              width: 'min(66vw, 540px)', height: '100%', maxHeight: 440,
              borderRadius: 18, overflow: 'hidden',
              transformStyle: 'preserve-3d',
              transform: `translate(-50%,-50%) translateX(${relative * 68}%) translateZ(${-distance * 180}px) rotateY(${-relative * 13}deg) rotateZ(${relative * 1.2}deg) scale(${1 - distance * .16})`,
              opacity: visible ? (activeCard ? 1 : .56) : 0,
              zIndex: 10 - distance,
              pointerEvents: visible ? 'auto' : 'none',
              transition: reduceMotion ? 'none' : 'transform .65s cubic-bezier(.22,1,.36,1),opacity .65s ease',
              border: activeCard ? '1px solid rgba(125,211,252,.55)' : '1px solid rgba(255,255,255,.16)',
              boxShadow: activeCard ? '0 32px 90px rgba(0,0,0,.55),0 0 45px rgba(56,189,248,.12)' : '0 20px 55px rgba(0,0,0,.45)',
              cursor: 'pointer',
            };
            return (
              <motion.button
                key={project.id}
                type="button"
                data-slide-index={index}
                aria-label={`Select ${project.title}`}
                aria-current={activeCard ? 'true' : undefined}
                onClick={() => {
                  if (!activeCard) setActive(index);
                  else openProject(project);
                }}
                style={cardStyle}
                className="group text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                whileHover={activeCard && !reduceMotion ? { y: '-51%' } : undefined}
              >
                <Artwork mood={project.mood} label={`PROJECT ${project.id}`} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.025]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02050c]/95 via-[#02050c]/10 to-black/15" />
                <span className="absolute left-5 top-5 font-mono text-xs tracking-[.22em] text-white/75 sm:left-7 sm:top-7">{project.id} / 10</span>
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <p className="portfolio-eyebrow mb-2 text-white/70">{project.category}</p>
                  <h3 className="max-w-[16ch] text-[clamp(1.35rem,3.5vw,2.7rem)] font-semibold leading-[1.05] tracking-[-.045em] text-white">{project.title}</h3>
                  <div className="mt-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em] text-white/75"><span>{activeCard ? 'View project' : 'Focus project'}</span><ArrowUpRight size={14} /></div>
                </div>
                {activeCard && <span className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[9px] uppercase tracking-[.2em] text-white/75 backdrop-blur">Featured</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-1 sm:px-8 lg:px-12">
        <span className="portfolio-meta uppercase tracking-[.2em] text-sky-200/45">Swipe / drag to explore</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-[.16em] text-white/70">{String(active + 1).padStart(2, '0')} <span className="text-white/30">/</span> 10</span>
          <div className="h-px w-14 overflow-hidden bg-white/15"><div className="h-full bg-sky-300 transition-all duration-500" style={{ width: `${((active + 1) / projects.length) * 100}%` }} /></div>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeProject && (
            <motion.div role="dialog" aria-modal="true" aria-label={`${activeProject.title} project details`} className="fixed inset-0 z-[100] overflow-y-auto bg-[#071019] text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .3 }}>
              <button type="button" onClick={closeProject} aria-label="Close project" className="fixed right-5 top-5 z-[110] flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-xl transition hover:rotate-90 hover:bg-white/15 sm:right-8 sm:top-8"><X size={20} /></button>
              <div className="relative flex min-h-[75svh] flex-col justify-end overflow-hidden px-6 pb-12 pt-28 sm:min-h-[86svh] sm:px-12 sm:pb-16 lg:px-20">
                <Artwork mood={activeProject.mood} label={`PROJECT ${activeProject.id}`} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071019] via-black/35 to-black/20" />
                <div className="relative z-10">
                  <p className="portfolio-eyebrow mb-4" style={{ color: activeProject.accent }}>{activeProject.category}</p>
                  <h2 className="portfolio-heading-display max-w-4xl font-semibold tracking-[-.045em]">{activeProject.title}</h2>
                  <p className="portfolio-body mt-6 max-w-xl text-white/75">{activeProject.description}</p>
                </div>
              </div>
              <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-12 sm:px-10 sm:pt-20 lg:px-16">
                <div className="mb-10 flex items-end justify-between border-b border-white/10 pb-5"><div><p className="portfolio-eyebrow mb-2 text-white/45">SELECTED FRAMES / {activeProject.id}</p><h3 className="portfolio-heading-section font-medium">Project gallery<span style={{ color: activeProject.accent }}>.</span></h3></div><span className="portfolio-meta text-white/45">{activeProject.galleryImages.length} FRAMES</span></div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">
                  {activeProject.galleryImages.map((frame, index) => (
                    <motion.div key={frame} initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .55 }} className="relative flex min-h-[240px] items-end overflow-hidden rounded-xl border border-white/10 p-6 sm:min-h-[320px]" style={{ background: palettes[activeProject.mood], aspectRatio: index % 2 ? '4 / 3' : '16 / 10' }}>
                      <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/20 bg-white/10" /><span className="relative z-10 text-xs uppercase tracking-[.2em] text-white/80">{frame}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="portfolio-meta mt-16 flex justify-between border-t border-white/10 pt-6 uppercase tracking-[.2em] text-white/50"><span>End of project</span><button type="button" onClick={closeProject} className="transition hover:text-white">Back to all work ↑</button></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
