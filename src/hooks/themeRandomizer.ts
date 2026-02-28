export type ResolvedTheme = "light" | "dark";

const RANDOM_TOKEN_KEYS = [
  "--bg-canvas",
  "--bg-canvas-muted",
  "--bg-surface",
  "--bg-surface-elevated",
  "--bg-surface-strong",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--border-soft",
  "--border-strong",
  "--accent-primary",
  "--accent-secondary",
  "--accent-foreground",
  "--accent-soft",
  "--accent-border",
  "--accent-highlight",
  "--usage-5h",
  "--usage-5h-soft",
  "--usage-7d",
  "--usage-7d-soft",
  "--focus-ring",
  "--mesh-primary",
  "--mesh-secondary",
  "--mesh-tertiary",
  "--panel-edge",
  "--grain-strength",
] as const;

type RandomTokenKey = (typeof RANDOM_TOKEN_KEYS)[number];
type RandomTokenMap = Record<RandomTokenKey, string>;

export interface RandomThemePalette {
  baseTheme: ResolvedTheme;
  tokens: RandomTokenMap;
}

export const RANDOM_THEME_STORAGE_KEY = "codex-switcher:random-theme";
const CTA_MIN_CONTRAST = 4.5;
const ACCENT_FOREGROUND_LIGHT = "#ffffff";
const ACCENT_FOREGROUND_DARK = "#111d30";

interface WeightedHueBand {
  min: number;
  max: number;
  weight: number;
}

const PREMIUM_SURFACE_HUE_BANDS: WeightedHueBand[] = [
  { min: 196, max: 226, weight: 6 },
  { min: 180, max: 195, weight: 3 },
  { min: 228, max: 244, weight: 2 },
  { min: 136, max: 162, weight: 2 },
  { min: 34, max: 56, weight: 1 },
];

const PREMIUM_ACCENT_HUE_BANDS: WeightedHueBand[] = [
  { min: 204, max: 230, weight: 6 },
  { min: 184, max: 203, weight: 4 },
  { min: 162, max: 183, weight: 3 },
  { min: 142, max: 161, weight: 2 },
  { min: 234, max: 252, weight: 2 },
  { min: 38, max: 56, weight: 1 },
  { min: 20, max: 34, weight: 1 },
];

const COMPANION_DELTAS = [18, 24, 30, 36, 42, 48, 54] as const;
const USAGE_DELTAS = [82, 96, 110, 124, 138, 152] as const;
const HIGHLIGHT_DELTAS = [72, 96, 120, 144, 168] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHueFromBands(bands: readonly WeightedHueBand[]): number {
  const totalWeight = bands.reduce((sum, band) => sum + band.weight, 0);
  let cursor = randomInt(1, totalWeight);

  for (const band of bands) {
    cursor -= band.weight;
    if (cursor <= 0) {
      return randomInt(band.min, band.max);
    }
  }

  const fallbackBand = bands[bands.length - 1];
  return randomInt(fallbackBand.min, fallbackBand.max);
}

function rotateHue(hue: number, delta: number): number {
  const next = (hue + delta) % 360;
  return next < 0 ? next + 360 : next;
}

function isPinkHue(hue: number): boolean {
  return hue >= 300 || hue <= 16;
}

