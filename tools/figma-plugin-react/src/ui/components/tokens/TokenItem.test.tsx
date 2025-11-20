/**
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TokenItem } from './TokenItem';
import type { Token } from './types';

describe('TokenItem', () => {
  const mockToken: Token = {
    name: 'color-primary',
    value: '#ff0000',
    type: 'color',
    description: 'Primary brand color',
  };

  describe('rendering', () => {
    it('renders token name', () => {
      render(<TokenItem token={mockToken} />);
      expect(screen.getByText('color-primary')).toBeInTheDocument();
    });

    it('renders token type', () => {
      render(<TokenItem token={mockToken} />);
      expect(screen.getByText('color')).toBeInTheDocument();
    });

    it('renders token description when provided', () => {
      render(<TokenItem token={mockToken} />);
      expect(screen.getByText('Primary brand color')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const tokenWithoutDesc: Token = {
        name: 'color-primary',
        value: '#ff0000',
        type: 'color',
      };

      render(<TokenItem token={tokenWithoutDesc} />);
      expect(screen.queryByText('Primary brand color')).not.toBeInTheDocument();
    });

    it('renders token preview', () => {
      const { container } = render(<TokenItem token={mockToken} />);
      const preview = container.querySelector('.token-preview');
      expect(preview).toBeInTheDocument();
    });
  });

  describe('apply button', () => {
    it('renders apply button when onApply is provided', () => {
      const onApply = jest.fn();
      render(<TokenItem token={mockToken} onApply={onApply} />);
      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('does not render apply button when onApply is not provided', () => {
      render(<TokenItem token={mockToken} />);
      expect(screen.queryByText('Apply')).not.toBeInTheDocument();
    });

    it('calls onApply when apply button is clicked', () => {
      const onApply = jest.fn();
      render(<TokenItem token={mockToken} onApply={onApply} />);

      fireEvent.click(screen.getByText('Apply'));
      expect(onApply).toHaveBeenCalledTimes(1);
    });

    it('stops propagation when apply button is clicked', () => {
      const onSelect = jest.fn();
      const onApply = jest.fn();

      render(<TokenItem token={mockToken} onSelect={onSelect} onApply={onApply} />);

      fireEvent.click(screen.getByText('Apply'));
      expect(onApply).toHaveBeenCalledTimes(1);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('calls onSelect when item is clicked', () => {
      const onSelect = jest.fn();
      render(<TokenItem token={mockToken} onSelect={onSelect} />);

      fireEvent.click(screen.getByLabelText('Token: color-primary'));
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('does not call onSelect when onSelect is not provided', () => {
      const { container } = render(<TokenItem token={mockToken} />);
      const item = container.querySelector('.token-item');

      // Should not throw
      fireEvent.click(item!);
    });
  });

  describe('keyboard navigation', () => {
    it('calls onSelect when Enter key is pressed', () => {
      const onSelect = jest.fn();
      render(<TokenItem token={mockToken} onSelect={onSelect} />);

      fireEvent.keyDown(screen.getByLabelText('Token: color-primary'), { key: 'Enter' });
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onSelect when Space key is pressed', () => {
      const onSelect = jest.fn();
      render(<TokenItem token={mockToken} onSelect={onSelect} />);

      fireEvent.keyDown(screen.getByLabelText('Token: color-primary'), { key: ' ' });
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('does not call onSelect for other keys', () => {
      const onSelect = jest.fn();
      render(<TokenItem token={mockToken} onSelect={onSelect} />);

      fireEvent.keyDown(screen.getByLabelText('Token: color-primary'), { key: 'A' });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('sets tabIndex to 0 when onSelect is provided', () => {
      const onSelect = jest.fn();
      render(<TokenItem token={mockToken} onSelect={onSelect} />);

      const item = screen.getByLabelText('Token: color-primary');
      expect(item).toHaveAttribute('tabIndex', '0');
    });

    it('does not set tabIndex when onSelect is not provided', () => {
      const { container } = render(<TokenItem token={mockToken} />);
      const item = container.querySelector('.token-item');
      expect(item).not.toHaveAttribute('tabIndex');
    });
  });

  describe('accessibility', () => {
    it('has button role when onSelect is provided', () => {
      const onSelect = jest.fn();
      render(<TokenItem token={mockToken} onSelect={onSelect} />);

      const item = screen.getByLabelText('Token: color-primary');
      expect(item).toHaveAttribute('role', 'button');
    });

    it('does not have button role when onSelect is not provided', () => {
      const { container } = render(<TokenItem token={mockToken} />);
      const item = container.querySelector('.token-item');
      expect(item).not.toHaveAttribute('role');
    });

    it('has aria-label with token name', () => {
      render(<TokenItem token={mockToken} />);
      expect(screen.getByLabelText('Token: color-primary')).toBeInTheDocument();
    });

    it('has title attribute on description for overflow', () => {
      render(<TokenItem token={mockToken} />);
      const description = screen.getByText('Primary brand color');
      expect(description).toHaveAttribute('title', 'Primary brand color');
    });
  });

  describe('styling', () => {
    it('has pointer cursor when onSelect is provided', () => {
      const onSelect = jest.fn();
      const { container } = render(<TokenItem token={mockToken} onSelect={onSelect} />);
      const item = container.querySelector('.token-item');

      expect(item).toHaveStyle({ cursor: 'pointer' });
    });

    it('has default cursor when onSelect is not provided', () => {
      const { container } = render(<TokenItem token={mockToken} />);
      const item = container.querySelector('.token-item');

      expect(item).toHaveStyle({ cursor: 'default' });
    });

    it('applies text overflow ellipsis to long token names', () => {
      const longToken: Token = {
        name: 'very-long-token-name-that-should-be-truncated',
        value: '#ff0000',
        type: 'color',
      };

      render(<TokenItem token={longToken} />);
      const nameElement = screen.getByText(longToken.name);

      expect(nameElement).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
    });
  });
});
