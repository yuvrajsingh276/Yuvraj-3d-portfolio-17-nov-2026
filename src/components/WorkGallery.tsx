import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Maximize2, Play, X } from 'lucide-react';
import {
  collectGalleryPreloadKeys,
  getMediaGridClasses,
  getProjectById,
  projects,
  type Project,
  type ProjectMedia,
} from '../data/workCatalog';
import { resolveWorkAsset } from '../data/workAssets';
import { GalleryPreloader, useImagePreloader } from './GalleryPreloader';
import { dedupeImageUrls } from './galleryPreloaderUtils';

export { projects };
export type { Project };

const surfaces: Record<string, string> = {
  orange: 'radial-gradient(ellipse at 70% 28%, #b45309 0%, #5c2507 32%, #1f110a 70%, #09080b 100%)',
  violet: 'radial-gradient(ellipse at 72% 30%, #8772ad 0%, #3c3454 28%, #151b29 68%, #090e17 100%)',
  gold: 'radial-gradient(ellipse at 70% 28%, #a18a61 0%, #514735 32%, #1b1b20 72%, #090d13 100%)',
  blue: 'radial-gradient(ellipse at 72% 28%, #6285a4 0%, #34485c 30%, #17212d 68%, #090e17 100%)',
  rose: 'radial-gradient(ellipse at 72% 28%, #956d83 0%, #4b3547 32%, #211a27 70%, #090d13 100%)',
  emerald: 'radial-gradient(ellipse at 72% 28%, #5d8d7d 0%, #294b47 32%, #15262a 70%, #090d13 100%)',
};

