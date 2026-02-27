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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rotateHue(hue: number, delta: number): number {
  const next = (hue + delta) % 360;
  return next < 0 ? next + 360 : next;
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
  const surfaceHue = randomInt(0, 359);
  const accentHue = randomInt(0, 359);
  const accentSecondaryHue = rotateHue(accentHue, randomInt(22, 68) * (Math.random() > 0.5 ? 1 : -1));
  const usageHue = rotateHue(accentHue, randomInt(90, 145));

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
        "--accent-primary": hslToHex(accentHue, randomInt(68, 90), randomInt(40, 50)),
        "--accent-secondary": hslToHex(accentSecondaryHue, randomInt(66, 92), randomInt(42, 56)),
        "--accent-soft": hslToHex(accentHue, randomInt(52, 70), randomInt(86, 92)),
        "--accent-border": hslToHex(accentHue, randomInt(52, 72), randomInt(66, 76)),
        "--accent-highlight": hslToHex(rotateHue(accentHue, 120), randomInt(56, 80), randomInt(48, 62)),
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
      "--accent-primary": hslToHex(accentHue, randomInt(68, 90), randomInt(66, 78)),
      "--accent-secondary": hslToHex(accentSecondaryHue, randomInt(70, 94), randomInt(64, 80)),
      "--accent-soft": hslToHex(accentHue, randomInt(40, 62), randomInt(20, 34)),
      "--accent-border": hslToHex(accentHue, randomInt(40, 62), randomInt(46, 60)),
      "--accent-highlight": hslToHex(rotateHue(accentHue, 120), randomInt(56, 80), randomInt(64, 76)),
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
