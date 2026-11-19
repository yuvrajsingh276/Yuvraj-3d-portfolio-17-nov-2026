import vitanicLogo from '../Vitanic/Vitanic logo.png';
import vitanicMotion1 from '../Vitanic/magnific_9ZapF2kNYZ.mp4';
import vitanicMotion2 from '../Vitanic/magnific_LwDZDRdswO.mp4';
import vitanicHeroPedestal from '../Vitanic/magnific_BhwnVSkoQR.png';
import vitanicLifestyle from '../Vitanic/magnific_Bhws4pZoQR.png';
import vitanicMacroRow from '../Vitanic/magnific_BhwzakDoQR.jpg';
import vitanicLightningPoster from '../Vitanic/magnific_DosL06rpcl.png';
import vitanicFloatingCitrus from '../Vitanic/magnific_ksWYK8z16B.png';
import vitanicLabelWrap from '../Vitanic/magnific_magnificflatwraparoundsupplementbottlelabelfullartwo82044_6AfabrFiJO.png';
import vitanicIngredientOrbit from '../Vitanic/magnific_p8lRHMBehw.png';
import vitanic60Gummies from '../Vitanic/magnific_recreate_dt4ESBVXSL.png';
import vitanicSpiralPeel from '../Vitanic/magnific_recreate-the-image_P3Qn8cT42C.png';
import vitanicCitrusPattern from '../Vitanic/magnific_Sydeg2FUb8.png';
import vitanicFlatlayOpen from '../Vitanic/magnific_SydFRLBUb8.png';
import vitanicGummyMound from '../Vitanic/magnific_WDkKG6tcXe.png';

import pulseLogoSystem from '../360/Logo V.png';
import pulseLogoMark from '../360/Luse 360 lgo.png';
import pulseToteBag from '../360/magnific_canvas-tote-bag-hanging-from-a-wooden-peg_EbnXKPBuuO.png';
import pulseCeramicMug from '../360/magnific_ceramic-matte-mug_3z5UY6pREY.png';
import pulseSocks from '../360/magnific_closeup-of-a-mans-crossed-legs-seated_5jMhstDKxe.png';
import pulseBlueprintBook from '../360/magnific_cover-trust-blue-to-pulse-green-split-design_kspagOS16B.png';
import pulseConferenceStage from '../360/magnific_dark-conference-auditorium_rgdfrw7xtc.png';
import pulseTshirt from '../360/magnific_indian-man-late-20s_JNf1iImOq4.png';
import pulseHoodie from '../360/magnific_indian-woman_6AqgzFYiJO.png';
import pulseSocialSquare from '../360/magnific_leftaligned-headline-in-white_P3uxsEs42C.png';
import pulseBaseballCap from '../360/magnific_midnight-navy-sixpanel-baseball-cap_bxVmLB65Y2.png';
import pulseDayBillboard from '../360/magnific_photorealistic-daytime-street_gOtHgwRSXO.png';
import pulseNightBillboard from '../360/magnific_photorealistic-night-street-scene_gOtHlL9SXO.png';
import pulseIdCard from '../360/magnific_photorealistic-vertical-employee-id-card-hanging_u5YBAPcQLD.png';
import pulseSocialSplit from '../360/magnific_portrait-social-post-split-layout_O6C1jaCynm.png';
import pulseVerticalPoster from '../360/magnific_premium-vertical-poster_Bh9nc3SoQR.png';
import pulseRollupBanner from '../360/magnific_retractable-rollup-banner-standing_4RQj4Gf9Aa.png';
import pulseWaterBottle from '../360/magnific_stainless-steel-insulated-water-bottle_kspagHI16B.png';
import pulseWideHero from '../360/magnific_wide-hero-banner_8a6WTAaIrU.png';
import pulseLanyard from '../360/magnific_woven-emerald-green-fabric-lanyard-coiled_3z5UYztREY.png';

export const WORK_ASSETS: Record<string, string> = {
  'vitanic-logo': vitanicLogo,
  'vitanic-motion-1': vitanicMotion1,
  'vitanic-motion-2': vitanicMotion2,
  'vitanic-hero-pedestal': vitanicHeroPedestal,
  'vitanic-lifestyle': vitanicLifestyle,
  'vitanic-macro-row': vitanicMacroRow,
  'vitanic-lightning-poster': vitanicLightningPoster,
  'vitanic-floating-citrus': vitanicFloatingCitrus,
  'vitanic-label-wrap': vitanicLabelWrap,
  'vitanic-ingredient-orbit': vitanicIngredientOrbit,
  'vitanic-60-gummies': vitanic60Gummies,
  'vitanic-spiral-peel': vitanicSpiralPeel,
  'vitanic-citrus-pattern': vitanicCitrusPattern,
  'vitanic-flatlay-open': vitanicFlatlayOpen,
  'vitanic-gummy-mound': vitanicGummyMound,

  'pulse-logo-system': pulseLogoSystem,
  'pulse-logo-mark': pulseLogoMark,
  'pulse-tote-bag': pulseToteBag,
  'pulse-ceramic-mug': pulseCeramicMug,
  'pulse-socks': pulseSocks,
  'pulse-blueprint-book': pulseBlueprintBook,
  'pulse-conference-stage': pulseConferenceStage,
  'pulse-tshirt': pulseTshirt,
  'pulse-hoodie': pulseHoodie,
  'pulse-social-square': pulseSocialSquare,
  'pulse-baseball-cap': pulseBaseballCap,
  'pulse-day-billboard': pulseDayBillboard,
  'pulse-night-billboard': pulseNightBillboard,
  'pulse-id-card': pulseIdCard,
  'pulse-social-split': pulseSocialSplit,
  'pulse-vertical-poster': pulseVerticalPoster,
  'pulse-rollup-banner': pulseRollupBanner,
  'pulse-water-bottle': pulseWaterBottle,
  'pulse-wide-hero': pulseWideHero,
  'pulse-lanyard': pulseLanyard,
};

export function resolveWorkAsset(key?: string): string | undefined {
  if (!key) return undefined;
  return WORK_ASSETS[key];
}
