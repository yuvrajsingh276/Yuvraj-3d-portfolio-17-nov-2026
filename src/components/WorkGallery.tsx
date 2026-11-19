import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Play } from 'lucide-react';

export type Project = {
  id: string; title: string; category: string; description: string;
  year: string; type: string; mood: string; accent: string; frames: string[];
};

export const projects: Project[] = [
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

export function WorkGallery({ onOpenProject }: { onOpenProject: (projectId: string) => void }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const project = projects[active];
  const select = useCallback((index: number) => setActive((index + projects.length) % projects.length), []);
  const move = useCallback((direction: number) => select(active + direction), [active, select]);

  return (
    <section aria-label="Selected work" className="work-exhibition relative flex h-full min-h-0 w-full overflow-hidden bg-[#090909] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,rgba(255,255,255,.055),transparent_62%)]" />
      <aside className="relative z-20 hidden w-[76px] shrink-0 flex-col items-center border-r border-white/[.07] bg-black/35 pt-8 md:flex lg:w-[104px]">
        <div className="mb-12 grid h-7 w-7 place-items-center rounded-full border border-white/25 text-[9px] font-bold tracking-tighter">YS</div>
        <nav aria-label="Work categories" className="flex w-full flex-col gap-7 px-2">
          {['HOME', '3D / CGI', 'MOTION', 'BRANDING', 'MY WORK'].map((item, i) => (
            <button key={item} type="button" onClick={() => { if (i === 0 || i === 4) setActive(0); }} className={`text-center text-[7px] font-medium tracking-[.12em] transition-colors lg:text-[8px] ${i === 4 ? 'text-white' : 'text-white/40 hover:text-white/85'}`}>
              {item}
              {i === 4 && <span className="mx-auto mt-2 block h-px w-5 bg-[#e50914]" />}
            </button>
          ))}
        </nav>
        <span className="mt-auto mb-8 font-mono text-[7px] tracking-[.22em] text-white/25 [writing-mode:vertical-rl]">INDEPENDENT VISUAL STORIES</span>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/[.07] px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 text-white/55"><span className="text-[8px] tracking-[.18em]">DISCOVER</span><span className="h-3 w-px bg-white/15" /><span className="text-[8px] tracking-[.18em]">SELECTED WORK</span></div>
          <div className="absolute left-1/2 -translate-x-1/2 text-[15px] font-black tracking-[-.06em] text-[#e50914] sm:text-[18px]">YUVRAJ<span className="text-white">.</span></div>
          <div className="flex items-center gap-2 text-[8px] tracking-[.12em] text-white/55"><span className="hidden sm:inline">VISUAL DESIGNER</span><span className="grid h-6 w-6 place-items-center rounded-full border border-white/20 text-[8px] text-white">YS</span></div>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col justify-center px-4 pb-7 pt-5 sm:px-7 lg:px-[5vw]">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
            <div><p className="mb-2 text-[8px] font-semibold tracking-[.3em] text-[#e50914]">YUVRAJ SINGH / PORTFOLIO</p><h2 className="text-xl font-semibold tracking-[-.04em] sm:text-2xl lg:text-[clamp(1.7rem,3vw,2.6rem)]">Featured collection</h2></div>
            <div className="hidden items-center gap-2 text-[8px] tracking-[.2em] text-white/35 sm:flex"><span>01</span><span className="h-px w-9 bg-white/20" /><span>10 PROJECTS</span></div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div className="flex h-full items-center gap-2.5 overflow-x-auto overflow-y-hidden pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 lg:gap-4">
              {projects.map((item, index) => (
                <motion.button key={item.id} type="button" onMouseEnter={() => select(index)} onFocus={() => select(index)} onClick={() => onOpenProject(item.id)} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: index * .035 }} aria-label={`Explore ${item.title}`} aria-current={index === active ? 'true' : undefined} className={`group relative h-[min(55vh,430px)] min-h-[230px] w-[clamp(112px,15vw,190px)] shrink-0 overflow-hidden bg-[#151515] text-left transition-all duration-500 ${index === active ? 'scale-[1.025] opacity-100' : 'opacity-65 hover:opacity-100'}`}>
                  <Visual project={item} className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/5" />
                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/25 to-transparent" />
                  <span className="absolute left-3 top-3 font-mono text-[8px] tracking-[.18em] text-white/65">{item.id} / YS</span>
                  <div className="absolute inset-x-3 bottom-4">
                    <p className="mb-2 text-[7px] font-semibold tracking-[.18em] text-white/55">{item.category}</p>
                    <h3 className="line-clamp-3 text-[clamp(.78rem,1.2vw,1rem)] font-semibold leading-[1.08] tracking-[-.035em]">{item.title}</h3>
                    <span className={`mt-3 block h-[2px] transition-all duration-300 ${index === active ? 'w-full bg-[#e50914]' : 'w-5 bg-white/45 group-hover:w-10'}`} />
                  </div>
                  {index === active && <span className="pointer-events-none absolute inset-0 border border-white/65" />}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex shrink-0 items-center justify-between border-t border-white/[.1] pt-4 sm:mt-5">
            <div className="min-w-0 pr-4"><p className="text-[7px] tracking-[.24em] text-white/35">NOW SELECTED</p><p className="mt-1 truncate text-xs font-medium tracking-wide sm:text-sm">{project.title}</p></div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" aria-label="Previous project" onClick={() => move(-1)} className="grid h-8 w-8 place-items-center border border-white/20 text-white/70 transition hover:border-white hover:bg-white/10"><ArrowLeft size={13} /></button>
              <button type="button" aria-label="Next project" onClick={() => move(1)} className="grid h-8 w-8 place-items-center border border-white/20 text-white/70 transition hover:border-white hover:bg-white/10"><ArrowRight size={13} /></button>
              <button type="button" onClick={() => onOpenProject(project.id)} className="ml-1 inline-flex h-8 items-center gap-2 bg-[#e50914] px-3 text-[8px] font-bold tracking-[.14em] transition hover:bg-[#ff1824] sm:px-5">EXPLORE <ArrowUpRight size={12} /></button>
            </div>
          </div>
        </div>
        <footer className="flex h-6 shrink-0 items-center justify-between border-t border-white/[.06] px-5 text-[7px] tracking-[.18em] text-white/25 sm:px-8 lg:px-12"><span>YUVRAJ SINGH / VISUAL DESIGNER</span><span>COLLECTION · 2026</span></footer>
      </div>
    </section>
  );
}

export function ProjectDetailPage({ projectId, onBack, onNext }: { projectId: string; onBack: () => void; onNext: (projectId: string) => void }) {
  const index = Math.max(0, projects.findIndex((item) => item.id === projectId));
  const project = projects[index];
  const nextProject = projects[(index + 1) % projects.length];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#080d14';
    return () => { document.body.style.backgroundColor = previous; };
  }, [projectId]);

  return (
    <main key={project.id} className="min-h-screen bg-[#080d14] pt-16 text-white">
      <section className="grid min-h-[calc(100svh-4rem)] grid-cols-1 lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-[7vw] lg:py-20">
          <button type="button" onClick={onBack} className="mb-12 inline-flex w-fit items-center gap-2 text-[9px] tracking-[.2em] text-white/55 transition hover:text-white"><ArrowLeft size={14} /> BACK TO COLLECTION</button>
          <p className="mb-5 text-[9px] font-semibold tracking-[.28em]" style={{ color: project.accent }}>{project.category}</p>
          <h1 className="max-w-[13ch] text-[clamp(2.5rem,5.5vw,5.5rem)] font-semibold leading-[.96] tracking-[-.065em]">{project.title}</h1>
          <p className="mt-7 max-w-xl text-sm leading-7 text-white/60">{project.description}</p>
          <div className="mt-10 grid max-w-lg grid-cols-3 border-y border-white/10 py-5">
            <div><p className="text-[8px] tracking-[.2em] text-white/35">YEAR</p><p className="mt-2 text-sm">{project.year}</p></div>
            <div><p className="text-[8px] tracking-[.2em] text-white/35">DISCIPLINE</p><p className="mt-2 text-xs text-white/75">{project.type}</p></div>
            <div><p className="text-[8px] tracking-[.2em] text-white/35">ROLE</p><p className="mt-2 text-xs text-white/75">ART DIRECTION</p></div>
          </div>
          <button type="button" onClick={() => onNext(nextProject.id)} className="mt-10 inline-flex w-fit items-center gap-3 border border-white/25 px-5 py-3 text-[9px] font-semibold tracking-[.2em] text-white/85 transition hover:border-white/70 hover:bg-white/[.08]">NEXT PROJECT <ArrowRight size={14} /></button>
        </div>
        <div className="relative min-h-[55svh] overflow-hidden border-y border-white/[.08] lg:min-h-0 lg:border-l lg:border-y-0">
          <Visual project={project} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d14]/65 via-transparent to-black/10" />
          <div className="absolute bottom-7 right-7 text-right"><p className="text-[8px] tracking-[.25em] text-white/55">PROJECT COVER / {project.year}</p><p className="mt-2 text-xs tracking-widest text-white">{project.id} — {project.category}</p></div>
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-6 py-16 sm:px-12 lg:px-[7vw] lg:py-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[9px] font-semibold tracking-[.25em] text-white/40">SELECTED WORK</p><h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">Project gallery</h2></div><span className="text-[9px] tracking-[.2em] text-white/35">01 — 0{project.frames.length}</span></div>
        <div className="grid grid-cols-2 auto-rows-[110px] gap-3 sm:auto-rows-[150px] sm:gap-5 lg:grid-cols-12 lg:auto-rows-[92px]">
          {project.frames.map((frame, i) => {
            const layouts = ['col-span-2 row-span-3 lg:col-span-5 lg:row-span-5', 'col-span-1 row-span-2 lg:col-span-4 lg:row-span-3 lg:mt-10', 'col-span-1 row-span-2 lg:col-span-3 lg:row-span-4 lg:mt-20'];
            return <article key={frame} className={`group ${layouts[i % layouts.length]}`}>
              <div className="relative h-full min-h-0 overflow-hidden border border-white/10">
                <Visual project={project} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.045]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 font-mono text-[9px] tracking-widest text-white/75">0{i + 1}</span>
              </div>
              <p className="mt-3 text-[9px] tracking-[.14em] text-white/60">{frame}</p>
            </article>;
          })}
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-[9px] tracking-[.2em] text-white/55 transition hover:text-white"><ArrowLeft size={14} /> BACK TO COLLECTION</button><button type="button" onClick={() => onNext(nextProject.id)} className="inline-flex items-center gap-3 border border-white/25 px-5 py-3 text-[9px] font-semibold tracking-[.2em] text-white/85 transition hover:border-white/70 hover:bg-white/[.08]">NEXT PROJECT <ArrowRight size={14} /></button></div>
      </section>
    </main>
  );
}
