export interface PreloadProgress {
  percent: number;
  isComplete: boolean;
}

export function dedupeImageUrls(urls: readonly (string | undefined)[]): string[] {
  const unique = new Set<string>();
  for (const url of urls) {
    if (typeof url === 'string') {
      const trimmed = url.trim();
      if (trimmed.length > 0) {
        unique.add(trimmed);
      }
    }
  }
  return Array.from(unique);
}

export function computePreloadProgress(settled: number, total: number): PreloadProgress {
  if (total <= 0) {
    return { percent: 100, isComplete: true };
  }
  const safeSettled = Math.max(0, Math.min(total, Math.floor(settled)));
  const percent = Math.round((safeSettled / total) * 100);
  return {
    percent,
    isComplete: safeSettled >= total,
  };
}
