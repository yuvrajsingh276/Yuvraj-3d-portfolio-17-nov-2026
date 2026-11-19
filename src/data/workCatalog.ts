export type ProjectMood = 'orange' | 'emerald' | 'violet' | 'gold' | 'blue' | 'rose';
export type MediaAspect = 'landscape' | 'panoramic' | 'portrait' | 'square';
export type MediaKind = 'image' | 'video';

export interface ProjectMedia {
  id: string;
  assetKey: string;
  caption: string;
  tag: string;
  kind: MediaKind;
  aspect: MediaAspect;
}

export interface Project {
  id: string;
  title: string;
  shortTitle?: string;
  category: string;
  description: string;
  year: string;
  type: string;
  role: string;
  mood: ProjectMood;
  accent: string;
  logoKey?: string;
  logoOnDark?: boolean;
  cardCoverKey?: string;
  heroCoverKey?: string;
  workSectionHeroKey?: string;
  media: ProjectMedia[];
  frames: string[];
}

export const projects: Project[] = [
  {
    id: '01',
    title: 'Vitanic — Energy Restore Blend',
    shortTitle: 'Vitanic',
    category: 'PACKAGING & 3D CAMPAIGN',
    description:
      'Complete brand packaging, 3D CGI product staging, motion loops, and digital campaign visuals for Vitanic Energy Restore Blend — crafted to capture vibrant citrus energy in every frame.',
    year: '2025',
    type: 'Packaging · 3D CGI · Motion',
    role: 'LEAD 3D & BRAND DESIGN',
    mood: 'orange',
    accent: '#fb923c',
    logoKey: 'vitanic-logo',
    logoOnDark: true,
    cardCoverKey: 'vitanic-lightning-poster',
    heroCoverKey: 'vitanic-hero-pedestal',
    workSectionHeroKey: 'vitanic-floating-citrus',
    media: [
      {
        id: 'vitanic-01',
        assetKey: 'vitanic-hero-pedestal',
        caption: 'Hero Studio CGI — Bottle & Pedestal',
        tag: '3D PRODUCT HERO',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'vitanic-02',
        assetKey: 'vitanic-motion-1',
        caption: 'Kinetic Product Reel — Citrus Launch Motion',
        tag: 'MOTION · MP4',
        kind: 'video',
        aspect: 'square',
      },
      {
        id: 'vitanic-03',
        assetKey: 'vitanic-lightning-poster',
        caption: 'Citrus Energy Strike — Key Campaign Visual',
        tag: 'CAMPAIGN POSTER',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'vitanic-04',
        assetKey: 'vitanic-floating-citrus',
        caption: 'Floating Citrus Composition — Launch Key Visual',
        tag: '3D CGI',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'vitanic-05',
        assetKey: 'vitanic-motion-2',
        caption: 'Social Motion Loop — Energy Restore Spot',
        tag: 'MOTION · MP4',
        kind: 'video',
        aspect: 'panoramic',
      },
      {
        id: 'vitanic-06',
        assetKey: 'vitanic-spiral-peel',
        caption: 'Freshness Concept — Spiral Citrus Peel',
        tag: '3D ART DIRECTION',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'vitanic-07',
        assetKey: 'vitanic-ingredient-orbit',
        caption: 'Ingredient Orbit — Ginseng, Vitamin C & Electrolytes',
        tag: 'INFOGRAPHIC CGI',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'vitanic-08',
        assetKey: 'vitanic-60-gummies',
        caption: '30-Day Supply — Sculptural Typography Poster',
        tag: 'CAMPAIGN PRINT',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'vitanic-09',
        assetKey: 'vitanic-lifestyle',
        caption: 'Lifestyle Portrait — Daily Energy Ritual',
        tag: 'LIFESTYLE',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'vitanic-10',
        assetKey: 'vitanic-flatlay-open',
        caption: 'Overhead Flat-Lay — Open Jar & Gummies',
        tag: 'PRODUCT STUDY',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'vitanic-11',
        assetKey: 'vitanic-label-wrap',
        caption: 'Packaging Artwork — Full Wraparound Bottle Label',
        tag: 'PACKAGING DESIGN',
        kind: 'image',
        aspect: 'panoramic',
      },
      {
        id: 'vitanic-12',
        assetKey: 'vitanic-gummy-mound',
        caption: 'Abundance Banner — Gummy Mound Hero',
        tag: 'PANORAMIC BANNER',
        kind: 'image',
        aspect: 'panoramic',
      },
      {
        id: 'vitanic-13',
        assetKey: 'vitanic-macro-row',
        caption: 'Macro Texture Study — Spiral Gummy Lineup',
        tag: 'MACRO CGI',
        kind: 'image',
        aspect: 'panoramic',
      },
      {
        id: 'vitanic-14',
        assetKey: 'vitanic-citrus-pattern',
        caption: 'Editorial Banner — Citrus Rhythm Pattern',
        tag: 'BANNER DESIGN',
        kind: 'image',
        aspect: 'panoramic',
      },
    ],
    frames: ['Hero Studio CGI', 'Motion Reel', 'Packaging Artwork'],
  },
  {
    id: '02',
    title: 'Pulse 360° — Brand Identity',
    shortTitle: 'Pulse 360°',
    category: 'BRAND IDENTITY & CAMPAIGN',
    description:
      'A 360-degree health and wellness brand ecosystem built around "Track, Analyze, Improve." — spanning logo architecture, keynote auditorium visuals, outdoor OOH, editorial print, and tactile merchandise.',
    year: '2025',
    type: 'Brand Identity · OOH · Merch',
    role: 'BRAND & ART DIRECTION',
    mood: 'emerald',
    accent: '#34d399',
    logoKey: 'pulse-logo-mark',
    logoOnDark: false,
    cardCoverKey: 'pulse-vertical-poster',
    heroCoverKey: 'pulse-conference-stage',
    media: [
      {
        id: 'pulse-01',
        assetKey: 'pulse-wide-hero',
        caption: 'Campaign Key Visual — Real-Time Health Insights',
        tag: 'HERO CAMPAIGN',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'pulse-02',
        assetKey: 'pulse-logo-system',
        caption: 'Brand Identity System — Logo Variations & Lockups',
        tag: 'IDENTITY SYSTEM',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'pulse-03',
        assetKey: 'pulse-vertical-poster',
        caption: 'Brand Manifesto Poster — Track, Analyze, Improve',
        tag: 'BRAND POSTER',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-04',
        assetKey: 'pulse-conference-stage',
        caption: 'Keynote Stage — Conference Auditorium Screens',
        tag: 'ENVIRONMENTAL',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'pulse-05',
        assetKey: 'pulse-day-billboard',
        caption: 'Outdoor OOH — Street-Level Brick Billboard',
        tag: 'OOH CAMPAIGN',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'pulse-06',
        assetKey: 'pulse-night-billboard',
        caption: 'Urban Nightscape — Architectural Digital Display',
        tag: 'DIGITAL OOH',
        kind: 'image',
        aspect: 'panoramic',
      },
      {
        id: 'pulse-07',
        assetKey: 'pulse-blueprint-book',
        caption: 'The 360° Health Blueprint — Hardcover Book Design',
        tag: 'EDITORIAL PRINT',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'pulse-08',
        assetKey: 'pulse-logo-mark',
        caption: 'Primary Brand Mark — Pulse 360° Wordmark',
        tag: 'LOGO MARK',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'pulse-09',
        assetKey: 'pulse-social-square',
        caption: 'Social Campaign — Wearable Tracking Story',
        tag: 'DIGITAL SOCIAL',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'pulse-10',
        assetKey: 'pulse-social-split',
        caption: 'Social Split Layout — Wellness Built on History',
        tag: 'SOCIAL IDENTITY',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-11',
        assetKey: 'pulse-rollup-banner',
        caption: 'Clinical Roll-Up Standee — Hospital Lobby',
        tag: 'EXHIBITION',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-12',
        assetKey: 'pulse-id-card',
        caption: 'Staff Credential — Doctor ID Badge & Lanyard',
        tag: 'PRINT COLLATERAL',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-13',
        assetKey: 'pulse-lanyard',
        caption: 'Woven Brand Lanyard — Emerald Pulse Weave',
        tag: 'MERCHANDISE',
        kind: 'image',
        aspect: 'landscape',
      },
      {
        id: 'pulse-14',
        assetKey: 'pulse-water-bottle',
        caption: 'Insulated Flask — Matte Gradient Finish',
        tag: 'MERCHANDISE',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-15',
        assetKey: 'pulse-ceramic-mug',
        caption: 'Studio Ceramic Mug — Midnight Navy & Emerald',
        tag: 'MERCHANDISE',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'pulse-16',
        assetKey: 'pulse-baseball-cap',
        caption: 'Embroidered 6-Panel Cap — Midnight Navy',
        tag: 'APPAREL',
        kind: 'image',
        aspect: 'square',
      },
      {
        id: 'pulse-17',
        assetKey: 'pulse-hoodie',
        caption: 'Signature Hoodie — Pulse Green Edition',
        tag: 'APPAREL',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-18',
        assetKey: 'pulse-tshirt',
        caption: 'Team Tee — Front Crest & Back Wordmark',
        tag: 'APPAREL',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-19',
        assetKey: 'pulse-tote-bag',
        caption: 'Heavy Canvas Tote — Aurora Gradient Print',
        tag: 'MERCHANDISE',
        kind: 'image',
        aspect: 'portrait',
      },
      {
        id: 'pulse-20',
        assetKey: 'pulse-socks',
        caption: 'Custom Knit Socks — Embroidered Pulse Crest',
        tag: 'MERCHANDISE',
        kind: 'image',
        aspect: 'portrait',
      },
    ],
    frames: ['Hero Campaign', 'Identity System', 'OOH & Merchandise'],
  },
  {
    id: '03',
    title: 'Beyond the Frame',
    category: 'MOTION DESIGN',
    description: 'An exploration of rhythm, graphic form and dimensional motion for a bold visual identity.',
    year: '2024',
    type: 'Motion identity · 2D / 3D',
    role: 'ART DIRECTION',
    mood: 'blue',
    accent: '#8fc8f4',
    media: [],
    frames: ['Art direction', 'Motion frame', 'Final frame'],
  },
  {
    id: '04',
    title: 'Digital Dimensions',
    category: 'BRAND EXPERIENCE',
    description: 'A visual system that brings brand language into a tactile, immersive digital space.',
    year: '2023',
    type: 'Brand design · Digital',
    role: 'ART DIRECTION',
    mood: 'rose',
    accent: '#eaa6c5',
    media: [],
    frames: ['Visual identity', 'Digital application', 'Final frame'],
  },
  {
    id: '05',
    title: 'The Shape of Tomorrow',
    category: '3D ART DIRECTION',
    description: 'A study in atmosphere, sculptural form and cinematic lighting.',
    year: '2023',
    type: '3D art direction · CGI',
    role: 'ART DIRECTION',
    mood: 'emerald',
    accent: '#8bd7b3',
    media: [],
    frames: ['Sculptural study', 'Lighting pass', 'Final render'],
  },
  {
    id: '06',
    title: 'Neon Form Studies',
    category: 'CONCEPT / 3D STUDY',
    description: 'A concept-led exploration of luminous forms, colour and premium product-style lighting.',
    year: '2022',
    type: '3D study · Look development',
    role: 'ART DIRECTION',
    mood: 'violet',
    accent: '#bca7ff',
    media: [],
    frames: ['Form study', 'Lighting study', 'Final frame'],
  },
  {
    id: '07',
    title: 'Motion in Nature',
    category: 'CONCEPT / MOTION STUDY',
    description: 'A visual study imagining organic movement translated into a bold motion language.',
    year: '2022',
    type: 'Motion design · Experiment',
    role: 'ART DIRECTION',
    mood: 'emerald',
    accent: '#8bd7b3',
    media: [],
    frames: ['Nature study', 'Motion frame', 'Final frame'],
  },
  {
    id: '08',
    title: 'The Future Interface',
    category: 'CONCEPT / UI MOTION',
    description: 'A speculative interface concept combining dimensional graphics and kinetic typography.',
    year: '2021',
    type: 'UI motion · Design',
    role: 'ART DIRECTION',
    mood: 'blue',
    accent: '#8fc8f4',
    media: [],
    frames: ['Interface system', 'UI motion', 'Final frame'],
  },
  {
    id: '09',
    title: 'Objects of Desire',
    category: 'CONCEPT / PRODUCT CGI',
    description: 'A product campaign study focused on material finish, controlled reflections and visual impact.',
    year: '2021',
    type: 'Product CGI · Campaign',
    role: 'ART DIRECTION',
    mood: 'rose',
    accent: '#eaa6c5',
    media: [],
    frames: ['Product hero', 'Material detail', 'Final render'],
  },
  {
    id: '10',
    title: 'Beyond the Ordinary',
    category: 'CONCEPT / BRAND FILM',
    description: 'A brand-film direction created to explore cinematic composition and storytelling.',
    year: '2020',
    type: 'Brand film · Visual story',
    role: 'ART DIRECTION',
    mood: 'gold',
    accent: '#e8c98b',
    media: [],
    frames: ['Story frame', 'Visual direction', 'Final frame'],
  },
];

