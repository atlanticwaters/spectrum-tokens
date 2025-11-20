import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders success toast', () => {
      render(<Toast message="Success message" type="success" onClose={mockOnClose} />);
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('\u2713')).toBeInTheDocument(); // ✓
    });

    it('renders error toast', () => {
      render(<Toast message="Error message" type="error" onClose={mockOnClose} />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('\u2716')).toBeInTheDocument(); // ✖
    });

    it('renders warning toast', () => {
      render(<Toast message="Warning message" type="warning" onClose={mockOnClose} />);
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('\u26A0')).toBeInTheDocument(); // ⚠
    });

    it('renders info toast', () => {
      render(<Toast message="Info message" type="info" onClose={mockOnClose} />);
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('\u2139')).toBeInTheDocument(); // ℹ
    });

    it('renders close button', () => {
      render(<Toast message="Test message" type="info" onClose={mockOnClose} />);
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });
  });

  describe('auto-dismiss behavior', () => {
    it('auto-dismisses after default duration', () => {
      render(<Toast message="Test" type="info" onClose={mockOnClose} />);

      expect(mockOnClose).not.toHaveBeenCalled();

      jest.advanceTimersByTime(3000);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('auto-dismisses after custom duration', () => {
      render(<Toast message="Test" type="info" duration={5000} onClose={mockOnClose} />);

      jest.advanceTimersByTime(3000);
      expect(mockOnClose).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not auto-dismiss if closed manually first', () => {
      render(<Toast message="Test" type="info" onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(3000);

      // Should still only be called once (from manual close)
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('manual dismiss', () => {
    it('calls onClose when close button is clicked', () => {
      render(<Toast message="Test" type="info" onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has alert role', () => {
      render(<Toast message="Test" type="info" onClose={mockOnClose} />);
      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<Toast message="Test" type="info" onClose={mockOnClose} />);
      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('close button has accessible label', () => {
      render(<Toast message="Test" type="info" onClose={mockOnClose} />);
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });
  });

  describe('visual styling', () => {
    it('applies success color', () => {
      const { container } = render(<Toast message="Test" type="success" onClose={mockOnClose} />);
      const toast = container.firstChild as HTMLElement;
      expect(toast.style.backgroundColor).toBe('#4caf50');
    });

    it('applies error color', () => {
      const { container } = render(<Toast message="Test" type="error" onClose={mockOnClose} />);
      const toast = container.firstChild as HTMLElement;
      expect(toast.style.backgroundColor).toBe('#f44336');
    });

    it('applies warning color', () => {
      const { container } = render(<Toast message="Test" type="warning" onClose={mockOnClose} />);
      const toast = container.firstChild as HTMLElement;
      expect(toast.style.backgroundColor).toBe('#ff9800');
    });

    it('applies info color', () => {
      const { container } = render(<Toast message="Test" type="info" onClose={mockOnClose} />);
      const toast = container.firstChild as HTMLElement;
      expect(toast.style.backgroundColor).toBe('#2196f3');
    });
  });

  describe('cleanup', () => {
    it('cleans up timer on unmount', () => {
      const { unmount } = render(<Toast message="Test" type="info" onClose={mockOnClose} />);

      unmount();

      jest.advanceTimersByTime(3000);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('handles duration change', () => {
      const { rerender } = render(<Toast message="Test" type="info" duration={3000} onClose={mockOnClose} />);

      jest.advanceTimersByTime(1000);

      rerender(<Toast message="Test" type="info" duration={5000} onClose={mockOnClose} />);

      jest.advanceTimersByTime(4000);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
