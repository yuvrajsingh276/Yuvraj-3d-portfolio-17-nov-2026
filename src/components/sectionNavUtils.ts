export const GOLDEN_RATIO = 1.61803398875;

/**
 * Modular typography scale anchored at 1rem (16px) using phi = 1.618.
 */
export const GOLDEN_TYPE_SCALE = {
  micro: Number((1 / GOLDEN_RATIO).toFixed(3)),        // 0.618rem
  meta: Number((1 / Math.sqrt(GOLDEN_RATIO)).toFixed(3)), // 0.786rem
  body: 1,                                             // 1.000rem
  subhead: Number(Math.sqrt(GOLDEN_RATIO).toFixed(3)), // 1.272rem
  titleMd: Number(GOLDEN_RATIO.toFixed(3)),            // 1.618rem
  titleLg: Number((GOLDEN_RATIO ** 2).toFixed(3)),     // 2.618rem
  displayXl: Number((GOLDEN_RATIO ** 3).toFixed(3)),   // 4.236rem
  display2Xl: Number((GOLDEN_RATIO ** 4).toFixed(3)),  // 6.854rem
  bodyLeading: Number(GOLDEN_RATIO.toFixed(3)),        // 1.618
} as const;

export type PageSectionId = 'home' | 'video' | 'work' | 'experience' | 'about';

export interface SectionTheme {
  id: PageSectionId;
  targetId: string;
  label: string;
  accentHex: string;
  accentGlow: string;
  surfaceBg: string;
}

export const SECTION_THEMES: Record<PageSectionId, SectionTheme> = {
  home: {
    id: 'home',
    targetId: 'home',
    label: 'Home',
    accentHex: '#a78bfa',
    accentGlow: 'rgba(167, 139, 250, 0.5)',
    surfaceBg: '#0b0a1f',
  },
  video: {
    id: 'video',
    targetId: 'intro-video',
    label: 'Video',
    accentHex: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.5)',
    surfaceBg: '#11090e',
  },
  work: {
    id: 'work',
    targetId: 'work',
    label: 'Work',
    accentHex: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.5)',
    surfaceBg: '#071019',
  },
  experience: {
    id: 'experience',
    targetId: 'experience',
    label: 'Experience',
    accentHex: '#34d399',
    accentGlow: 'rgba(52, 211, 153, 0.5)',
    surfaceBg: '#06110e',
  },
  about: {
    id: 'about',
    targetId: 'about',
    label: 'About',
    accentHex: '#e879f9',
    accentGlow: 'rgba(232, 121, 249, 0.5)',
    surfaceBg: '#0e0a1b',
  },
};

export const PAGE_SECTIONS: readonly SectionTheme[] = [
  SECTION_THEMES.home,
  SECTION_THEMES.video,
  SECTION_THEMES.work,
  SECTION_THEMES.experience,
  SECTION_THEMES.about,
];

export interface SectionTopPositions {
  videoTop: number | null;
  workTop: number | null;
  experienceTop: number | null;
  aboutTop: number | null;
}

/**
 * Determines which section currently dominates the viewport based on stacked
 * sticky-overlay section bounding tops relative to viewport height.
 */
export function resolveActiveSection(
  positions: SectionTopPositions,
  viewportHeight: number
): PageSectionId {
  const vh = Math.max(1, viewportHeight);

  if (positions.aboutTop !== null && positions.aboutTop <= vh * 0.55) {
    return 'about';
  }
  if (positions.experienceTop !== null && positions.experienceTop <= vh * 0.45) {
    return 'experience';
  }
  if (positions.workTop !== null && positions.workTop <= vh * 0.45) {
    return 'work';
  }
  if (positions.videoTop !== null && positions.videoTop <= vh * 0.45) {
    return 'video';
  }
  return 'home';
}