function Visual({
  project,
  coverKey,
  className = '',
  fill = false,
  showWatermark = true,
  imagesReady = true,
}: {
  project: Project;
  coverKey?: string;
  className?: string;
  fill?: boolean;
  showWatermark?: boolean;
  imagesReady?: boolean;
}) {
  const imageSrc = resolveWorkAsset(coverKey);
  const positionClass = fill ? 'absolute inset-0' : 'relative';

  if (imageSrc) {
    return (
      <div
        className={`${positionClass} isolate overflow-hidden ${className}`}
        style={{ background: surfaces[project.mood] ?? surfaces.violet }}
      >
        {imagesReady && (
          <img
            src={imageSrc}
            alt={project.title}
            decoding="sync"
            className="h-full w-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b12]/80 via-black/15 to-black/30" />
        {showWatermark && (
          <span className="absolute bottom-5 right-6 font-mono text-[9px] tracking-[.28em] text-white/45">
            YS / {project.id}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${positionClass} isolate overflow-hidden ${className}`}
      style={{ background: surfaces[project.mood] ?? surfaces.violet }}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: 'linear-gradient(115deg,transparent 18%,rgba(255,255,255,.13) 48%,transparent 66%)' }}
      />
      <div className="absolute -right-[12%] top-[4%] h-[82%] aspect-[.72] rounded-[48%] border border-white/20 bg-white/[.06] shadow-[0_0_100px_rgba(255,255,255,.08)]" />
      <div className="absolute right-[14%] top-[16%] h-[60%] aspect-[.72] rounded-[48%] border border-white/20 bg-black/10 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b12]/80 via-transparent to-black/10" />
      {showWatermark && (
        <span className="absolute bottom-5 right-6 font-mono text-[9px] tracking-[.28em] text-white/45">
          YS / {project.id}
        </span>
      )}
    </div>
  );
}

export function WorkGallery({ onOpenProject }: { onOpenProject: (projectId: string) => void }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement | null>(null);

  const preloadUrls = useMemo(
    () => dedupeImageUrls(collectGalleryPreloadKeys(projects).map(resolveWorkAsset)),
    []
  );
  const { ready, percent } = useImagePreloader(preloadUrls);

  const safeIndex = projects.length > 0 ? Math.min(active, projects.length - 1) : 0;
  const project = projects[safeIndex] ?? projects[0];
  const heroSrc = resolveWorkAsset(project.workSectionHeroKey ?? project.heroCoverKey ?? project.cardCoverKey);

  const select = useCallback(
    (index: number) => {
      if (projects.length === 0) return;
      const nextIndex = (index + projects.length) % projects.length;
      setActive(nextIndex);
      const rail = railRef.current;
      const card = rail?.children[nextIndex] as HTMLElement | undefined;
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    },
    []
  );

  const move = useCallback((direction: number) => select(safeIndex + direction), [safeIndex, select]);

  const highlightMetric =
    project.media.length > 0 ? `${project.media.length} Assets` : '98% Match';

  return (
    <section
      aria-label="Selected work"
      aria-busy={!ready}
      className="work-exhibition relative flex h-full min-h-0 w-full flex-col justify-between overflow-hidden bg-[#050608] text-white"
    >
      <AnimatePresence>
        {!ready && (
          <GalleryPreloader percent={percent} reduceMotion={Boolean(reduceMotion)} />
        )}
      </AnimatePresence>

      {/* Full-width edge-to-edge cinematic hero backdrop */}
      <AnimatePresence initial={false}>
        <motion.div
          key={project.id}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.015 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0"
        >
          {ready && heroSrc ? (
            <img
              src={heroSrc}
              alt=""
              aria-hidden="true"
              decoding="sync"
              className="h-full w-full object-cover object-[68%_28%] sm:object-[64%_30%]"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: surfaces[project.mood] ?? surfaces.violet }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Directional dark vignettes matching reference: crisp artwork on right, legible copy on left, seamless dark floor under MY WORK */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.92)_0%,rgba(5,6,8,0.72)_34%,rgba(5,6,8,0.20)_66%,rgba(5,6,8,0.38)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#050608_0%,#050608_31%,rgba(5,6,8,0.90)_46%,rgba(5,6,8,0.35)_64%,transparent_84%)]"
      />

      {/* Featured hero title and metadata */}
      <div className="relative z-20 my-auto max-w-3xl px-5 py-4 sm:px-10 lg:px-14">
        <h2 className="max-w-[14ch] text-[clamp(2rem,4.4vw,3.85rem)] font-extrabold uppercase leading-[0.98] tracking-[-0.02em] text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)]">
          {project.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[13px]">
          <span className="text-white/80">{project.type}</span>
          <span className="font-semibold text-[#34d399]">{highlightMetric}</span>
          <span className="font-semibold text-white/95">{project.year}</span>
        </div>
      </div>

      {/* Bottom full-width MY WORK poster rail bleeding to the right edge */}
      <div className="relative z-20 shrink-0 pb-5 sm:pb-7">
        <div className="mb-3 flex items-center justify-between px-5 pr-12 sm:px-10 sm:pr-14 lg:px-14 lg:pr-16">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-white sm:text-sm">
            MY WORK
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous project"
              onClick={() => move(-1)}
              className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/40 text-white/75 transition hover:border-white hover:text-white"
            >
              <ArrowLeft size={12} />
            </button>
            <button
              type="button"
              aria-label="Next project"
              onClick={() => move(1)}
              className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/40 text-white/75 transition hover:border-white hover:text-white"
            >
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          className="flex w-full items-center gap-3 overflow-x-auto overflow-y-hidden pl-5 pr-6 pb-1.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:pl-10 sm:pr-10 lg:pl-14 lg:pr-14"
        >
          {projects.map((item, index) => {
            const isSelected = index === safeIndex;
            return (
              <motion.button
                key={item.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => onOpenProject(item.id)}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                aria-label={`Explore ${item.title}`}
                aria-current={isSelected ? 'true' : undefined}
                className={`group relative aspect-[2/3] w-[124px] shrink-0 overflow-hidden rounded-[3px] bg-[#14161d] text-left transition-[opacity,box-shadow] duration-300 sm:w-[146px] lg:w-[164px] xl:w-[174px] ${
                  isSelected
                    ? 'opacity-100 ring-2 ring-white shadow-[0_14px_34px_rgba(0,0,0,0.85)]'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <Visual
                  project={item}
                  coverKey={item.cardCoverKey}
                  fill
                  showWatermark={false}
                  imagesReady={ready}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                {!item.cardCoverKey && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/25" />
                    <span className="absolute left-3 top-3 font-mono text-[9px] tracking-[.2em] text-white/70">
                      {item.id}
                    </span>
                    <div className="absolute inset-x-3 bottom-3.5">
                      <p className="mb-1 text-[7px] font-semibold uppercase tracking-[.16em] text-white/65">
                        {item.category}
                      </p>
                      <h4 className="line-clamp-3 text-xs font-bold uppercase leading-[1.12] tracking-[0.02em] [word-spacing:0.08em] text-white sm:text-sm">
                        {item.title}
                      </h4>
                    </div>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MediaCard({
  item,
  index,
  onOpen,
}: {
  item: ProjectMedia;
  index: number;
  onOpen: (idx: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const src = resolveWorkAsset(item.assetKey);
  const { wrapper, frame } = getMediaGridClasses(item.aspect);
  const useContain = item.kind === 'video' || item.aspect === 'panoramic';
  const indexLabel = String(index + 1).padStart(2, '0');

  return (
    <article className={`group ${wrapper}`}>
      <motion.button
        type="button"
        onClick={() => onOpen(index)}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        aria-label={`Inspect ${item.caption}`}
        className={`relative block w-full overflow-hidden border border-white/10 bg-[#05080f] text-left transition-colors hover:border-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${frame}`}
      >
        {src && item.kind === 'video' ? (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-contain bg-[#04060c] transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : src ? (
          <img
            src={src}
            alt={item.caption}
            decoding="async"
            className={`h-full w-full transition-transform duration-700 group-hover:scale-[1.035] ${
              useContain ? 'object-contain bg-[#0b0e14]' : 'object-cover object-center'
            }`}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15 opacity-85 transition-opacity group-hover:opacity-100" />
        <span className="pointer-events-none absolute left-4 top-4 font-mono text-[9px] tracking-[.22em] text-white/75">
          {indexLabel}
        </span>
        <span className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1.5 border border-white/20 bg-black/55 px-2.5 py-1 font-mono text-[8px] tracking-[.18em] text-white/85 backdrop-blur-sm">
          {item.kind === 'video' ? <Play size={10} /> : <Maximize2 size={10} />}
          {item.tag}
        </span>
      </motion.button>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-white/85">{item.caption}</p>
        <span className="shrink-0 font-mono text-[9px] tracking-[.18em] text-white/40">{indexLabel}</span>
      </div>
    </article>
  );
}

function MediaLightbox({
  media,
  activeIndex,
  onClose,
  onChangeIndex,
}: {
  media: ProjectMedia[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}) {
  const current = media[activeIndex];
  const src = resolveWorkAsset(current.assetKey);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onChangeIndex((activeIndex + 1) % media.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onChangeIndex((activeIndex - 1 + media.length) % media.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, media.length, onChangeIndex, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.caption}
      className="fixed inset-0 z-[90] flex flex-col bg-black/92 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <div
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[.22em] text-white/50">
            {String(activeIndex + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')} · {current.tag}
          </p>
          <h3 className="mt-1 truncate text-sm font-medium text-white sm:text-base">{current.caption}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Previous media"
            onClick={() => onChangeIndex((activeIndex - 1 + media.length) % media.length)}
            className="grid h-9 w-9 place-items-center border border-white/25 bg-white/[.04] text-white transition hover:border-white hover:bg-white/10"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next media"
            onClick={() => onChangeIndex((activeIndex + 1) % media.length)}
            className="grid h-9 w-9 place-items-center border border-white/25 bg-white/[.04] text-white transition hover:border-white hover:bg-white/10"
          >
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            aria-label="Close lightbox"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center border border-white/25 bg-white/[.04] text-white transition hover:border-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {current.kind === 'video' ? (
          <video
            key={current.id}
            src={src}
            controls
            autoPlay
            loop
            playsInline
            className="max-h-[80vh] max-w-full border border-white/15 bg-black shadow-2xl"
          />
        ) : (
          <img
            key={current.id}
            src={src}
            alt={current.caption}
            className="max-h-[80vh] max-w-full border border-white/15 bg-[#070a10] object-contain shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}

export function ProjectDetailPage({
  projectId,
  onBack,
  onNext,
}: {
  projectId: string;
  onBack: () => void;
  onNext: (projectId: string) => void;
}) {
  const index = Math.max(0, projects.findIndex((item) => item.id === projectId));
  const project = getProjectById(projectId);
  const nextProject = projects[(index + 1) % projects.length];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const logoSrc = project.logoOnDark ? resolveWorkAsset(project.logoKey) : undefined;
  const hasRealMedia = project.media.length > 0;
  const totalCount = hasRealMedia ? project.media.length : project.frames.length;

  useEffect(() => {
    setLightboxIndex(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#080d14';
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, [projectId]);

  return (
    <main key={project.id} className="min-h-screen bg-[#080d14] pt-16 text-white">
      <section className="grid min-h-[calc(100svh-4rem)] grid-cols-1 lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-[7vw] lg:py-20">
          <button
            type="button"
            onClick={onBack}
            className="mb-10 inline-flex w-fit items-center gap-2 text-[9px] tracking-[.2em] text-white/55 transition hover:text-white"
          >
            <ArrowLeft size={14} /> BACK TO COLLECTION
          </button>

          {logoSrc && (
            <img
              src={logoSrc}
              alt={`${project.shortTitle ?? project.title} wordmark`}
              className="mb-6 h-9 w-auto object-contain object-left opacity-95 sm:h-11"
            />
          )}

          <p className="mb-4 text-[9px] font-semibold tracking-[.28em]" style={{ color: project.accent }}>
            {project.category}
          </p>
          <h1 className="max-w-[14ch] text-[clamp(2.3rem,5vw,5rem)] font-semibold leading-[.98] tracking-[-.055em]">
            {project.title}
          </h1>
          <p className="mt-7 max-w-xl text-sm leading-7 text-white/65">{project.description}</p>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-y border-white/10 py-5 sm:gap-6">
            <div>
              <p className="text-[8px] tracking-[.2em] text-white/35">YEAR</p>
              <p className="mt-2 text-sm">{project.year}</p>
            </div>
            <div>
              <p className="text-[8px] tracking-[.2em] text-white/35">DISCIPLINE</p>
              <p className="mt-2 text-xs text-white/80">{project.type}</p>
            </div>
            <div>
              <p className="text-[8px] tracking-[.2em] text-white/35">ROLE</p>
              <p className="mt-2 text-xs text-white/80">{project.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNext(nextProject.id)}
            className="mt-10 inline-flex w-fit items-center gap-3 border border-white/25 px-5 py-3 text-[9px] font-semibold tracking-[.2em] text-white/85 transition hover:border-white/70 hover:bg-white/[.08]"
          >
            NEXT PROJECT <ArrowRight size={14} />
          </button>
        </div>

        <div className="relative min-h-[55svh] overflow-hidden border-y border-white/[.08] lg:min-h-0 lg:border-l lg:border-y-0">
          <Visual
            project={project}
            coverKey={project.heroCoverKey ?? project.cardCoverKey}
            fill
            showWatermark={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d14]/75 via-transparent to-black/15" />
          <div className="absolute bottom-7 right-7 text-right">
            <p className="text-[8px] tracking-[.25em] text-white/65">PROJECT COVER / {project.year}</p>
            <p className="mt-2 text-xs tracking-widest text-white">
              {project.id} — {project.category}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-6 py-16 sm:px-12 lg:px-[7vw] lg:py-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold tracking-[.25em] text-white/40">SELECTED WORK</p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">Project gallery</h2>
          </div>
          <span className="font-mono text-[10px] tracking-[.2em] text-white/45">
            01 — {String(totalCount).padStart(2, '0')}
          </span>
        </div>

        {hasRealMedia ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12 lg:gap-7">
            {project.media.map((item, i) => (
              <MediaCard key={item.id} item={item} index={i} onOpen={setLightboxIndex} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 auto-rows-[110px] gap-3 sm:auto-rows-[150px] sm:gap-5 lg:grid-cols-12 lg:auto-rows-[92px]">
            {project.frames.map((frame, i) => {
              const layouts = [
                'col-span-2 row-span-3 lg:col-span-5 lg:row-span-5',
                'col-span-1 row-span-2 lg:col-span-4 lg:row-span-3 lg:mt-10',
                'col-span-1 row-span-2 lg:col-span-3 lg:row-span-4 lg:mt-20',
              ];
              return (
                <article key={frame} className={`group ${layouts[i % layouts.length]}`}>
                  <div className="relative h-full min-h-0 overflow-hidden border border-white/10">
                    <Visual project={project} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.045]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 font-mono text-[9px] tracking-widest text-white/75">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="mt-3 text-[9px] tracking-[.14em] text-white/60">{frame}</p>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-16 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[9px] tracking-[.2em] text-white/55 transition hover:text-white"
          >
            <ArrowLeft size={14} /> BACK TO COLLECTION
          </button>
          <button
            type="button"
            onClick={() => onNext(nextProject.id)}
            className="inline-flex items-center gap-3 border border-white/25 px-5 py-3 text-[9px] font-semibold tracking-[.2em] text-white/85 transition hover:border-white/70 hover:bg-white/[.08]"
          >
            NEXT PROJECT <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {hasRealMedia && lightboxIndex !== null && (
        <MediaLightbox
          media={project.media}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </main>
  );
}
