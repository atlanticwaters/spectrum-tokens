import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindReplace, performReplace } from './FindReplace';

describe('FindReplace', () => {
  const mockTokens = [
    { name: 'primary-color', value: '#FF0000', type: 'color' },
    { name: 'secondary-color', value: '#00FF00', type: 'color' },
    { name: 'Primary-Button-BG', value: '#FF0000', type: 'color' },
    { name: 'spacing-sm', value: '8', type: 'spacing' },
    { name: 'spacing-md', value: '16', type: 'spacing' },
    { name: 'font-size-lg', value: '18px', type: 'dimension' },
  ];

  const mockOnClose = jest.fn();
  const mockOnReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders when open', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );
      expect(screen.getByText('Find & Replace Tokens')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <FindReplace
          isOpen={false}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );
      expect(screen.queryByText('Find & Replace Tokens')).not.toBeInTheDocument();
    });

    it('renders all form controls', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      expect(screen.getByPlaceholderText('Search text or pattern')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Replacement text')).toBeInTheDocument();
      expect(screen.getByLabelText('Case sensitive')).toBeInTheDocument();
      expect(screen.getByLabelText('Match whole word')).toBeInTheDocument();
      expect(screen.getByLabelText('Use regular expressions')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Token names only')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      expect(screen.getByText('Preview Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText(/Replace All/)).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('allows input in find field', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern') as HTMLInputElement;
      fireEvent.change(findInput, { target: { value: 'primary' } });
      expect(findInput).toHaveValue('primary');
    });

    it('allows input in replace field', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const replaceInput = screen.getByPlaceholderText('Replacement text') as HTMLInputElement;
      fireEvent.change(replaceInput, { target: { value: 'main' } });
      expect(replaceInput).toHaveValue('main');
    });

    it('toggles case sensitive option', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const checkbox = screen.getByLabelText('Case sensitive');
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('toggles whole word option', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const checkbox = screen.getByLabelText('Match whole word');
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('toggles regex option', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const checkbox = screen.getByLabelText('Use regular expressions');
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('changes scope option', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const scopeSelect = screen.getByDisplayValue('Token names only') as HTMLSelectElement;
      expect(scopeSelect).toHaveValue('names');

      fireEvent.change(scopeSelect, { target: { value: 'values' } });
      expect(scopeSelect).toHaveValue('values');

      fireEvent.change(scopeSelect, { target: { value: 'both' } });
      expect(scopeSelect).toHaveValue('both');
    });
  });

  describe('Preview Functionality', () => {
    it('shows preview when clicked', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern') as HTMLInputElement;
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'primary' } });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/match\(es\) found/, { exact: false })).toBeInTheDocument();
      });
    });

    it('handles case-insensitive preview', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'primary' } });
      fireEvent.change(replaceInput, { target: { value: 'main' } });
      await userEvent.click(previewButton);

      // Should match "primary-color" and "Primary-Button-BG" (case-insensitive by default)
      await waitFor(() => {
        expect(screen.getByText(/2 match\(es\) found/)).toBeInTheDocument();
      });
    });

    it('handles case-sensitive preview', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const caseSensitive = screen.getByLabelText('Case sensitive');
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'primary' } });
      fireEvent.change(replaceInput, { target: { value: 'main' } });
      await userEvent.click(caseSensitive);
      await userEvent.click(previewButton);

      // Should only match "primary-color" (case-sensitive)
      await waitFor(() => {
        expect(screen.getByText(/1 match\(es\) found/)).toBeInTheDocument();
      });
    });

    it('shows error when find field is empty', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const previewButton = screen.getByText('Preview Changes');
      await userEvent.click(previewButton);

      expect(screen.getByText('Find text cannot be empty')).toBeInTheDocument();
    });

    it('shows preview with replacement changes', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'color' } });
      fireEvent.change(replaceInput, { target: { value: 'colour' } });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('primary-color')).toBeInTheDocument();
        expect(screen.getByText('primary-colour')).toBeInTheDocument();
      });
    });

    it('handles scope=values preview', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const scopeSelect = screen.getByDisplayValue('Token names only') as HTMLSelectElement;
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(scopeSelect, { target: { value: 'values' } });
      fireEvent.change(findInput, { target: { value: '#FF0000' } });
      fireEvent.change(replaceInput, { target: { value: '#0000FF' } });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/2 match\(es\) found/)).toBeInTheDocument();
      });
    });

    it('shows no matches when pattern not found', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'nonexistent' } });
      await userEvent.click(previewButton);

      // No preview section should appear when there are no matches
      await waitFor(() => {
        expect(screen.queryByText(/match\(es\) found/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Replace Functionality', () => {
    it('calls onReplace with correct parameters', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'color' } });
      fireEvent.change(replaceInput, { target: { value: 'colour' } });
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/match\(es\) found/)).toBeInTheDocument();
      });

      const replaceButton = screen.getByText(/Replace All/);
      await userEvent.click(replaceButton);

      expect(mockOnReplace).toHaveBeenCalledWith(
        'color',
        'colour',
        expect.objectContaining({
          caseSensitive: false,
          wholeWord: false,
          regex: false,
          scope: 'names',
        })
      );
    });

    it('calls onReplace with case-sensitive option', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const caseSensitive = screen.getByLabelText('Case sensitive');
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'primary' } });
      fireEvent.change(replaceInput, { target: { value: 'main' } });
      await userEvent.click(caseSensitive);
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/match\(es\) found/)).toBeInTheDocument();
      });

      const replaceButton = screen.getByText(/Replace All/);
      await userEvent.click(replaceButton);

      expect(mockOnReplace).toHaveBeenCalledWith(
        'primary',
        'main',
        expect.objectContaining({
          caseSensitive: true,
        })
      );
    });

    it('disables replace button when no preview', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const replaceButton = screen.getByText(/Replace All/);
      expect(replaceButton).toBeDisabled();
    });

    it('shows error when trying to replace without preview', () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      fireEvent.change(findInput, { target: { value: 'color' } });

      // Try to click replace without preview - button should be disabled
      const replaceButton = screen.getByText(/Replace All/);
      expect(replaceButton).toBeDisabled();
    });
  });

  describe('Close and Cancel', () => {
    it('calls onClose when cancel is clicked', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets state when closed', async () => {
      const { rerender } = render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const caseSensitive = screen.getByLabelText('Case sensitive');

      await userEvent.type(findInput, 'test');
      await userEvent.type(replaceInput, 'new');
      await userEvent.click(caseSensitive);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Reopen and check state is reset
      rerender(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const newFindInput = screen.getByPlaceholderText('Search text or pattern');
      const newReplaceInput = screen.getByPlaceholderText('Replacement text');
      const newCaseSensitive = screen.getByLabelText('Case sensitive');

      expect(newFindInput).toHaveValue('');
      expect(newReplaceInput).toHaveValue('');
      expect(newCaseSensitive).not.toBeChecked();
    });
  });

  describe('Regex Support', () => {
    it('handles valid regex pattern', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern');
      const replaceInput = screen.getByPlaceholderText('Replacement text');
      const useRegex = screen.getByLabelText('Use regular expressions');
      const previewButton = screen.getByText('Preview Changes');

      fireEvent.change(findInput, { target: { value: 'spacing-.*' } });
      fireEvent.change(replaceInput, { target: { value: 'gap-$1' } });
      await userEvent.click(useRegex);
      await userEvent.click(previewButton);

      await waitFor(() => {
        // Should match spacing-sm and spacing-md
        expect(screen.getByText(/2 match\(es\) found/)).toBeInTheDocument();
      });
    });

    it('shows error for invalid regex', async () => {
      render(
        <FindReplace
          isOpen={true}
          onClose={mockOnClose}
          onReplace={mockOnReplace}
          tokens={mockTokens}
        />
      );

      const findInput = screen.getByPlaceholderText('Search text or pattern') as HTMLInputElement;
      const useRegex = screen.getByLabelText('Use regular expressions');
      const previewButton = screen.getByText('Preview Changes');

      // Use fireEvent.change instead of userEvent.type for special characters
      fireEvent.change(findInput, { target: { value: '[invalid(regex' } });
      await userEvent.click(useRegex);
      await userEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid regular expression/)).toBeInTheDocument();
      });
    });
  });
});

