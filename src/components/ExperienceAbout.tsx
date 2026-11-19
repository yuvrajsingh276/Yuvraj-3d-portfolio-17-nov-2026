import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Linkedin, Mail } from 'lucide-react';

const experience = [
  { company: '1st India News', role: 'Broadcast / Motion Graphics Designer', type: 'Broadcast · News Graphics', period: '01', description: 'Creating broadcast visuals, motion graphics and on-air design.' },
  { company: 'Gemporia India', role: 'Motion Graphics Designer', type: 'Jewellery · Product Visualisation', period: '02', description: 'Designing product visuals, jewellery catalogues and exhibition creatives.' },
  { company: 'Truworth Wellness', role: 'Senior Motion Graphics & 3D Designer', type: 'Healthcare · Brand & Motion', period: '03', description: 'Building brand stories through 2D/3D motion, CGI and digital campaigns.' },
];

export function ExperienceAbout() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let frame = 0;
    const updateFromScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const stickyStage = stage.querySelector<HTMLElement>('.experience-stage');
        const stickyHeight = stickyStage?.offsetHeight ?? window.innerHeight;
        // Reserve the final 100svh of the pin so Company 3 freezes while #about overlays it
        const companyScrollSpan = Math.max(1, stage.offsetHeight - stickyHeight * 2);
        const progress = Math.max(0, Math.min(0.9999, -stage.getBoundingClientRect().top / companyScrollSpan));
        const nextIndex = Math.min(experience.length - 1, Math.floor(progress * experience.length));
        setActiveIndex(current => current === nextIndex ? current : nextIndex);
      });
    };
    updateFromScroll();
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
    };
  }, []);

  const jumpToMilestone = useCallback((index: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const stickyStage = stage.querySelector<HTMLElement>('.experience-stage');
    const stickyHeight = stickyStage?.offsetHeight ?? window.innerHeight;
    const companyScrollSpan = Math.max(1, stage.offsetHeight - stickyHeight * 2);
    const stageDocTop = stage.getBoundingClientRect().top + window.scrollY;
    const targetProgress = (index + 0.15) / experience.length;
    window.scrollTo({ top: stageDocTop + companyScrollSpan * targetProgress, behavior: 'smooth' });
  }, []);

  return (
    <div className="experience-about-stack relative z-40 -mt-[100svh]">
      {/* Section 03 · Experience: Deep Emerald Slate & Mint (#06110e) */}
      <section ref={stageRef} id="experience" aria-label="Professional experience" className="experience-pin relative h-[400svh] w-full">
        <div className="experience-stage sticky top-0 z-20 flex h-[100svh] w-full flex-col justify-center overflow-hidden border-t border-emerald-400/15 bg-[#06110e] pt-20 pb-8 sm:pt-24 sm:pb-12">
          {/* Layer 1: Deep Emerald studio lighting */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 64% 52% at 80% 24%, rgba(52, 211, 153, 0.14), transparent 64%), linear-gradient(175deg, #091a15 0%, #06110e 60%, #040b09 100%)',
            }}
          />

          <div className="relative z-10 mx-auto mb-6 w-full max-w-7xl pl-5 pr-10 sm:mb-8 sm:px-8 lg:px-12">
            <p className="portfolio-eyebrow mb-2.5 text-emerald-300/85">03 / CAREER JOURNEY</p>
            <div>
              <h2 className="portfolio-heading-section font-semibold tracking-[-0.045em] text-white">
                Experience<span className="text-emerald-400">.</span>
              </h2>
              <p className="portfolio-body mt-2 max-w-md text-emerald-50/60">
                Scroll through the milestones of my career.
              </p>
            </div>
          </div>

          <div className="experience-marquee relative z-10 w-full overflow-hidden">
            <div
              className="experience-track flex"
              style={{ transform: `translate3d(-${activeIndex * 33.333333}%,0,0)`, transition: 'transform 560ms cubic-bezier(.22,1,.36,1)' }}
              aria-live="polite"
              aria-label="Professional experience timeline"
            >
              {experience.map((item, index) => (
                <article key={item.period} aria-hidden={activeIndex !== index} className="flex w-1/3 shrink-0 basis-1/3 flex-col justify-center">
                  <div className="mx-auto w-full max-w-7xl pl-5 pr-10 sm:px-8 lg:px-12">
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#0b1d17]/88 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(110,231,183,0.14)] backdrop-blur-md sm:p-10">
                      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/50 via-emerald-200/25 to-transparent" />
                      <p className="portfolio-meta mb-3 font-mono font-semibold tracking-[0.22em] text-emerald-300 sm:mb-4">
                        {item.period} <span className="text-white/30">/ 03</span>
                      </p>
                      <h3 className="portfolio-heading-company font-semibold tracking-[-0.045em] text-white">
                        {item.company}
                      </h3>
                      <p className="portfolio-subhead mt-3 font-medium text-emerald-50/90 sm:mt-4">
                        {item.role}
                      </p>
                      <p className="portfolio-eyebrow mt-2 text-emerald-200/55 sm:mt-3">
                        {item.type}
                      </p>
                      <p className="portfolio-body mt-3 max-w-xl text-slate-300/75 sm:mt-4">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-6 flex w-full max-w-7xl items-center justify-end pl-5 pr-10 sm:mt-8 sm:px-8 lg:px-12">
            <div className="flex items-center gap-2" aria-label={`Experience ${activeIndex + 1} of 3`}>
              {experience.map((item, index) => (
                <button
                  key={item.period}
                  type="button"
                  onClick={() => jumpToMilestone(index)}
                  aria-label={`View ${item.company}`}
                  className="flex h-6 items-center px-0.5 focus-visible:outline-none"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-500 ${
                      activeIndex === index ? 'w-9 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'w-3 bg-white/20 hover:bg-emerald-300/50'
                    }`}
                  />
                </button>
              ))}
              <span className="portfolio-meta ml-1.5 min-w-10 text-right font-mono tabular-nums text-emerald-200/65">
                {String(activeIndex + 1).padStart(2, '0')} / 03
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04 · About: Deep Aubergine Indigo & Orchid (#0e0a1b) */}
      <section id="about" aria-label="About Yuvraj Singh" className="about-overlay relative z-50 -mt-[100svh]">
        <div className="relative flex min-h-[100svh] items-center overflow-hidden border-t border-fuchsia-300/15 bg-[#0e0a1b] pt-24 pb-16 sm:pt-28 sm:pb-24 lg:py-28">
          {/* Layer 1: Aubergine Indigo dual radial depth */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 82% 18%, rgba(232, 121, 249, 0.14), transparent 52%), radial-gradient(circle at 14% 85%, rgba(139, 92, 246, 0.10), transparent 55%), linear-gradient(160deg, #130d24 0%, #0e0a1b 60%, #080611 100%)',
            }}
          />

          <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 pl-5 pr-10 sm:gap-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-12">
            <div>
              <p className="portfolio-eyebrow mb-4 text-fuchsia-300/85">04 / A LITTLE ABOUT ME</p>
              <h2 className="portfolio-heading-display max-w-3xl font-semibold tracking-[-0.045em] text-white">
                Designing ideas <br />into <span className="text-fuchsia-300">experiences.</span>
              </h2>
              <p className="portfolio-body mt-6 max-w-2xl text-slate-200/75 sm:mt-8">
                I’m Yuvraj Singh, a Senior Motion Graphics and 3D Designer with 12+ years of experience creating brand narratives, cinematic visuals and engaging digital experiences. I bring together 2D/3D motion, CGI, product visualisation and emerging AI workflows to turn ideas into memorable visual stories.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5 sm:mt-9 sm:gap-3">
                {['3D & CGI', 'Motion Design', 'Brand Storytelling', 'AI-Enabled Workflows'].map((tag) => (
                  <span
                    key={tag}
                    className="portfolio-meta inline-flex items-center gap-2 rounded-md border border-fuchsia-300/20 bg-white/[0.045] px-3.5 py-2 tracking-wide text-fuchsia-50/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 bg-fuchsia-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3.5 sm:gap-4">
              <a
                href="mailto:"
                className="group relative flex min-h-[82px] items-center justify-between overflow-hidden rounded-2xl border border-fuchsia-200/35 bg-gradient-to-b from-[#38234f] via-[#211532] to-[#120d20] p-4 shadow-[0_7px_0_#080511,0_15px_30px_rgba(0,0,0,0.48),inset_0_2px_0_rgba(255,255,255,0.22),inset_0_-3px_0_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-fuchsia-200/70 hover:brightness-110 hover:shadow-[0_9px_0_#080511,0_20px_38px_rgba(217,70,239,0.2),inset_0_2px_0_rgba(255,255,255,0.25)] active:translate-y-1 active:shadow-[0_3px_0_#080511,0_8px_18px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0a1b] sm:p-5"
              >
                <span className="flex items-center gap-3.5 sm:gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/12 text-fuchsia-300">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="portfolio-eyebrow block text-fuchsia-200/55">LET’S TALK</span>
                    <span className="portfolio-body mt-0.5 block font-medium text-white/90">Email address to be added</span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-fuchsia-200/50 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fuchsia-200" />
              </a>

              <a
                href="https://www.linkedin.com/in/yuvrajsinghdesign/"
                target="_blank"
                rel="noreferrer"
                className="group relative flex min-h-[82px] items-center justify-between overflow-hidden rounded-2xl border border-violet-200/35 bg-gradient-to-b from-[#302653] via-[#1d1835] to-[#100d20] p-4 shadow-[0_7px_0_#080511,0_15px_30px_rgba(0,0,0,0.48),inset_0_2px_0_rgba(255,255,255,0.22),inset_0_-3px_0_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-violet-200/70 hover:brightness-110 hover:shadow-[0_9px_0_#080511,0_20px_38px_rgba(139,92,246,0.2),inset_0_2px_0_rgba(255,255,255,0.25)] active:translate-y-1 active:shadow-[0_3px_0_#080511,0_8px_18px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0a1b] sm:p-5"
              >
                <span className="flex items-center gap-3.5 sm:gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/12 text-fuchsia-300">
                    <Linkedin className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="portfolio-eyebrow block text-fuchsia-200/55">CONNECT</span>
                    <span className="portfolio-body mt-0.5 block font-medium text-white/90">LinkedIn · Yuvraj Singh</span>
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-fuchsia-200/50 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-fuchsia-200" />
              </a>

              <a
                href="/resume.pdf"
                download
                className="portfolio-body relative isolate mt-1 flex min-h-[62px] items-center justify-center gap-3 overflow-hidden rounded-xl border border-fuchsia-100/55 bg-gradient-to-b from-[#f06bff] via-[#a83df0] to-[#6425c9] px-6 py-4 font-bold tracking-wide text-white shadow-[0_7px_0_#35106f,0_15px_32px_rgba(168,61,240,0.36),inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(54,12,105,0.35)] transition-all duration-200 hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_9px_0_#35106f,0_22px_42px_rgba(217,70,239,0.42),inset_0_2px_0_rgba(255,255,255,0.58)] active:translate-y-1 active:shadow-[0_3px_0_#35106f,0_8px_18px_rgba(168,61,240,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0a1b] sm:mt-2"
              >
                <ArrowDownToLine className="h-4 w-4" /> Download Resume
              </a>
              <p className="portfolio-meta text-center text-fuchsia-100/40">Resume file will be connected here.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
