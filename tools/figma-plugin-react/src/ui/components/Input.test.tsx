import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from './Input';

describe('Input', () => {
  it('renders with label', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('renders value correctly', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="john_doe" onChange={handleChange} />);
    const input = screen.getByLabelText('Username') as HTMLInputElement;
    expect(input.value).toBe('john_doe');
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Username');
    fireEvent.change(input, { target: { value: 'new_value' } });

    expect(handleChange).toHaveBeenCalledWith('new_value');
  });

  it('does not call onChange when disabled', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} disabled />);

    const input = screen.getByLabelText('Username');
    fireEvent.change(input, { target: { value: 'new_value' } });

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('renders placeholder', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Username" value="" onChange={handleChange} placeholder="Enter username" />
    );

    const input = screen.getByPlaceholderText('Enter username');
    expect(input).toBeInTheDocument();
  });

  it('has correct type by default', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('accepts custom type', () => {
    const handleChange = jest.fn();
    render(<Input label="Email" value="" onChange={handleChange} type="email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('is disabled when disabled prop is true', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} disabled />);

    const input = screen.getByLabelText('Username');
    expect(input).toBeDisabled();
  });

  it('displays error message', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Username" value="" onChange={handleChange} error="Username is required" />
    );

    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('has correct ARIA attributes when error is present', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Username" value="" onChange={handleChange} error="Username is required" />
    );

    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'input-username-error');
  });

  it('error message has role="alert"', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Username" value="" onChange={handleChange} error="Username is required" />
    );

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Username is required');
  });

  it('generates id from label when not provided', () => {
    const handleChange = jest.fn();
    render(<Input label="User Name" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('User Name');
    expect(input).toHaveAttribute('id', 'input-user-name');
  });

  it('uses custom id when provided', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} id="custom-id" />);

    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('id', 'custom-id');
  });

  it('uses custom aria-label when provided', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Username" value="" onChange={handleChange} aria-label="Custom label" />
    );

    const input = screen.getByLabelText('Custom label');
    expect(input).toBeInTheDocument();
  });

  it('changes border color on focus', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Username') as HTMLInputElement;
    fireEvent.focus(input);

    expect(input.style.borderColor).toBe('#1976d2');
    expect(input.style.boxShadow).toBe('0 0 0 2px rgba(25, 118, 210, 0.2)');
  });

  it('resets border color on blur', () => {
    const handleChange = jest.fn();
    render(<Input label="Username" value="" onChange={handleChange} />);

    const input = screen.getByLabelText('Username') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(input.style.borderColor).toBe('#ddd');
    expect(input.style.boxShadow).toBe('none');
  });

  it('does not change border color on focus when error is present', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Username" value="" onChange={handleChange} error="Username is required" />
    );

    const input = screen.getByLabelText('Username') as HTMLInputElement;
    fireEvent.focus(input);

    expect(input.style.borderColor).not.toBe('#1976d2');
  });

  it('maintains error border color on blur', () => {
    const handleChange = jest.fn();
    render(
      <Input label="Username" value="" onChange={handleChange} error="Username is required" />
    );

    const input = screen.getByLabelText('Username') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(input.style.borderColor).toBe('#d32f2f');
  });
});
