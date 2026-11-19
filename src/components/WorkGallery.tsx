import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Play, X } from 'lucide-react';

type Project = {
  id: string; title: string; category: string; description: string;
  year: string; type: string; mood: string; accent: string; frames: string[];
};

const projects: Project[] = [
  { id: '01', title: 'Future of Family Healthcare', category: '3D / CGI FILM', description: 'A cinematic visual direction exploring the next generation of connected family healthcare.', year: '2025', type: 'Brand film · 3D animation', mood: 'violet', accent: '#bca7ff', frames: ['Key visual', 'Product detail', 'Motion frame'] },
  { id: '02', title: 'Gemora — The Art of Detail', category: 'PRODUCT VISUALIZATION', description: 'A refined product story built around material, light, precision and elegant composition.', year: '2024', type: 'CGI · Product film', mood: 'gold', accent: '#e8c98b', frames: ['Hero render', 'Material study', 'Detail frame'] },
  { id: '03', title: 'Beyond the Frame', category: 'MOTION DESIGN', description: 'An exploration of rhythm, graphic form and dimensional motion for a bold visual identity.', year: '2024', type: 'Motion identity · 2D / 3D', mood: 'blue', accent: '#8fc8f4', frames: ['Art direction', 'Motion frame', 'Final frame'] },
  { id: '04', title: 'Digital Dimensions', category: 'BRAND EXPERIENCE', description: 'A visual system that brings brand language into a tactile, immersive digital space.', year: '2023', type: 'Brand design · Digital', mood: 'rose', accent: '#eaa6c5', frames: ['Visual identity', 'Digital application', 'Final frame'] },
  { id: '05', title: 'The Shape of Tomorrow', category: '3D ART DIRECTION', description: 'A study in atmosphere, sculptural form and cinematic lighting.', year: '2023', type: '3D art direction · CGI', mood: 'emerald', accent: '#8bd7b3', frames: ['Sculptural study', 'Lighting pass', 'Final render'] },
  { id: '06', title: 'Neon Form Studies', category: 'CONCEPT / 3D STUDY', description: 'A concept-led exploration of luminous forms, colour and premium product-style lighting.', year: '2022', type: '3D study · Look development', mood: 'violet', accent: '#bca7ff', frames: ['Form study', 'Lighting study', 'Final frame'] },
  { id: '07', title: 'Motion in Nature', category: 'CONCEPT / MOTION STUDY', description: 'A visual study imagining organic movement translated into a bold motion language.', year: '2022', type: 'Motion design · Experiment', mood: 'emerald', accent: '#8bd7b3', frames: ['Nature study', 'Motion frame', 'Final frame'] },
  { id: '08', title: 'The Future Interface', category: 'CONCEPT / UI MOTION', description: 'A speculative interface concept combining dimensional graphics and kinetic typography.', year: '2021', type: 'UI motion · Design', mood: 'blue', accent: '#8fc8f4', frames: ['Interface system', 'UI motion', 'Final frame'] },
  { id: '09', title: 'Objects of Desire', category: 'CONCEPT / PRODUCT CGI', description: 'A product campaign study focused on material finish, controlled reflections and visual impact.', year: '2021', type: 'Product CGI · Campaign', mood: 'rose', accent: '#eaa6c5', frames: ['Product hero', 'Material detail', 'Final render'] },
  { id: '10', title: 'Beyond the Ordinary', category: 'CONCEPT / BRAND FILM', description: 'A brand-film direction created to explore cinematic composition and storytelling.', year: '2020', type: 'Brand film · Visual story', mood: 'gold', accent: '#e8c98b', frames: ['Story frame', 'Visual direction', 'Final frame'] },
];

const surfaces: Record<string, string> = {
  violet: 'radial-gradient(ellipse at 72% 30%, #8772ad 0%, #3c3454 28%, #151b29 68%, #090e17 100%)',
  gold: 'radial-gradient(ellipse at 70% 28%, #a18a61 0%, #514735 32%, #1b1b20 72%, #090d13 100%)',
  blue: 'radial-gradient(ellipse at 72% 28%, #6285a4 0%, #34485c 30%, #17212d 68%, #090e17 100%)',
  rose: 'radial-gradient(ellipse at 72% 28%, #956d83 0%, #4b3547 32%, #211a27 70%, #090d13 100%)',
  emerald: 'radial-gradient(ellipse at 72% 28%, #5d8d7d 0%, #294b47 32%, #15262a 70%, #090d13 100%)',
};

