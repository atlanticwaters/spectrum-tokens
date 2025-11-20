import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  describe('rendering', () => {
    it('renders when isLoading is true', () => {
      render(<LoadingOverlay isLoading={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isLoading is false', () => {
      const { container } = render(<LoadingOverlay isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders with default message', () => {
      render(<LoadingOverlay isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<LoadingOverlay isLoading={true} message="Processing tokens..." />);
      expect(screen.getByText('Processing tokens...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(<LoadingOverlay isLoading={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<LoadingOverlay isLoading={true} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to message', () => {
      render(<LoadingOverlay isLoading={true} message="Custom message" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'loading-message');

      const message = screen.getByText('Custom message');
      expect(message).toHaveAttribute('id', 'loading-message');
    });
  });

  describe('layout', () => {
    it('uses fixed positioning', () => {
      const { container } = render(<LoadingOverlay isLoading={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.style.position).toBe('fixed');
    });

    it('covers entire viewport', () => {
      const { container } = render(<LoadingOverlay isLoading={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.style.top).toBe('0');
      expect(overlay.style.left).toBe('0');
      expect(overlay.style.right).toBe('0');
      expect(overlay.style.bottom).toBe('0');
    });

    it('centers content', () => {
      const { container } = render(<LoadingOverlay isLoading={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.style.display).toBe('flex');
      expect(overlay.style.alignItems).toBe('center');
      expect(overlay.style.justifyContent).toBe('center');
    });

    it('has high z-index', () => {
      const { container } = render(<LoadingOverlay isLoading={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.style.zIndex).toBe('10000');
    });
  });

  describe('styling', () => {
    it('has semi-transparent background', () => {
      const { container } = render(<LoadingOverlay isLoading={true} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay.style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('content box has white background', () => {
      const { container } = render(<LoadingOverlay isLoading={true} />);
      const overlay = container.firstChild as HTMLElement;
      const contentBox = overlay.firstChild as HTMLElement;
      expect(contentBox.style.backgroundColor).toBe('white');
    });

    it('content box has border radius', () => {
      const { container } = render(<LoadingOverlay isLoading={true} />);
      const overlay = container.firstChild as HTMLElement;
      const contentBox = overlay.firstChild as HTMLElement;
      expect(contentBox.style.borderRadius).toBe('8px');
    });
  });

  describe('spinner integration', () => {
    it('renders large spinner', () => {
      render(<LoadingOverlay isLoading={true} />);
      // LoadingSpinner is rendered inside
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('conditional rendering', () => {
    it('toggles visibility based on isLoading prop', () => {
      const { rerender, container } = render(<LoadingOverlay isLoading={false} />);
      expect(container.firstChild).toBeNull();

      rerender(<LoadingOverlay isLoading={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<LoadingOverlay isLoading={false} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
