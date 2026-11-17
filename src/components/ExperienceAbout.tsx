import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Mail, Pause, Play } from 'lucide-react';

const experience = [
  { company: '1st India News', role: 'Broadcast / Motion Graphics Designer', type: 'Broadcast · News Graphics', period: '01', description: 'Creating broadcast visuals, motion graphics and on-air design.' },
  { company: 'Gemporia India', role: 'Motion Graphics Designer', type: 'Jewellery · Product Visualisation', period: '02', description: 'Designing product visuals, jewellery catalogues and exhibition creatives.' },
  { company: 'Truworth Wellness', role: 'Senior Motion Graphics & 3D Designer', type: 'Healthcare · Brand & Motion', period: '03', description: 'Building brand stories through 2D/3D motion, CGI and digital campaigns.' },
];

export function ExperienceAbout() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [started, setStarted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const stageRef = useRef<HTMLElement | null>(null);
  const pointerStart = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const activeIndexRef = useRef(0);

  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') { setStarted(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started || paused || hovered || activeIndex === experience.length - 1) return;
    const timer = window.setTimeout(() => {
      if (activeIndex >= experience.length - 2) {
        setActiveIndex(experience.length - 1);
        setPaused(true);
      } else {
        setActiveIndex(current => Math.min(current + 1, experience.length - 1));
      }
    }, 5600);
    return () => window.clearTimeout(timer);
  }, [started, paused, hovered, activeIndex]);

  const goTo = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, experience.length - 1)));
    setDragOffset(0);
  }, []);
  const previous = () => { setPaused(true); goTo(activeIndexRef.current - 1); };
  const next = () => { setPaused(true); goTo(activeIndexRef.current + 1); };
  const togglePlayback = () => {
    if (activeIndexRef.current === experience.length - 1 && paused) goTo(0);
    setPaused(value => !value);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    setPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current || pointerStart.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - pointerStart.current.x;
    setDragOffset(Math.max(-180, Math.min(180, dx * 0.72)));
  };
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current || pointerStart.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - pointerStart.current.x;
    if (Math.abs(dx) > 48) goTo(activeIndexRef.current + (dx < 0 ? 1 : -1));
    setDragOffset(0);
    pointerStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="experience-about-stack relative z-20">
      <section ref={stageRef} id="experience" aria-label="Professional experience" className="experience-stage relative z-20 flex min-h-[min(100svh,900px)] w-full flex-col justify-center overflow-hidden border-t border-white/[0.06] bg-[#050711] py-12 sm:min-h-screen sm:py-16">
        <div className="mx-auto mb-7 w-full max-w-7xl px-5 sm:mb-10 sm:px-8 lg:px-12">
          <p className="mb-3 text-[9px] font-semibold tracking-[0.28em] text-violet-300/75 sm:text-[10px]">03 / CAREER JOURNEY</p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="portfolio-heading-section font-semibold leading-[0.95] tracking-[-0.055em] text-white">Experience<span className="text-violet-300">.</span></h2>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-white/45 sm:mt-3 sm:text-sm">A journey across broadcast, product visualisation and brand storytelling.</p>
            </div>
            <button type="button" onClick={togglePlayback} aria-label={paused ? 'Play experience sequence' : 'Pause experience sequence'} className="portfolio-icon-button mb-1 shrink-0 rounded-full border border-white/15 text-white/75 transition hover:border-violet-300/60 hover:text-violet-200">
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          </div>
        </div>

        <div className="experience-marquee w-full overflow-hidden" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <div
            className="experience-track flex"
            style={{ transform: `translate3d(calc(-${activeIndex * 33.333333}% + ${dragOffset}px),0,0)`, transition: pointerStart.current ? 'none' : 'transform 850ms cubic-bezier(.22,1,.36,1)' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={(event) => { if (event.key === 'ArrowRight') next(); if (event.key === 'ArrowLeft') previous(); }}
            role="group"
            aria-label="Experience timeline. Swipe or drag to move between roles."
            tabIndex={0}
          >
            {experience.map((item, index) => (
              <article key={item.period} aria-hidden={activeIndex !== index} className="flex min-h-[250px] w-1/3 shrink-0 basis-1/3 flex-col justify-center px-5 sm:min-h-[300px] sm:px-[10vw]">
                <div className="mx-auto w-full max-w-5xl">
                  <p className="mb-4 text-[10px] font-semibold tracking-[0.26em] text-violet-300/80 sm:mb-5 sm:text-[11px]">{item.period} <span className="text-white/25">/ 03</span></p>
                  <h3 className="portfolio-heading-company font-semibold leading-[0.98] tracking-[-0.06em] text-white">{item.company}</h3>
                  <p className="mt-3 text-base font-medium text-white/75 sm:mt-5 sm:text-2xl">{item.role}</p>
                  <p className="mt-2 text-[9px] tracking-[0.14em] text-white/40 sm:mt-3 sm:text-[11px] sm:tracking-[0.18em]">{item.type}</p>
                  <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/45 sm:mt-5 sm:text-sm">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-6 flex w-full max-w-7xl items-center justify-between px-5 sm:mt-8 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            <button type="button" onClick={previous} disabled={activeIndex === 0} aria-label="Previous experience" className="portfolio-icon-button rounded-full border border-white/15 text-white/75 transition hover:border-violet-300/60 disabled:cursor-not-allowed disabled:opacity-25"><ArrowLeft size={15}/></button>
            <button type="button" onClick={next} disabled={activeIndex === experience.length - 1} aria-label="Next experience" className="portfolio-icon-button rounded-full border border-white/15 text-white/75 transition hover:border-violet-300/60 disabled:cursor-not-allowed disabled:opacity-25"><ArrowRight size={15}/></button>
            <span className="ml-2 text-[9px] tracking-[0.2em] text-white/35 sm:text-[10px]">DRAG / SWIPE</span>
          </div>
          <div className="flex items-center gap-2" aria-label={`Experience ${activeIndex + 1} of 3`}>
            {experience.map((item, index) => (
              <button key={item.period} type="button" onClick={() => { setPaused(true); goTo(index); }} aria-label={`Go to ${item.company}`} aria-current={activeIndex === index ? 'step' : undefined} className={`h-1 rounded-full transition-all duration-500 ${activeIndex === index ? 'w-8 bg-violet-300' : 'w-3 bg-white/20 hover:bg-white/45'}`} />
            ))}
            <span className="ml-1 min-w-8 text-right text-[9px] tabular-nums text-white/35">{String(activeIndex + 1).padStart(2, '0')} / 03</span>
          </div>
        </div>
        <p className="mt-4 text-center text-[9px] tracking-[0.13em] text-white/25 sm:mt-5 sm:text-[10px]">AUTO-PLAY · HOLD OR HOVER TO PAUSE · DRAG TO NAVIGATE</p>
      </section>

      <section id="about" aria-label="About Yuvraj Singh" className="about-overlay relative z-30">
        <div className="relative overflow-hidden border-t border-white/[0.06] bg-[#080a14] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32">
          <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-violet-500/[0.08] blur-[110px]" />
          <div className="relative mx-auto grid max-w-7xl gap-9 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div>
              <p className="mb-4 text-[9px] font-semibold tracking-[0.28em] text-violet-300/75 sm:mb-5 sm:text-[10px]">04 / A LITTLE ABOUT ME</p>
              <h2 className="max-w-3xl portfolio-heading-display font-semibold leading-[0.96] tracking-[-0.06em] text-white">Designing ideas<br/>into <span className="text-violet-300">experiences.</span></h2>
              <p className="mt-5 max-w-2xl text-sm leading-[1.75] text-white/55 sm:mt-8 sm:text-[15px] sm:leading-[1.9]">I’m Yuvraj Singh, a Senior Motion Graphics and 3D Designer with 12+ years of experience creating brand narratives, cinematic visuals and engaging digital experiences. I bring together 2D/3D motion, CGI, product visualisation and emerging AI workflows to turn ideas into memorable visual stories.</p>
              <div className="mt-6 flex flex-wrap gap-2 sm:mt-9 sm:gap-3">
                {['3D & CGI', 'Motion Design', 'Brand Storytelling', 'AI-Enabled Workflows'].map(tag => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[10px] tracking-wide text-white/65 sm:px-4 sm:text-[11px]">{tag}</span>)}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:gap-4">
              <a href="mailto:" className="group flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-violet-300/40 sm:p-5">
                <span className="flex items-center gap-3 sm:gap-4"><Mail className="h-5 w-5 text-violet-300"/><span><span className="block text-[9px] tracking-[0.2em] text-white/35">LET’S TALK</span><span className="mt-1 block text-sm text-white/80">Email address to be added</span></span></span><ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:-translate-y-1 group-hover:translate-x-1"/>
              </a>
              <a href="https://www.linkedin.com/in/yuvrajsinghdesign/" target="_blank" rel="noreferrer" className="group flex min-h-[76px] items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-violet-300/40 sm:p-5">
                <span><span className="block text-[9px] tracking-[0.2em] text-white/35">CONNECT</span><span className="mt-1 block text-sm text-white/80">LinkedIn · Yuvraj Singh</span></span><ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:-translate-y-1 group-hover:translate-x-1"/>
              </a>
              <a href="/resume.pdf" download className="mt-1 flex min-h-[58px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(139,92,246,0.22)] transition hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(139,92,246,0.34)] sm:mt-3 sm:py-5">
                <ArrowDownToLine className="h-4 w-4"/> Download Resume
              </a>
              <p className="text-center text-[10px] text-white/30">Resume file will be connected here.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