function Visual({ project, className = '' }: { project: Project; className?: string }) {
  return (
    <div className={`relative isolate overflow-hidden ${className}`} style={{ background: surfaces[project.mood] }}>
      <div className="absolute inset-0 opacity-60" style={{ background: 'linear-gradient(115deg,transparent 18%,rgba(255,255,255,.13) 48%,transparent 66%)' }} />
      <div className="absolute -right-[12%] top-[4%] h-[82%] aspect-[.72] rounded-[48%] border border-white/20 bg-white/[.06] shadow-[0_0_100px_rgba(255,255,255,.08)]" />
      <div className="absolute right-[14%] top-[16%] h-[60%] aspect-[.72] rounded-[48%] border border-white/20 bg-black/10 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b12]/80 via-transparent to-black/10" />
      <span className="absolute bottom-5 right-6 font-mono text-[9px] tracking-[.28em] text-white/45">YS / {project.id}</span>
    </div>
  );
}

export function WorkGallery() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [detail, setDetail] = useState(false);
  const project = projects[active];
  const select = useCallback((index: number) => setActive((index + projects.length) % projects.length), []);
  const move = useCallback((direction: number) => select(active + direction), [active, select]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'Escape') setDetail(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  return (
    <section aria-label="Selected work" className="work-exhibition relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#080d14] text-white">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 78% 42%,rgba(108,130,158,.12),transparent 48%),linear-gradient(180deg,#0b111b 0%,#080d14 100%)' }} />
      <header className="relative z-20 flex h-[58px] shrink-0 items-center justify-between border-b border-white/[.08] px-5 sm:px-9 lg:px-14">
        <button type="button" onClick={() => setDetail(false)} className="font-semibold tracking-[.22em] text-[11px] sm:text-xs">Y<span className="text-white/35">.</span>S<span className="ml-2 font-normal tracking-[.16em] text-white/40">STUDIO</span></button>
        <nav className="hidden items-center gap-6 text-[9px] font-medium tracking-[.2em] text-white/45 sm:flex">
          <button onClick={() => setDetail(false)} className="text-white transition">WORK</button><span>ABOUT</span><span>EXPERIENCE</span><span>CONTACT</span>
        </nav>
        <div className="flex items-center gap-3"><span className="hidden text-[9px] tracking-[.16em] text-white/35 sm:block">SELECTED PROJECTS</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" /></div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {!detail ? (
            <motion.div key="overview" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: .985 }} transition={{ duration: .35 }} className="relative flex min-h-0 flex-1 flex-col">
              <Visual project={project} className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#080d14]/95 via-[#080d14]/65 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080d14] via-transparent to-[#080d14]/15" />
              <div className="relative z-10 flex min-h-0 flex-1 items-center px-6 pb-28 pt-8 sm:px-12 lg:px-[9vw]">
                <div className="max-w-[620px]">
                  <p className="mb-4 flex items-center gap-3 text-[9px] font-semibold tracking-[.28em] text-white/55"><span className="h-px w-7 bg-white/50" />{project.category}</p>
                  <motion.h2 key={project.id + 'title'} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} className="max-w-[13ch] text-[clamp(2.3rem,6.2vw,5.8rem)] font-semibold leading-[.98] tracking-[-.065em]">{project.title}</motion.h2>
                  <p className="mt-5 max-w-md text-xs leading-6 text-white/55 sm:text-sm">{project.description}</p>
                  <div className="mt-6 flex items-center gap-5 text-[9px] tracking-[.18em] text-white/55"><span>{project.year}</span><span className="h-3 w-px bg-white/20" /><span>{project.type}</span></div>
                  <button type="button" onClick={() => setDetail(true)} className="mt-8 inline-flex items-center gap-3 border border-white/30 bg-white/[.08] px-5 py-3 text-[9px] font-semibold tracking-[.2em] backdrop-blur-md transition hover:border-white/70 hover:bg-white/[.15]"><Play size={12} fill="currentColor" /> EXPLORE PROJECT <ArrowUpRight size={13} /></button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/[.09] bg-[#080d14]/80 px-5 pb-4 pt-3 backdrop-blur-xl sm:px-9 lg:px-14">
                <div className="mb-3 flex items-center justify-between"><span className="text-[8px] font-semibold tracking-[.25em] text-white/40">THE COLLECTION <span className="ml-2 text-white/20">/ 10</span></span><div className="flex items-center gap-2"><button aria-label="Previous project" onClick={() => move(-1)} className="grid h-7 w-7 place-items-center border border-white/15 text-white/65 transition hover:bg-white/10"><ArrowLeft size={13} /></button><button aria-label="Next project" onClick={() => move(1)} className="grid h-7 w-7 place-items-center border border-white/15 text-white/65 transition hover:bg-white/10"><ArrowRight size={13} /></button></div></div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {projects.map((item, index) => <button key={item.id} type="button" onClick={() => { select(index); setDetail(true); }} aria-label={`Open ${item.title}`} aria-current={index === active ? 'true' : undefined} className={`group relative h-[58px] w-[92px] shrink-0 overflow-hidden border transition-all duration-300 sm:h-[70px] sm:w-[118px] ${index === active ? 'border-white/80 opacity-100' : 'border-white/10 opacity-55 hover:opacity-90'}`}><Visual project={item} className="h-full w-full transition-transform duration-500 group-hover:scale-110" /><span className="absolute bottom-1.5 left-2 font-mono text-[8px] tracking-widest text-white/90">{item.id}</span>{index === active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-white" />}</button>)}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="detail" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .38 }} className="relative grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1.12fr_.88fr]">
              <div className="relative flex min-h-[430px] flex-col justify-center px-6 pb-12 pt-16 sm:px-12 lg:min-h-0 lg:px-[7vw]">
                <button type="button" onClick={() => setDetail(false)} className="absolute left-6 top-6 inline-flex items-center gap-2 text-[9px] tracking-[.2em] text-white/50 transition hover:text-white sm:left-12"><ArrowLeft size={13} /> BACK TO COLLECTION</button>
                <p className="mb-4 text-[9px] font-semibold tracking-[.28em]" style={{ color: project.accent }}>{project.category}</p>
                <h2 className="max-w-[13ch] text-[clamp(2.2rem,5vw,4.6rem)] font-semibold leading-[.98] tracking-[-.06em]">{project.title}</h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/55">{project.description}</p>
                <div className="mt-8 grid max-w-lg grid-cols-3 border-y border-white/10 py-4">
                  <div><p className="text-[8px] tracking-[.2em] text-white/35">YEAR</p><p className="mt-2 text-sm">{project.year}</p></div><div><p className="text-[8px] tracking-[.2em] text-white/35">DISCIPLINE</p><p className="mt-2 text-xs text-white/75">3D / MOTION</p></div><div><p className="text-[8px] tracking-[.2em] text-white/35">ROLE</p><p className="mt-2 text-xs text-white/75">ART DIRECTION</p></div>
                </div>
                <div className="mt-8 max-w-lg">
                  <p className="mb-3 text-[8px] font-semibold tracking-[.25em] text-white/35">PROJECT CONTENT</p>
                  {project.frames.map((frame, i) => <div key={frame} className="flex items-center gap-3 border-b border-white/[.08] py-3"><span className="font-mono text-[9px] text-white/30">0{i + 1}</span><span className="flex-1 text-xs text-white/75">{frame}</span><ArrowUpRight size={13} className="text-white/35" /></div>)}
                </div>
                <div className="mt-7 flex items-center gap-3"><button type="button" onClick={() => move(-1)} aria-label="Previous project" className="grid h-9 w-9 place-items-center border border-white/15 hover:bg-white/10"><ArrowLeft size={14} /></button><button type="button" onClick={() => move(1)} aria-label="Next project" className="grid h-9 w-9 place-items-center border border-white/15 hover:bg-white/10"><ArrowRight size={14} /></button><span className="ml-2 font-mono text-[9px] tracking-[.18em] text-white/35">{project.id} / 10</span></div>
              </div>
              <div className="relative hidden min-h-0 overflow-hidden border-l border-white/[.08] lg:block"><Visual project={project} className="absolute inset-0" /><div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#080d14]/25" /><div className="absolute bottom-8 right-8 text-right"><p className="text-[8px] tracking-[.25em] text-white/45">SELECTED PROJECT</p><p className="mt-2 text-xs tracking-widest text-white/80">{project.id} — {project.category}</p></div></div>
              <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-[#080d14] p-4 lg:hidden">{projects.map((item, index) => <button key={item.id} onClick={() => select(index)} className={`h-12 w-20 shrink-0 overflow-hidden border ${index === active ? 'border-white' : 'border-white/10 opacity-50'}`}><Visual project={item} className="h-full w-full" /></button>)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <footer className="relative z-20 flex h-7 shrink-0 items-center justify-between border-t border-white/[.06] px-5 text-[7px] tracking-[.2em] text-white/25 sm:px-9 lg:px-14"><span>YUVRAJ SINGH / VISUAL DESIGNER</span><span>INDEPENDENT CREATIVE PORTFOLIO · 2026</span></footer>
    </section>
  );
}
