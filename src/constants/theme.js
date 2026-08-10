/**
 * Nuova Palette Restrittiva - 10 Colori Ufficiali
 * Single Source of Truth per moduli JavaScript (Canvas, Confetti, SVG, Inline Styles)
 */
export const PALETTE = {
  canvas: '#1e1333',
  card: '#5c2a5c',
  plum: '#833d6f',
  plumMuted: '#785076',
  sage: '#9ca98b',
  blue: '#a8c6de',
  sand: '#efdebd',
  terracotta: '#8f5a5a',
  sidebar: '#6e5a8e',
  lavender: '#9a85c0',
};

/**
 * Esplosione Confetti XP - Tassativamente ristretta ai colori della palette
 */
export const CONFETTI_COLORS = [
  PALETTE.sand,
  PALETTE.lavender,
  PALETTE.blue,
  PALETTE.sage,
  PALETTE.plum,
];
