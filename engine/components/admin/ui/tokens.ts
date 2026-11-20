// Design tokens for all admin custom pages.
// Change here → updates everywhere.

export const C = {
  card:        'var(--adm-card-bg, #131313)',
  cardBorder:  'var(--adm-card-border, rgba(255,255,255,0.09))',
  surface:     'var(--theme-elevation-100, rgba(255,255,255,0.04))',
  text:        'var(--theme-text, #f4f4f5)',
  muted:       'var(--adm-color-muted, #a1a1aa)',
  blue:        'var(--adm-color-blue, #3b82f6)',
  blueCta:     'var(--adm-color-blue-cta, #2563eb)',
  blueCtaHover:'var(--adm-color-blue-cta-hover, #1d4fcc)',
  green:       'var(--adm-color-green, #10b981)',
  red:         'var(--adm-color-red, #ef4444)',
  amber:       'var(--adm-color-amber, #f59e0b)',
  purple:      '#8b5cf6',
  cyan:        '#06b6d4',
  pink:        '#ec4899',
} as const

export const EVENT_META: Record<string, { label: string; color: string }> = {
  domain_view:       { label: 'View',     color: '#6b7280' },
  offer_submit:      { label: 'Offer',    color: C.green },
  inquiry_submit:    { label: 'Inquiry',  color: C.blue },
  marketplace_click: { label: 'Mktpl.',   color: C.amber },
  buy_now_click:     { label: 'Buy Now',  color: C.blueCta },
}

export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany',  FR: 'France',
  CA: 'Canada',        AU: 'Australia',       IN: 'India',    JP: 'Japan',
  BR: 'Brazil',        NL: 'Netherlands',     SE: 'Sweden',   NO: 'Norway',
  DK: 'Denmark',       FI: 'Finland',         CH: 'Switzerland', AT: 'Austria',
  BE: 'Belgium',       ES: 'Spain',           IT: 'Italy',    PL: 'Poland',
  RU: 'Russia',        UA: 'Ukraine',         SG: 'Singapore', HK: 'Hong Kong',
  CN: 'China',         KR: 'South Korea',     MX: 'Mexico',   ZA: 'South Africa',
}
