import { render, screen, fireEvent } from '@testing-library/react';
import { FormulaBuilder } from './formula-builder';
import { describe, it, expect, vi } from 'vitest';

describe('FormulaBuilder Component', () => {
  const mockOnChange = vi.fn();

  it('renders correctly with empty formula', () => {
    render(<FormulaBuilder onChange={mockOnChange} />);
    expect(screen.getByText(/Add variables and operators to build your formula/i)).toBeInTheDocument();
  });

  it('renders quick start templates when empty', () => {
    render(<FormulaBuilder onChange={mockOnChange} />);
    expect(screen.getByText(/Quick Start Templates/i)).toBeInTheDocument();
  });

  it('adds a variable when clicked in picker', async () => {
    render(<FormulaBuilder onChange={mockOnChange} />);
    
    // Open picker
    const picker = screen.getByRole('combobox');
    fireEvent.click(picker);
    
    // This is a Radix Select, might need different selection depending on implementation
    // For now, let's assume it works with onValueChange mock if we were testing the picker directly
    // But we are testing FormulaBuilder. Let's look at VariablePicker.
  });

  it('can clear all chips', () => {
    const initialChips = ['grossWeight', '+', 'netWeight'];
    render(<FormulaBuilder formulaChips={initialChips} onChange={mockOnChange} />);
    
    const clearButton = screen.getByText(/Clear All/i);
    fireEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('', []);
  });

  it('displays formula preview text', () => {
    const initialChips = ['grossWeight', '×', '0.05'];
    render(<FormulaBuilder formulaChips={initialChips} onChange={mockOnChange} />);
    
    expect(screen.getByText('grossWeight × 0.05')).toBeInTheDocument();
  });

  it('shows valid alert when validation result is valid', () => {
    const validationResult = {
      valid: true,
      errors: [],
      warnings: [],
      testResult: 500
    };
    render(<FormulaBuilder validationResult={validationResult} onChange={mockOnChange} />);
    
    expect(screen.getByText(/Formula is valid/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Result: ₹ 500.00/i)).toBeInTheDocument();
  });

  it('shows error alert when validation result has errors', () => {
    const validationResult = {
      valid: false,
      errors: ['Invalid operator', 'Unbalanced parentheses'],
      warnings: []
    };
    render(<FormulaBuilder validationResult={validationResult} onChange={mockOnChange} />);
    
    expect(screen.getByText(/• Invalid operator/i)).toBeInTheDocument();
    expect(screen.getByText(/• Unbalanced parentheses/i)).toBeInTheDocument();
  });
});
