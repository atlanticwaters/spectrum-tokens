import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} loading>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders primary variant by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByText('Primary');
    expect(button).toHaveStyle({ backgroundColor: '#1976d2' });
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveStyle({ backgroundColor: '#f5f5f5' });
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('has correct ARIA attributes when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeDisabled();
  });

  it('has correct ARIA attributes when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByText('Loading');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('applies custom aria-label', () => {
    render(<Button aria-label="Custom label">Button</Button>);
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
  });

  it('has correct button type by default', () => {
    render(<Button>Button</Button>);
    expect(screen.getByText('Button')).toHaveAttribute('type', 'button');
  });

  it('accepts custom button type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByText('Submit')).toHaveAttribute('type', 'submit');
  });

  it('changes style on hover for primary variant', () => {
    render(<Button variant="primary">Hover me</Button>);
    const button = screen.getByText('Hover me');

    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({ backgroundColor: '#1565c0' });

    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({ backgroundColor: '#1976d2' });
  });

  it('changes style on hover for secondary variant', () => {
    render(<Button variant="secondary">Hover me</Button>);
    const button = screen.getByText('Hover me');

    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({ backgroundColor: '#eeeeee' });

    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({ backgroundColor: '#f5f5f5' });
  });

  it('does not change style on hover when disabled', () => {
    render(<Button disabled>Disabled hover</Button>);
    const button = screen.getByText('Disabled hover');
    const initialStyle = button.style.backgroundColor;

    fireEvent.mouseEnter(button);
    expect(button.style.backgroundColor).toBe(initialStyle);
  });

  it('does not change style on hover when loading', () => {
    render(<Button loading>Loading hover</Button>);
    const button = screen.getByText('Loading hover');
    const initialStyle = button.style.backgroundColor;

    fireEvent.mouseEnter(button);
    expect(button.style.backgroundColor).toBe(initialStyle);
  });
});
