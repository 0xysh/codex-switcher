export interface ThemePaletteEntry {
  token: string;
  value: string;
}

export const THEME_PALETTE_TOKENS = [
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
  "--success",
  "--success-soft",
  "--success-border",
  "--warning",
  "--warning-soft",
  "--warning-border",
  "--danger",
  "--danger-soft",
  "--danger-border",
  "--usage-5h",
  "--usage-5h-soft",
  "--usage-7d",
  "--usage-7d-soft",
  "--mesh-primary",
  "--mesh-secondary",
  "--mesh-tertiary",
  "--panel-edge",
] as const;

function normalizeTokenValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function readThemePaletteSnapshot(): ThemePaletteEntry[] {
  if (typeof document === "undefined") {
    return [];
  }

  const styles = getComputedStyle(document.documentElement);

  return THEME_PALETTE_TOKENS.map((token) => {
    const rawValue = styles.getPropertyValue(token);
    const normalizedValue = normalizeTokenValue(rawValue);

    return {
      token,
      value: normalizedValue || "not-set",
    };
  });
}

export function formatThemePaletteCss(snapshot: ThemePaletteEntry[]): string {
  return [
    ":root {",
    ...snapshot.map(({ token, value }) => `  ${token}: ${value};`),
    "}",
  ].join("\n");
}
