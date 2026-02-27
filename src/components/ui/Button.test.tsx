import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { IconButton } from "./IconButton";

it("renders icon button with accessible name", () => {
  render(<IconButton aria-label="Refresh Usage">R</IconButton>);

  expect(
    screen.getByRole("button", { name: "Refresh Usage" })
  ).toBeInTheDocument();
});