describe('performReplace utility function', () => {
  it('performs basic case-insensitive replace', () => {
    const result = performReplace('primary-color', 'color', 'colour', {
      caseSensitive: false,
      wholeWord: false,
      regex: false,
    });
    expect(result).toBe('primary-colour');
  });

  it('performs case-sensitive replace', () => {
    const result = performReplace('Primary-color', 'Primary', 'Main', {
      caseSensitive: true,
      wholeWord: false,
      regex: false,
    });
    expect(result).toBe('Main-color');
  });

  it('does not replace when case does not match (case-sensitive)', () => {
    const result = performReplace('primary-color', 'PRIMARY', 'MAIN', {
      caseSensitive: true,
      wholeWord: false,
      regex: false,
    });
    expect(result).toBe('primary-color');
  });

  it('performs whole word replace', () => {
    const result = performReplace('color-primary-color', 'color', 'hue', {
      caseSensitive: false,
      wholeWord: true,
      regex: false,
    });
    expect(result).toBe('hue-primary-hue');
  });

  it('performs regex replace', () => {
    const result = performReplace('spacing-sm-8', '\\d+', '16', {
      caseSensitive: false,
      wholeWord: false,
      regex: true,
    });
    expect(result).toBe('spacing-sm-16');
  });

  it('throws error for invalid regex', () => {
    expect(() => {
      performReplace('test', '[invalid', 'new', {
        caseSensitive: false,
        wholeWord: false,
        regex: true,
      });
    }).toThrow(/Invalid regular expression/);
  });

  it('handles empty replacement', () => {
    const result = performReplace('primary-color', 'primary-', '', {
      caseSensitive: false,
      wholeWord: false,
      regex: false,
    });
    expect(result).toBe('color');
  });

  it('handles multiple occurrences', () => {
    const result = performReplace('color-color-color', 'color', 'hue', {
      caseSensitive: false,
      wholeWord: false,
      regex: false,
    });
    expect(result).toBe('hue-hue-hue');
  });
});
