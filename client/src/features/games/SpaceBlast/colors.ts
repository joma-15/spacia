/* ═══════════════════════════════════════════════════════════════════════
 * THEME — every color/radius used by SpaceBlast lives here.
 * Want to re-skin the whole game? Edit this file only.
 * ═══════════════════════════════════════════════════════════════════════ */

export const THEME = {
  bg: "#0F1F17",
  bgCard: "#162B1E",
  bgElevated: "#1C3527",

  primary: "#3DDC84",
  primaryDim: "#2AAF63",
  primaryGlow: "rgba(61,220,132,0.25)",

  correct: "#3DDC84",
  correctGlow: "rgba(61,220,132,0.35)",
  wrong: "#E05C7A",
  wrongGlow: "rgba(224,92,122,0.35)",

  textWhite: "#F0FFF6",
  textMid: "#A8C5B0",
  textMuted: "#5A7A65",

  border: "#243D2C",
  borderBright: "#2E5438",

  panelBg: "rgba(15,31,23,0.78)",
  panelBorder: "rgba(61,220,132,0.35)",

  overlayBg: "rgba(6,14,10,0.82)",

  radiusSm: 10,
  radiusMd: 14,
  radiusFull: 999,
} as const;

// The four color combinations used to paint each floating "space rock".
// Lane index picks one of these (wrapping around), just for visual variety.
export const ROCK_PALETTES = [
  {
    colors: ["#7A5FBF", "#2E1F52"],
    glow: "rgba(155,110,255,0.45)",
    border: "#B29CFF",
    craterColor: "rgba(20,10,40,0.55)",
  },
  {
    colors: ["#6B6F4A", "#26281A"],
    glow: "rgba(200,200,120,0.35)",
    border: "#9BA06A",
    craterColor: "rgba(10,10,5,0.55)",
  },
  {
    colors: ["#C97A46", "#5A2C14"],
    glow: "rgba(255,150,80,0.4)",
    border: "#E0A56B",
    craterColor: "rgba(35,15,5,0.55)",
  },
  {
    colors: ["#5C6B70", "#1C2528"],
    glow: "rgba(160,200,210,0.3)",
    border: "#8CA3A9",
    craterColor: "rgba(5,10,12,0.55)",
  },
] as const;