export function getProjectById(projectId: string): Project {
  const index = Math.max(0, projects.findIndex((item) => item.id === projectId));
  return projects[index];
}

export function getMediaGridClasses(aspect: MediaAspect): {
  wrapper: string;
  frame: string;
} {
  switch (aspect) {
    case 'panoramic':
      return {
        wrapper: 'col-span-1 sm:col-span-2 lg:col-span-12',
        frame: 'aspect-[21/8] sm:aspect-[24/8]',
      };
    case 'landscape':
      return {
        wrapper: 'col-span-1 sm:col-span-2 lg:col-span-6',
        frame: 'aspect-[16/9]',
      };
    case 'portrait':
      return {
        wrapper: 'col-span-1 lg:col-span-4',
        frame: 'aspect-[4/5]',
      };
    case 'square':
    default:
      return {
        wrapper: 'col-span-1 lg:col-span-4',
        frame: 'aspect-square',
      };
  }
}

export type WorkNavCategory = 'ALL WORK' | '3D / CGI' | 'BRANDING' | 'MOTION';

export const WORK_NAV_CATEGORIES: readonly WorkNavCategory[] = [
  'ALL WORK',
  '3D / CGI',
  'BRANDING',
  'MOTION',
];

export function filterWorkProjects(
  category: WorkNavCategory,
  searchQuery = ''
): Project[] {
  const q = searchQuery.trim().toLowerCase();
  return projects.filter((project) => {
    const matchesCategory =
      category === 'ALL WORK' ||
      (category === '3D / CGI' && /3D|CGI|PRODUCT/i.test(`${project.category} ${project.type}`)) ||
      (category === 'BRANDING' && /BRAND|PACKAGING/i.test(`${project.category} ${project.type}`)) ||
      (category === 'MOTION' && /MOTION|FILM/i.test(`${project.category} ${project.type}`));

    if (!matchesCategory) return false;
    if (!q) return true;
    return `${project.title} ${project.category} ${project.type} ${project.description}`
      .toLowerCase()
      .includes(q);
  });
}

export function collectGalleryPreloadKeys(
  projectList: readonly Project[] = projects
): string[] {
  const keys = new Set<string>();
  for (const project of projectList) {
    const heroKey = project.workSectionHeroKey ?? project.heroCoverKey ?? project.cardCoverKey;
    if (heroKey) keys.add(heroKey);
    if (project.cardCoverKey) keys.add(project.cardCoverKey);
  }
  return Array.from(keys);
}

export const SIDEBAR_CATEGORY_TARGETS: Record<string, number> = {
  HOME: 0,
  '3D / CGI': 0,
  BRANDING: 1,
  MOTION: 2,
  'MY WORK': 0,
};
