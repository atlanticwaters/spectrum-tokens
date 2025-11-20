import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from './Modal';

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <Modal isOpen={false} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const overlay = screen.getByRole('presentation', { hidden: true });
    fireEvent.click(overlay);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const content = screen.getByText('Modal content');
    fireEvent.click(content);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('has correct ARIA attributes', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = screen.getByRole('dialog', { hidden: true });
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('uses custom aria-label when provided', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal" aria-label="Custom label">
        <p>Modal content</p>
      </Modal>
    );

    const modal = screen.getByLabelText('Custom label');
    expect(modal).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div data-testid="child-content">
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      </Modal>
    );

    const childContent = screen.getByTestId('child-content');
    expect(childContent).toBeInTheDocument();
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  it('does not respond to ESC when closed', () => {
    const handleClose = jest.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Close the modal
    rerender(
      <Modal isOpen={false} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Clear previous calls
    handleClose.mockClear();

    // Try pressing ESC
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('focuses modal when opened', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modal = screen.getByRole('dialog', { hidden: true });
    expect(modal).toHaveFocus();
  });

  it('traps focus within modal - Tab forward', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <button>First button</button>
        <button>Last button</button>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    const lastButton = screen.getByText('Last button');

    // Focus last focusable element
    lastButton.focus();
    expect(lastButton).toHaveFocus();

    // Tab forward from last element should cycle to first
    fireEvent.keyDown(document, { key: 'Tab' });

    // After the Tab event, focus should move to close button (first focusable)
    expect(closeButton).toHaveFocus();
  });

  it('traps focus within modal - Shift+Tab backward', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <button>First button</button>
        <button>Last button</button>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    const lastButton = screen.getByText('Last button');

    // Focus first focusable element (close button)
    closeButton.focus();
    expect(closeButton).toHaveFocus();

    // Shift+Tab backward from first element should cycle to last
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    // After the Shift+Tab event, focus should move to last button
    expect(lastButton).toHaveFocus();
  });

  it('ignores non-Tab keys for focus trap', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <button>Test button</button>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    closeButton.focus();

    // Press a non-Tab key
    fireEvent.keyDown(document, { key: 'Enter' });

    // Focus should remain on close button
    expect(closeButton).toHaveFocus();
  });
});
