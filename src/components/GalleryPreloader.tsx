import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { computePreloadProgress } from './galleryPreloaderUtils';

export interface ImagePreloaderState {
  ready: boolean;
  settledCount: number;
  totalCount: number;
  percent: number;
}

function loadAndDecodeImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(finish, finish);
      } else {
        finish();
      }
    };
    img.onerror = finish;
    img.src = url;

    if (img.complete) {
      if (typeof img.decode === 'function') {
        img.decode().then(finish, finish);
      } else {
        finish();
      }
    }
  });
}

export function useImagePreloader(
  urls: readonly string[],
  timeoutMs = 5000
): ImagePreloaderState {
  const totalCount = urls.length;
  const [settledCount, setSettledCount] = useState<number>(totalCount === 0 ? 0 : 0);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  const key = urls.join('|');

  useEffect(() => {
    if (totalCount === 0) {
      setSettledCount(0);
      setTimedOut(false);
      return;
    }

    let cancelled = false;
    let completed = 0;
    setSettledCount(0);
    setTimedOut(false);

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        setTimedOut(true);
      }
    }, timeoutMs);

    urls.forEach((url) => {
      void loadAndDecodeImage(url).then(() => {
        if (cancelled) return;
        completed += 1;
        setSettledCount(completed);
        if (completed >= totalCount) {
          window.clearTimeout(timer);
        }
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, totalCount, timeoutMs]);

  const progress = computePreloadProgress(settledCount, totalCount);
  const ready = progress.isComplete || timedOut;

  return {
    ready,
    settledCount: ready ? totalCount : settledCount,
    totalCount,
    percent: ready ? 100 : progress.percent,
  };
}

export function GalleryPreloader({
  percent,
  reduceMotion = false,
}: {
  percent: number;
  reduceMotion?: boolean;
}) {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={`Loading work gallery (${percent}%)`}
      initial={false}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050608]"
    >
      <div className="flex w-48 flex-col items-center gap-3.5 sm:w-56">
        <div className="relative h-9 w-9">
          <div className="absolute inset-0 rounded-full border border-white/15" />
          <div
            className={`absolute inset-0 rounded-full border-2 border-transparent border-t-[#7c1fff] ${
              reduceMotion ? '' : 'animate-spin'
            }`}
          />
        </div>

        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-[#7c1fff]"
            initial={{ width: '0%' }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          />
        </div>

        <div className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          <span>LOADING WORK</span>
          <span>{percent}%</span>
        </div>
      </div>
    </motion.div>
  );
}
