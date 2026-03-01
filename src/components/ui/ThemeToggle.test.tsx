import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { ThemeToggle } from "./ThemeToggle";

it("opens random palette details without changing selected theme", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const onRandomInfoClick = vi.fn();

  render(
    <ThemeToggle
      value="light"
      onChange={onChange}
      onRandomInfoClick={onRandomInfoClick}
    />,
  );

  await user.click(
    screen.getByRole("button", { name: /show random palette details/i }),
  );

  expect(onRandomInfoClick).toHaveBeenCalledTimes(1);
  expect(onChange).not.toHaveBeenCalled();
});

it("ignores theme arrow navigation when info button is focused", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  render(
    <ThemeToggle
      value="light"
      onChange={onChange}
      onRandomInfoClick={vi.fn()}
    />,
  );

  const infoButton = screen.getByRole("button", {
    name: /show random palette details/i,
  });
  infoButton.focus();

  await user.keyboard("{ArrowRight}");

  expect(onChange).not.toHaveBeenCalled();
});

it("keeps keyboard arrows working on focused theme radio options", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  render(
    <ThemeToggle
      value="light"
      onChange={onChange}
      onRandomInfoClick={vi.fn()}
    />,
  );

  const lightOption = screen.getByRole("radio", { name: /light/i });
  lightOption.focus();

  await user.keyboard("{ArrowRight}");

  expect(onChange).toHaveBeenCalledWith("dark");
});
