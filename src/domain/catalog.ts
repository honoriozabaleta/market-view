import type { AssetId } from './schema';
export const assets: {
  id: AssetId;
  label: string;
  scope: string;
  geography: string;
  currency: string;
}[] = [
  {
    id: 'us-equities',
    label: 'US equities',
    scope: 'broad-equities',
    geography: 'US',
    currency: 'USD',
  },
  {
    id: 'european-equities',
    label: 'European equities',
    scope: 'broad-equities',
    geography: 'Europe',
    currency: 'USD',
  },
  {
    id: 'em-equities',
    label: 'EM equities',
    scope: 'broad-equities',
    geography: 'Emerging markets',
    currency: 'USD',
  },
  {
    id: 'us-treasuries',
    label: 'US Treasuries',
    scope: 'all-maturities',
    geography: 'US',
    currency: 'USD',
  },
  {
    id: 'ig-credit',
    label: 'Investment-grade credit',
    scope: 'investment-grade',
    geography: 'US',
    currency: 'USD',
  },
  {
    id: 'hy-credit',
    label: 'High-yield credit',
    scope: 'high-yield',
    geography: 'US',
    currency: 'USD',
  },
  {
    id: 'us-dollar',
    label: 'US dollar',
    scope: 'trade-weighted',
    geography: 'US',
    currency: 'USD',
  },
  { id: 'gold', label: 'Gold', scope: 'spot-gold', geography: 'Global', currency: 'USD' },
];
export const METHODOLOGY_VERSION = '1.0.0';