function randomRelatedHue(baseHue: number, deltas: readonly number[]): number {
  for (let attempt = 0; attempt < deltas.length * 3; attempt += 1) {
    const delta = deltas[randomInt(0, deltas.length - 1)] * (Math.random() > 0.5 ? 1 : -1);
    const candidate = rotateHue(baseHue, delta);
    if (!isPinkHue(candidate)) {
      return candidate;
    }
  }

  for (const delta of deltas) {
    const candidate = rotateHue(baseHue, delta);
    if (!isPinkHue(candidate)) {
      return candidate;
    }
  }

  return 212;
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const convert = (t: number) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  return {
    r: Math.round(convert(h + 1 / 3) * 255),
    g: Math.round(convert(h) * 255),
    b: Math.round(convert(h - 1 / 3) * 255),
  };
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const { r, g, b } = hslToRgb(hue, saturation, lightness);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToAlpha(hue: number, saturation: number, lightness: number, alpha: number): string {
  const { r, g, b } = hslToRgb(hue, saturation, lightness);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

function contrastRatio(first: string, second: string): number {
  const toLuminance = (hex: string) => {
    const normalized = hex.replace("#", "");
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    const toLinear = (channel: number) => {
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const lighter = Math.max(toLuminance(first), toLuminance(second));
  const darker = Math.min(toLuminance(first), toLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function evaluateAccentForeground(primary: string, secondary: string) {
  const lightScore = Math.min(
    contrastRatio(ACCENT_FOREGROUND_LIGHT, primary),
    contrastRatio(ACCENT_FOREGROUND_LIGHT, secondary),
  );
  const darkScore = Math.min(
    contrastRatio(ACCENT_FOREGROUND_DARK, primary),
    contrastRatio(ACCENT_FOREGROUND_DARK, secondary),
  );

  if (lightScore >= darkScore) {
    return {
      foreground: ACCENT_FOREGROUND_LIGHT,
      score: lightScore,
    };
  }

  return {
    foreground: ACCENT_FOREGROUND_DARK,
    score: darkScore,
  };
}

function buildAccentPair(baseTheme: ResolvedTheme, accentHue: number, accentSecondaryHue: number) {
  let bestPair:
    | {
        primary: string;
        secondary: string;
        foreground: string;
        score: number;
      }
    | null = null;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const primary =
      baseTheme === "light"
        ? hslToHex(accentHue, randomInt(60, 84), randomInt(34, 46))
        : hslToHex(accentHue, randomInt(58, 82), randomInt(58, 72));

    const secondary =
      baseTheme === "light"
        ? hslToHex(accentSecondaryHue, randomInt(56, 80), randomInt(34, 48))
        : hslToHex(accentSecondaryHue, randomInt(54, 78), randomInt(56, 70));

    const { foreground, score } = evaluateAccentForeground(primary, secondary);

    if (!bestPair || score > bestPair.score) {
      bestPair = {
        primary,
        secondary,
        foreground,
        score,
      };
    }

    if (score >= CTA_MIN_CONTRAST) {
      return {
        primary,
        secondary,
        foreground,
      };
    }
  }

  if (bestPair && bestPair.score >= CTA_MIN_CONTRAST) {
    return {
      primary: bestPair.primary,
      secondary: bestPair.secondary,
      foreground: bestPair.foreground,
    };
  }

  if (baseTheme === "light") {
    return {
      primary: "#1f52c3",
      secondary: "#1a7cae",
      foreground: ACCENT_FOREGROUND_LIGHT,
    };
  }

  return {
    primary: "#7ea9ff",
    secondary: "#5be2ff",
    foreground: ACCENT_FOREGROUND_DARK,
  };
}

export function readStoredRandomTheme(): RandomThemePalette | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  const raw = window.localStorage.getItem(RANDOM_THEME_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RandomThemePalette>;
    if (parsed.baseTheme !== "light" && parsed.baseTheme !== "dark") {
      return null;
    }

    if (!parsed.tokens || typeof parsed.tokens !== "object") {
      return null;
    }

    const tokens = {} as RandomTokenMap;
    for (const key of RANDOM_TOKEN_KEYS) {
      const value = (parsed.tokens as Record<string, unknown>)[key];
      if (typeof value !== "string") {
        return null;
      }
      tokens[key] = value;
    }

    return { baseTheme: parsed.baseTheme, tokens };
  } catch {
    return null;
  }
}

export function buildRandomTheme(): RandomThemePalette {
  const baseTheme: ResolvedTheme = Math.random() > 0.5 ? "light" : "dark";
  const surfaceHue = randomHueFromBands(PREMIUM_SURFACE_HUE_BANDS);
  const accentHue = randomHueFromBands(PREMIUM_ACCENT_HUE_BANDS);
  const accentSecondaryHue = randomRelatedHue(accentHue, COMPANION_DELTAS);
  const usageHue = randomRelatedHue(accentHue, USAGE_DELTAS);
  const accentHighlightHue = randomRelatedHue(accentHue, HIGHLIGHT_DELTAS);
  const accentPair = buildAccentPair(baseTheme, accentHue, accentSecondaryHue);

  if (baseTheme === "light") {
    const bgSurface = hslToHex(surfaceHue, randomInt(24, 42), randomInt(97, 99));
    let textPrimary = hslToHex(rotateHue(surfaceHue, 210), randomInt(20, 34), randomInt(11, 16));
    let textSecondary = hslToHex(rotateHue(surfaceHue, 210), randomInt(18, 30), randomInt(30, 36));
    let textMuted = hslToHex(rotateHue(surfaceHue, 210), randomInt(14, 24), randomInt(44, 52));

    if (contrastRatio(textPrimary, bgSurface) < 8) textPrimary = "#111d30";
    if (contrastRatio(textSecondary, bgSurface) < 4.5) textSecondary = "#344a68";
    if (contrastRatio(textMuted, bgSurface) < 3) textMuted = "#677f9f";

    return {
      baseTheme,
      tokens: {
        "--bg-canvas": hslToHex(surfaceHue, randomInt(24, 42), randomInt(93, 96)),
        "--bg-canvas-muted": hslToHex(surfaceHue, randomInt(20, 36), randomInt(89, 93)),
        "--bg-surface": bgSurface,
        "--bg-surface-elevated": hslToHex(surfaceHue, randomInt(20, 34), randomInt(94, 97)),
        "--bg-surface-strong": hslToHex(surfaceHue, randomInt(16, 30), randomInt(90, 94)),
        "--text-primary": textPrimary,
        "--text-secondary": textSecondary,
        "--text-muted": textMuted,
        "--border-soft": hslToHex(surfaceHue, randomInt(18, 26), randomInt(80, 87)),
        "--border-strong": hslToHex(surfaceHue, randomInt(20, 32), randomInt(66, 74)),
        "--accent-primary": accentPair.primary,
        "--accent-secondary": accentPair.secondary,
        "--accent-foreground": accentPair.foreground,
        "--accent-soft": hslToHex(accentHue, randomInt(52, 70), randomInt(86, 92)),
        "--accent-border": hslToHex(accentHue, randomInt(52, 72), randomInt(66, 76)),
        "--accent-highlight": hslToHex(accentHighlightHue, randomInt(56, 80), randomInt(48, 62)),
        "--usage-5h": hslToHex(rotateHue(accentHue, 8), randomInt(70, 88), randomInt(42, 54)),
        "--usage-5h-soft": hslToHex(rotateHue(accentHue, 8), randomInt(40, 62), randomInt(87, 94)),
        "--usage-7d": hslToHex(usageHue, randomInt(58, 84), randomInt(36, 50)),
        "--usage-7d-soft": hslToHex(usageHue, randomInt(34, 52), randomInt(86, 94)),
        "--focus-ring": `0 0 0 3px ${hslToAlpha(accentHue, 72, 44, 0.3)}`,
        "--mesh-primary": hslToAlpha(accentHue, 84, 54, 0.22),
        "--mesh-secondary": hslToAlpha(accentSecondaryHue, 86, 56, 0.2),
        "--mesh-tertiary": hslToAlpha(usageHue, 80, 48, 0.14),
        "--panel-edge": "rgb(255 255 255 / 0.72)",
        "--grain-strength": `${randomInt(34, 52) / 1000}`,
      },
    };
  }

  const bgSurface = hslToHex(surfaceHue, randomInt(22, 38), randomInt(13, 18));
  let textPrimary = hslToHex(rotateHue(surfaceHue, 170), randomInt(18, 32), randomInt(90, 95));
  let textSecondary = hslToHex(rotateHue(surfaceHue, 170), randomInt(18, 30), randomInt(74, 82));
  let textMuted = hslToHex(rotateHue(surfaceHue, 170), randomInt(14, 24), randomInt(62, 72));

  if (contrastRatio(textPrimary, bgSurface) < 8) textPrimary = "#e9f1ff";
  if (contrastRatio(textSecondary, bgSurface) < 4.5) textSecondary = "#b7c8e3";
  if (contrastRatio(textMuted, bgSurface) < 3) textMuted = "#8aa1c2";

  return {
    baseTheme,
    tokens: {
      "--bg-canvas": hslToHex(surfaceHue, randomInt(24, 40), randomInt(7, 10)),
      "--bg-canvas-muted": hslToHex(surfaceHue, randomInt(24, 40), randomInt(10, 15)),
      "--bg-surface": bgSurface,
      "--bg-surface-elevated": hslToHex(surfaceHue, randomInt(24, 40), randomInt(15, 22)),
      "--bg-surface-strong": hslToHex(surfaceHue, randomInt(26, 44), randomInt(20, 30)),
      "--text-primary": textPrimary,
      "--text-secondary": textSecondary,
      "--text-muted": textMuted,
      "--border-soft": hslToHex(surfaceHue, randomInt(22, 36), randomInt(26, 36)),
      "--border-strong": hslToHex(surfaceHue, randomInt(24, 40), randomInt(40, 52)),
      "--accent-primary": accentPair.primary,
      "--accent-secondary": accentPair.secondary,
      "--accent-foreground": accentPair.foreground,
      "--accent-soft": hslToHex(accentHue, randomInt(40, 62), randomInt(20, 34)),
      "--accent-border": hslToHex(accentHue, randomInt(40, 62), randomInt(46, 60)),
      "--accent-highlight": hslToHex(accentHighlightHue, randomInt(56, 80), randomInt(64, 76)),
      "--usage-5h": hslToHex(rotateHue(accentHue, 8), randomInt(72, 90), randomInt(68, 80)),
      "--usage-5h-soft": hslToHex(rotateHue(accentHue, 8), randomInt(40, 64), randomInt(22, 34)),
      "--usage-7d": hslToHex(usageHue, randomInt(56, 84), randomInt(62, 76)),
      "--usage-7d-soft": hslToHex(usageHue, randomInt(34, 54), randomInt(20, 32)),
      "--focus-ring": `0 0 0 3px ${hslToAlpha(accentHue, 78, 72, 0.35)}`,
      "--mesh-primary": hslToAlpha(accentHue, 90, 70, 0.18),
      "--mesh-secondary": hslToAlpha(accentSecondaryHue, 90, 72, 0.14),
      "--mesh-tertiary": hslToAlpha(usageHue, 82, 68, 0.1),
      "--panel-edge": "rgb(197 220 255 / 0.2)",
      "--grain-strength": `${randomInt(42, 65) / 1000}`,
    },
  };
}

export function clearRandomThemeOverrides() {
  if (typeof document === "undefined") {
    return;
  }

  for (const key of RANDOM_TOKEN_KEYS) {
    document.documentElement.style.removeProperty(key);
  }
}

export function applyRandomTheme(theme: RandomThemePalette) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme.baseTheme);
  document.documentElement.style.colorScheme = theme.baseTheme;
  for (const key of RANDOM_TOKEN_KEYS) {
    document.documentElement.style.setProperty(key, theme.tokens[key]);
  }
}
