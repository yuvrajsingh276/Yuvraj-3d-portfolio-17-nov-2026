import { useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, BriefcaseBusiness, Mail, Pause, Play } from 'lucide-react';

const experience = [
  { company: 'Truworth Wellness', role: 'Senior Motion Graphics & 3D Designer', type: 'Healthcare · Brand & Motion', period: 'CURRENT', number: '01', tone: 'from-violet-500/20 to-fuchsia-500/5' },
  { company: 'Gemporia India', role: 'Motion Graphics Designer', type: 'Jewellery · Product Visualisation', period: 'PREVIOUS', number: '02', tone: 'from-amber-400/20 to-orange-500/5' },
  { company: '1st India News', role: 'Broadcast / Motion Graphics Designer', type: 'Broadcast · News Graphics', period: 'EARLIER', number: '03', tone: 'from-cyan-400/20 to-blue-500/5' },
];

function ExperienceCard({ item }: { item: typeof experience[number] }) {
  return (
    <article className={`group relative flex min-h-[250px] w-[min(82vw,390px)] shrink-0 flex-col justify-between overflow-hidden rounded-[26px] border border-white/[0.10] bg-gradient-to-br ${item.tone} p-7 sm:min-h-[285px] sm:w-[420px] sm:p-9`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/[0.08] transition-transform duration-700 group-hover:scale-125" />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] tracking-[0.24em] text-white/45">{item.number} / EXPERIENCE</span>
        <BriefcaseBusiness className="h-5 w-5 text-white/55" />
      </div>
      <div className="relative">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-violet-200/75">{item.period}</p>
        <h3 className="text-[26px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[30px]">{item.company}</h3>
        <p className="mt-3 text-[14px] font-medium text-white/75">{item.role}</p>
        <p className="mt-2 text-[11px] tracking-[0.12em] text-white/40">{item.type}</p>
      </div>
    </article>
  );
}

export function ExperienceAbout() {
  const [paused, setPaused] = useState(false);
  return (
    <>
      <section id="experience" aria-label="Professional experience" className="relative z-20 overflow-hidden border-t border-white/[0.06] bg-[#050711] py-24 sm:py-32">
        <div className="mx-auto mb-12 flex max-w-7xl items-end justify-between gap-5 px-6 sm:mb-16">
          <div>
            <p className="mb-4 text-[10px] font-semibold tracking-[0.3em] text-violet-300/75">02 / CAREER JOURNEY</p>
            <h2 className="text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-white">Experience<span className="text-violet-300">.</span></h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/45">A journey across broadcast, product visualisation and brand storytelling.</p>
          </div>
          <button type="button" onClick={() => setPaused(v => !v)} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} aria-label={paused ? 'Play experience carousel' : 'Pause experience carousel'} className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-violet-300/60 hover:text-violet-200">
            {paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
        <div className="experience-marquee relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
          <div className={`experience-track flex w-max gap-5 px-6 ${paused ? 'is-paused' : ''}`}>
            {[...experience, ...experience].map((item, index) => <ExperienceCard key={`${item.number}-${index}`} item={item} />)}
          </div>
        </div>
        <p className="mt-7 text-center text-[10px] tracking-[0.16em] text-white/30">HOVER OR HOLD TO PAUSE · DRAG / SWIPE TO EXPLORE</p>
      </section>

      <section id="about" aria-label="About Yuvraj Singh" className="relative z-20 overflow-hidden border-t border-white/[0.06] bg-[#080a14] px-6 py-24 sm:py-32">
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
      </section>
    </>
  );
}
