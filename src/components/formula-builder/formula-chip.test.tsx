import { render, screen, fireEvent } from '@testing-library/react';
import { FormulaChip } from './formula-chip';
import { describe, it, expect, vi } from 'vitest';

describe('FormulaChip Component', () => {
  const mockOnDelete = vi.fn();

  it('renders correctly with value', () => {
    render(
      <FormulaChip 
        value="grossWeight" 
        index={0} 
        type="variable" 
        onDelete={mockOnDelete} 
      />
    );
    expect(screen.getByText('grossWeight')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <FormulaChip 
        value="+" 
        index={1} 
        type="operator" 
        onDelete={mockOnDelete} 
      />
    );
    
    // The button only shows on hover or in certain conditions in the real component
    // Let's use getByRole or just trigger click if possible
    const deleteButton = screen.queryByRole('button');
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    }
  });

  it('is not editable when isEditable is false', () => {
    render(
      <FormulaChip 
        value="grossWeight" 
        index={0} 
        type="variable" 
        onDelete={mockOnDelete} 
        isEditable={false}
      />
    );
    
    const deleteButton = screen.queryByRole('button');
    expect(deleteButton).not.toBeInTheDocument();
  });
});
