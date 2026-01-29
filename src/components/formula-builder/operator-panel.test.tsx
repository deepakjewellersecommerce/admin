import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OperatorPanel } from "./operator-panel";

describe("OperatorPanel", () => {
  it("renders all operator buttons", () => {
    const onAddOperator = vi.fn();
    render(<OperatorPanel onAddOperator={onAddOperator} />);

    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getByText("×")).toBeInTheDocument();
    expect(screen.getByText("÷")).toBeInTheDocument();
    expect(screen.getByText("(")).toBeInTheDocument();
    expect(screen.getByText(")")).toBeInTheDocument();
  });

  it("calls onAddOperator when an operator is clicked", () => {
    const onAddOperator = vi.fn();
    render(<OperatorPanel onAddOperator={onAddOperator} />);

    fireEvent.click(screen.getByText("+"));
    expect(onAddOperator).toHaveBeenCalledWith("+");

    fireEvent.click(screen.getByText("÷"));
    expect(onAddOperator).toHaveBeenCalledWith("÷");
  });
});
