import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Checkbox from './Checkbox';

describe('Checkbox', () => {
  it('renders with label', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Accept terms" checked={false} onChange={handleChange} />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders checked state correctly', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Checked box" checked={true} onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders unchecked state correctly', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Unchecked box" checked={false} onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('calls onChange with true when checked', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Click me" checked={false} onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when unchecked', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Click me" checked={true} onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('does not call onChange when disabled', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Disabled" checked={false} onChange={handleChange} disabled />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('has correct ARIA attributes', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Test checkbox" checked={true} onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox).toHaveAttribute('aria-label', 'Test checkbox');
  });

  it('uses custom aria-label when provided', () => {
    const handleChange = jest.fn();
    render(
      <Checkbox
        label="Test checkbox"
        checked={false}
        onChange={handleChange}
        aria-label="Custom label"
      />
    );

    const checkbox = screen.getByLabelText('Custom label');
    expect(checkbox).toBeInTheDocument();
  });

  it('generates id from label when not provided', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Test Checkbox Label" checked={false} onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'checkbox-test-checkbox-label');
  });

  it('uses custom id when provided', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Test" checked={false} onChange={handleChange} id="custom-id" />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'custom-id');
  });

  it('is disabled when disabled prop is true', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Disabled" checked={false} onChange={handleChange} disabled />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('can be toggled by clicking the label', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Click label" checked={false} onChange={handleChange} />);

    const label = screen.getByText('Click label');
    fireEvent.click(label);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('has accessible label association', () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Associated label" checked={false} onChange={handleChange} />);

    const checkbox = screen.getByLabelText('Associated label');
    expect(checkbox).toBeInTheDocument();
  });
});
