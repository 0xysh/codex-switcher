import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { AddAccountModal } from "../AddAccountModal";

it("has accessible close button and labeled account name input", () => {
  render(
    <AddAccountModal
      isOpen
      onClose={vi.fn()}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://example.com" }))}
      onCompleteOAuth={vi.fn(async () => ({}))}
      onCancelOAuth={vi.fn(async () => {})}
    />
  );

  expect(
    screen.getByRole("button", { name: /close add account modal/i })
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/account name/i)).toHaveAttribute(
    "name",
    "accountName"
  );
});
