import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('renders with basic props', () => {
    render(<ProgressBar current={5} total={10} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays correct percentage', () => {
    render(<ProgressBar current={25} total={100} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('displays correct count', () => {
    render(<ProgressBar current={7} total={20} />);
    expect(screen.getByText('7 / 20')).toBeInTheDocument();
  });

  it('displays message when provided', () => {
    render(<ProgressBar current={5} total={10} message="Processing files..." />);
    expect(screen.getByText('Processing files...')).toBeInTheDocument();
  });

  it('calculates percentage correctly for partial progress', () => {
    render(<ProgressBar current={3} total={7} />);
    // 3/7 = 0.428... = 43% when rounded
    expect(screen.getByText('43%')).toBeInTheDocument();
  });

  it('shows 100% when current equals total', () => {
    render(<ProgressBar current={10} total={10} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows 0% when current is 0', () => {
    render(<ProgressBar current={0} total={10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles total of 0 gracefully', () => {
    render(<ProgressBar current={0} total={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('clamps percentage to 100% when current exceeds total', () => {
    render(<ProgressBar current={15} total={10} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clamps percentage to 0% when current is negative', () => {
    render(<ProgressBar current={-5} total={10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<ProgressBar current={5} total={10} />);
    const progressBar = screen.getByRole('progressbar');

    expect(progressBar).toHaveAttribute('aria-valuenow', '5');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '10');
  });

  it('uses custom aria-label when provided', () => {
    render(<ProgressBar current={5} total={10} aria-label="Custom progress label" />);
    expect(screen.getByLabelText('Custom progress label')).toBeInTheDocument();
  });

  it('generates default aria-label from current and total', () => {
    render(<ProgressBar current={7} total={20} />);
    expect(screen.getByLabelText('Progress: 7 of 20')).toBeInTheDocument();
  });

  it('renders progress bar fill with correct width', () => {
    const { container } = render(<ProgressBar current={30} total={100} />);
    const progressFill = container.querySelector('[style*="width: 30%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it('renders progress bar fill with 0% width when current is 0', () => {
    const { container } = render(<ProgressBar current={0} total={100} />);
    const progressFill = container.querySelector('[style*="width: 0%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it('renders progress bar fill with 100% width when complete', () => {
    const { container } = render(<ProgressBar current={50} total={50} />);
    const progressFill = container.querySelector('[style*="width: 100%"]');
    expect(progressFill).toBeInTheDocument();
  });

  it('displays long messages with ellipsis', () => {
    const longMessage = 'This is a very long message that should be truncated with ellipsis';
    render(<ProgressBar current={5} total={10} message={longMessage} />);

    const messageElement = screen.getByText(longMessage);
    expect(messageElement).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });

  it('includes message in title attribute for tooltip', () => {
    const message = 'Processing files...';
    render(<ProgressBar current={5} total={10} message={message} />);

    const messageElement = screen.getByText(message);
    expect(messageElement).toHaveAttribute('title', message);
  });

  it('rounds percentage to nearest integer', () => {
    // 1/3 = 0.333... should round to 33%
    render(<ProgressBar current={1} total={3} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('handles large numbers correctly', () => {
    render(<ProgressBar current={5000} total={10000} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('5000 / 10000')).toBeInTheDocument();
  });
});
