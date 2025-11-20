import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders without message', () => {
      const { container } = render(<LoadingSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with message', () => {
      render(<LoadingSpinner message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('does not render message when not provided', () => {
      const { container } = render(<LoadingSpinner />);
      const text = container.querySelector('span');
      expect(text).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders small size', () => {
      const { container } = render(<LoadingSpinner size="small" />);
      const spinner = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
      expect(spinner.style.width).toBe('16px');
      expect(spinner.style.height).toBe('16px');
    });

    it('renders medium size by default', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
      expect(spinner.style.width).toBe('32px');
      expect(spinner.style.height).toBe('32px');
    });

    it('renders large size', () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const spinner = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
      expect(spinner.style.width).toBe('48px');
      expect(spinner.style.height).toBe('48px');
    });
  });

  describe('accessibility', () => {
    it('has status role', () => {
      render(<LoadingSpinner />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<LoadingSpinner />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-busy="true"', () => {
      render(<LoadingSpinner />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-busy', 'true');
    });

    it('spinner is hidden from screen readers', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('div[aria-hidden="true"]');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('styling', () => {
    it('applies spinning animation', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
      expect(spinner.style.animation).toContain('spin');
    });

    it('has circular border', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
      expect(spinner.style.borderRadius).toBe('50%');
    });

    it('includes keyframes animation', () => {
      const { container } = render(<LoadingSpinner />);
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style?.textContent).toContain('@keyframes spin');
    });
  });

  describe('message layout', () => {
    it('has gap when message is present', () => {
      const { container } = render(<LoadingSpinner message="Loading..." />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.gap).toBe('12px');
    });

    it('has no gap when message is absent', () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.gap).toBe('0');
    });

    it('centers content', () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.display).toBe('flex');
      expect(wrapper.style.alignItems).toBe('center');
      expect(wrapper.style.justifyContent).toBe('center');
    });
  });
});
