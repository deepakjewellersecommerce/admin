import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VariablePicker } from "./variable-picker";

describe("VariablePicker", () => {
  it("renders the trigger button", () => {
    const onSelectVariable = vi.fn();
    render(
      <VariablePicker onSelectVariable={onSelectVariable} />
    );

    expect(screen.getByText("Add Variable")).toBeInTheDocument();
  });
});
