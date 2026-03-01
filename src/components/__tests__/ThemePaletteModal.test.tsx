import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { ThemePaletteModal } from "../ThemePaletteModal";

beforeEach(() => {
  document.documentElement.style.setProperty("--accent-primary", "#123456");
  document.documentElement.style.setProperty("--accent-secondary", "#abcdef");
});

it("renders theme palette modal with active token values", () => {
  render(<ThemePaletteModal isOpen onClose={vi.fn()} />);

  expect(
    screen.getByRole("dialog", { name: /current theme palette/i })
  ).toBeInTheDocument();
  expect(screen.getByText("--accent-primary")).toBeInTheDocument();
  expect(screen.getByText("#123456")).toBeInTheDocument();
});

it("copies palette css text and announces success", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn(async () => undefined);

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  render(<ThemePaletteModal isOpen onClose={vi.fn()} />);

  document.documentElement.style.setProperty("--accent-primary", "#654321");

  await user.click(screen.getByRole("button", { name: /copy palette/i }));

  expect(writeText).toHaveBeenCalledWith(
    expect.stringContaining("--accent-primary: #654321;")
  );
  expect(
    screen.getByRole("status", { name: /theme palette status/i })
  ).toHaveTextContent(/palette copied/i);
});
