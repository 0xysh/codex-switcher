import { expect, it } from "vitest";

import {
  formatThemePaletteCss,
  readThemePaletteSnapshot,
} from "../themePaletteSnapshot";

it("reads active theme token values from document root", () => {
  document.documentElement.style.setProperty("--accent-primary", "#123456");
  document.documentElement.style.setProperty("--accent-secondary", "#abcdef");

  const snapshot = readThemePaletteSnapshot();

  expect(snapshot.find((item) => item.token === "--accent-primary")?.value).toBe("#123456");
  expect(snapshot.find((item) => item.token === "--accent-secondary")?.value).toBe("#abcdef");
});

it("formats palette snapshot as CSS variable block", () => {
  const css = formatThemePaletteCss([
    { token: "--accent-primary", value: "#123456" },
    { token: "--accent-secondary", value: "#abcdef" },
  ]);

  expect(css).toContain(":root {");
  expect(css).toContain("--accent-primary: #123456;");
  expect(css).toContain("--accent-secondary: #abcdef;");
});
