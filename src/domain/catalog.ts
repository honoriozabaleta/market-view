/**
 * Static reference data: the houses we follow, the asset classes we compare and
 * the common five-step scale every original label is mapped onto.
 */

export const HOUSE_IDS = ['jpm', 'ubs', 'blk', 'gs', 'ms'] as const;
export type HouseId = (typeof HOUSE_IDS)[number];

export const ASSET_IDS = [
  'us-equities',
  'europe-equities',
  'japan-equities',
  'em-equities',
  'us-treasuries',
  'ig-credit',
  'hy-credit',
  'em-debt',
  'gold',
  'commodities',
  'us-dollar',
  'cash',
] as const;
export type AssetId = (typeof ASSET_IDS)[number];

export type Score = -2 | -1 | 0 | 1 | 2;
export type ScoreKey = '2' | '1' | '0' | '-1' | '-2';
export const SCORE_STEPS: readonly Score[] = [2, 1, 0, -1, -2];

export const COMMON_LABEL: Record<ScoreKey, string> = {
  '2': 'Strong overweight',
  '1': 'Overweight',
  '0': 'Neutral',
  '-1': 'Underweight',
  '-2': 'Strong underweight',
};

export const SHORT_LABEL: Record<ScoreKey, string> = {
  '2': 'OW+',
  '1': 'OW',
  '0': 'N',
  '-1': 'UW',
  '-2': 'UW−',
};

export type Voice = 'research' | 'wealth' | 'am';

export interface House {
  id: HouseId;
  name: string;
  mono: string;
  /** Categorical colour for the house marker. Deliberately unrelated to brand colours. */
  color: string;
  team: string;
  positioningVoice: Voice;
  publication: string;
  cadence: string;
  url: string;
  /** Default wording of the house's allocation scale; an edition can override it. */
  scale: Record<ScoreKey, string>;
  voices: Record<Voice, string>;
}

const standardScale: Record<ScoreKey, string> = {
  '2': 'Strong overweight',
  '1': 'Overweight',
  '0': 'Neutral',
  '-1': 'Underweight',
  '-2': 'Strong underweight',
};

export const HOUSES: readonly House[] = [
  {
    id: 'jpm',
    name: 'J.P. Morgan',
    mono: 'JP',
    color: '#2F4BD8',
    team: 'Asset Management · Multi-Asset Solutions',
    positioningVoice: 'am',
    publication: 'Global Asset Allocation Views',
    cadence: 'Quarterly',
    url: 'https://am.jpmorgan.com/content/jpm-am-aem/global-institutional/us/en/institutional/insights/portfolio-insights/asset-class-views/asset-allocation.html',
    scale: standardScale,
    voices: {
      research: 'Global Research — annual and mid-year outlook',
      wealth: 'Private Bank — Annual Outlook',
      am: 'Multi-Asset Solutions — Global Asset Allocation Views (quarterly)',
    },
  },
  {
    id: 'ubs',
    name: 'UBS',
    mono: 'UB',
    color: '#7C3AED',
    team: 'Global Wealth Management · Chief Investment Office',
    positioningVoice: 'wealth',
    publication: 'House View',
    cadence: 'Monthly',
    url: 'https://www.ubs.com/global/en/wealthmanagement/insights/chief-investment-office/house-view.html',
    scale: {
      '2': 'Most attractive',
      '1': 'Attractive',
      '0': 'Neutral',
      '-1': 'Unattractive',
      '-2': 'Least attractive',
    },
    voices: {
      research: 'Investment Bank Global Research (mostly client-only)',
      wealth: 'Chief Investment Office — House View (monthly)',
      am: 'Asset Management — Macro Quarterly',
    },
  },
  {
    id: 'blk',
    name: 'BlackRock',
    mono: 'BR',
    color: '#27272A',
    team: 'BlackRock Investment Institute',
    positioningVoice: 'am',
    publication: 'Weekly commentary · tactical views',
    cadence: 'Weekly',
    url: 'https://www.blackrock.com/corporate/insights/blackrock-investment-institute/global-weekly-commentary',
    scale: standardScale,
    voices: {
      research: '— asset manager, no sell-side research',
      wealth: '— distribution only',
      am: 'BlackRock Investment Institute — weekly tactical views',
    },
  },
  {
    id: 'gs',
    name: 'Goldman Sachs',
    mono: 'GS',
    color: '#0E7490',
    team: 'Wealth Management · Investment Strategy Group',
    positioningVoice: 'wealth',
    publication: 'ISG Outlook and tactical tilts',
    cadence: 'Annual + updates',
    url: 'https://pwm.gs.com/nam/en-us/insights/markets-and-investing',
    scale: {
      '2': 'Strong tactical overweight',
      '1': 'Tactical overweight',
      '0': 'Neutral',
      '-1': 'Tactical underweight',
      '-2': 'Strong tactical underweight',
    },
    voices: {
      research: 'Global Investment Research — Macro and Markets Outlook',
      wealth: 'Investment Strategy Group — Outlook and tactical tilts',
      am: 'Asset Management — Market Pulse (monthly)',
    },
  },
  {
    id: 'ms',
    name: 'Morgan Stanley',
    mono: 'MS',
    color: '#B45309',
    team: 'Wealth Management · Global Investment Committee',
    positioningVoice: 'wealth',
    publication: 'On the Markets',
    cadence: 'Monthly',
    url: 'https://graystone.morganstanley.com/graystone-consulting-new-york-ny-penn-plaza/thought_leadership',
    scale: { ...standardScale, '0': 'Equal weight' },
    voices: {
      research: 'Research — annual and mid-year outlook',
      wealth: 'Global Investment Committee — On the Markets (monthly)',
      am: 'Investment Management — The BEAT',
    },
  },
];

export const CATEGORIES = [
  { id: 'eq', name: 'Equities' },
  { id: 'fi', name: 'Fixed income' },
  { id: 'ra', name: 'Real assets' },
  { id: 'fx', name: 'FX & cash' },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]['id'];

export interface Asset {
  id: AssetId;
  name: string;
  category: CategoryId;
}

export const ASSETS: readonly Asset[] = [
  { id: 'us-equities', name: 'US equities', category: 'eq' },
  { id: 'europe-equities', name: 'European equities', category: 'eq' },
  { id: 'japan-equities', name: 'Japanese equities', category: 'eq' },
  { id: 'em-equities', name: 'EM equities', category: 'eq' },
  { id: 'us-treasuries', name: 'US Treasuries', category: 'fi' },
  { id: 'ig-credit', name: 'Investment-grade credit', category: 'fi' },
  { id: 'hy-credit', name: 'High-yield credit', category: 'fi' },
  { id: 'em-debt', name: 'EM debt', category: 'fi' },
  { id: 'gold', name: 'Gold', category: 'ra' },
  { id: 'commodities', name: 'Oil & commodities', category: 'ra' },
  { id: 'us-dollar', name: 'US dollar', category: 'fx' },
  { id: 'cash', name: 'Cash', category: 'fx' },
];

export const HOUSE_BY_ID = Object.fromEntries(HOUSES.map((h) => [h.id, h])) as Record<
  HouseId,
  House
>;
export const ASSET_BY_ID = Object.fromEntries(ASSETS.map((a) => [a.id, a])) as Record<
  AssetId,
  Asset
>;
export const categoryName = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!.name;
export const scoreKey = (s: Score) => String(s) as ScoreKey;
