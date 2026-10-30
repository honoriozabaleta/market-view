/** Names and sizes of the share images generated at build time (scripts/share). */
export const CARD_SIZE = { og: [1200, 630], post: [1080, 1350] } as const;
export type CardKind = keyof typeof CARD_SIZE;

export const cardFileName = (editionId: string, kind: CardKind) =>
  `share/market-view-${editionId}${kind === 'post' ? '-post' : ''}.png`;
