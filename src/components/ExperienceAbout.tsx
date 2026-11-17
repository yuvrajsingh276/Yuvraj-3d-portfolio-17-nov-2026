import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Mail } from 'lucide-react';

const experience = [
  { company: '1st India News', role: 'Broadcast / Motion Graphics Designer', type: 'Broadcast · News Graphics', period: '01', description: 'Creating broadcast visuals, motion graphics and on-air design.' },
  { company: 'Gemporia India', role: 'Motion Graphics Designer', type: 'Jewellery · Product Visualisation', period: '02', description: 'Designing product visuals, jewellery catalogues and exhibition creatives.' },
  { company: 'Truworth Wellness', role: 'Senior Motion Graphics & 3D Designer', type: 'Healthcare · Brand & Motion', period: '03', description: 'Building brand stories through 2D/3D motion, CGI and digital campaigns.' },
];

export function ExperienceAbout() {
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const stageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') { setStarted(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStarted(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="experience-about-stack relative z-20">
      <section ref={stageRef} id="experience" aria-label="Professional experience" className="experience-stage relative z-20 flex min-h-screen w-full flex-col justify-center overflow-hidden border-t border-white/[0.06] bg-[#050711] py-16">
        <div className="mx-auto mb-12 w-full max-w-7xl px-6 sm:mb-16">
          <p className="mb-4 text-[10px] font-semibold tracking-[0.3em] text-violet-300/75">02 / CAREER JOURNEY</p>
          <div className="flex items-end justify-between gap-5">
            <div>
              <h2 className="text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-white">Experience<span className="text-violet-300">.</span></h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/45">A journey across broadcast, product visualisation and brand storytelling.</p>
            </div>
            <button type="button" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Play experience sequence' : 'Pause experience sequence'} className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-violet-300/60 hover:text-violet-200">
              <span className="text-[11px]">{paused ? 'PLAY' : 'PAUSE'}</span>
            </button>
          </div>
        </div>
        <div className="experience-marquee w-full overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
          <div className={`experience-track flex ${started ? 'is-active' : ''} ${paused ? 'is-paused' : ''}`}>
            {experience.map(item => (
              <article key={item.period} className="flex min-h-[260px] w-screen shrink-0 basis-[100vw] flex-col justify-center px-8 sm:min-h-[300px] sm:px-[12vw]">
                <div className="max-w-5xl">
                  <p className="mb-5 text-[11px] font-semibold tracking-[0.28em] text-violet-300/80">{item.period} <span className="text-white/25">/ 03</span></p>
                  <h3 className="text-[clamp(2.3rem,8vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.06em] text-white">{item.company}</h3>
                  <p className="mt-5 text-lg font-medium text-white/75 sm:text-2xl">{item.role}</p>
                  <p className="mt-3 text-[11px] tracking-[0.18em] text-white/40">{item.type}</p>
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/45">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center text-[10px] tracking-[0.16em] text-white/30">AUTO-PLAY · HOVER OR HOLD TO PAUSE</p>
      </section>

      <section id="about" aria-label="About Yuvraj Singh" className="about-overlay relative z-30">
        <div className="relative overflow-hidden border-t border-white/[0.06] bg-[#080a14] px-6 py-24 sm:py-32">
          <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-violet-500/[0.08] blur-[110px]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div>
              <p className="mb-5 text-[10px] font-semibold tracking-[0.3em] text-violet-300/75">03 / A LITTLE ABOUT ME</p>
              <h2 className="max-w-3xl text-[clamp(2.8rem,7vw,6rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-white">Designing ideas<br/>into <span className="text-violet-300">experiences.</span></h2>
              <p className="mt-8 max-w-2xl text-[15px] leading-[1.9] text-white/55">I’m Yuvraj Singh, a Senior Motion Graphics and 3D Designer with 12+ years of experience creating brand narratives, cinematic visuals and engaging digital experiences. I bring together 2D/3D motion, CGI, product visualisation and emerging AI workflows to turn ideas into memorable visual stories.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                {['3D & CGI', 'Motion Design', 'Brand Storytelling', 'AI-Enabled Workflows'].map(tag => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[11px] tracking-wide text-white/65">{tag}</span>)}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4">
              <a href="mailto:" className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-violet-300/40">
                <span className="flex items-center gap-4"><Mail className="h-5 w-5 text-violet-300"/><span><span className="block text-[10px] tracking-[0.2em] text-white/35">LET’S TALK</span><span className="mt-1 block text-sm text-white/80">Email address to be added</span></span></span><ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:-translate-y-1 group-hover:translate-x-1"/>
              </a>
              <a href="https://www.linkedin.com/in/yuvrajsinghdesign/" target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-violet-300/40">
                <span><span className="block text-[10px] tracking-[0.2em] text-white/35">CONNECT</span><span className="mt-1 block text-sm text-white/80">LinkedIn · Yuvraj Singh</span></span><ArrowUpRight className="h-4 w-4 text-white/40 transition group-hover:-translate-y-1 group-hover:translate-x-1"/>
              </a>
              <a href="/resume.pdf" download className="mt-3 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(139,92,246,0.22)] transition hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(139,92,246,0.34)]">
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
