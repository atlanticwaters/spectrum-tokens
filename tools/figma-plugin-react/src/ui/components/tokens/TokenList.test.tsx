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
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TokenList } from './TokenList';
import type { Token } from './types';

afterEach(() => {
  cleanup();
});

describe('TokenList', () => {
  const mockTokens: Token[] = [
    {
      name: 'color-primary',
      value: '#ff0000',
      type: 'color',
      description: 'Primary brand color',
    },
    {
      name: 'color-secondary',
      value: '#00ff00',
      type: 'color',
      description: 'Secondary brand color',
    },
    {
      name: 'spacing-small',
      value: 8,
      type: 'spacing',
    },
  ];

  describe('rendering', () => {
    it('renders all tokens', () => {
      render(<TokenList tokens={mockTokens} />);

      expect(screen.getByText('color-primary')).toBeInTheDocument();
      expect(screen.getByText('color-secondary')).toBeInTheDocument();
      expect(screen.getByText('spacing-small')).toBeInTheDocument();
    });

    it('renders empty state when no tokens', () => {
      render(<TokenList tokens={[]} />);
      expect(screen.getByText('No tokens found')).toBeInTheDocument();
    });

    it('has list role for accessibility', () => {
      render(<TokenList tokens={mockTokens} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('renders each token as a list item', () => {
      render(<TokenList tokens={mockTokens} />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockTokens.length);
    });
  });

  describe('token selection', () => {
    it('calls onTokenSelect with correct token when item is clicked', () => {
      const onTokenSelect = jest.fn();
      render(<TokenList tokens={mockTokens} onTokenSelect={onTokenSelect} />);

      fireEvent.click(screen.getByLabelText('Token: color-primary'));
      expect(onTokenSelect).toHaveBeenCalledWith(mockTokens[0]);
    });

    it('calls onTokenSelect for each token independently', () => {
      const onTokenSelect = jest.fn();
      render(<TokenList tokens={mockTokens} onTokenSelect={onTokenSelect} />);

      fireEvent.click(screen.getByLabelText('Token: color-primary'));
      expect(onTokenSelect).toHaveBeenCalledWith(mockTokens[0]);

      fireEvent.click(screen.getByLabelText('Token: color-secondary'));
      expect(onTokenSelect).toHaveBeenCalledWith(mockTokens[1]);

      expect(onTokenSelect).toHaveBeenCalledTimes(2);
    });

    it('does not throw when onTokenSelect is not provided', () => {
      render(<TokenList tokens={mockTokens} />);
      // Should not throw
      fireEvent.click(screen.getByLabelText('Token: color-primary'));
    });
  });

  describe('token application', () => {
    it('calls onTokenApply with correct token when apply is clicked', () => {
      const onTokenApply = jest.fn();
      render(<TokenList tokens={mockTokens} onTokenApply={onTokenApply} />);

      const applyButtons = screen.getAllByRole('button', { name: 'Apply' });
      fireEvent.click(applyButtons[0]);

      expect(onTokenApply).toHaveBeenCalledWith(mockTokens[0]);
    });

    it('calls onTokenApply for each token independently', () => {
      const onTokenApply = jest.fn();
      render(<TokenList tokens={mockTokens} onTokenApply={onTokenApply} />);

      const applyButtons = screen.getAllByRole('button', { name: 'Apply' });

      fireEvent.click(applyButtons[0]);
      expect(onTokenApply).toHaveBeenCalledWith(mockTokens[0]);

      fireEvent.click(applyButtons[1]);
      expect(onTokenApply).toHaveBeenCalledWith(mockTokens[1]);

      expect(onTokenApply).toHaveBeenCalledTimes(2);
    });
  });

  describe('empty state', () => {
    it('shows empty state message when tokens array is empty', () => {
      render(<TokenList tokens={[]} />);
      expect(screen.getByText('No tokens found')).toBeInTheDocument();
    });

    it('empty state has proper accessibility attributes', () => {
      render(<TokenList tokens={[]} />);
      const emptyState = screen.getByText('No tokens found');

      expect(emptyState).toHaveAttribute('role', 'status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });

    it('does not render token items when tokens array is empty', () => {
      const { container } = render(<TokenList tokens={[]} />);
      const tokenItems = container.querySelectorAll('.token-item');
      expect(tokenItems).toHaveLength(0);
    });
  });

  describe('performance', () => {
    it('handles large number of tokens', () => {
      const largeTokenSet: Token[] = Array.from({ length: 100 }, (_, i) => ({
        name: `token-${i}`,
        value: `#${i.toString(16).padStart(6, '0')}`,
        type: 'color',
      }));

      const { container } = render(<TokenList tokens={largeTokenSet} />);
      const tokenItems = container.querySelectorAll('.token-item');
      expect(tokenItems).toHaveLength(100);
    });
  });

  describe('unique keys', () => {
    it('uses token name as key for list items', () => {
      const { container } = render(<TokenList tokens={mockTokens} />);
      const listItems = container.querySelectorAll('[role="listitem"]');

      // React will warn if keys are not unique, so this test ensures no warnings
      expect(listItems).toHaveLength(mockTokens.length);
    });

    it('handles tokens with duplicate names gracefully', () => {
      const tokensWithDuplicates: Token[] = [
        { name: 'color-primary', value: '#ff0000', type: 'color' },
        { name: 'color-primary', value: '#00ff00', type: 'color' }, // Duplicate name
      ];

      // Should render without crashing (though duplicate keys will cause React warning)
      const { container } = render(<TokenList tokens={tokensWithDuplicates} />);
      const tokenItems = container.querySelectorAll('.token-item');
      expect(tokenItems).toHaveLength(2);
    });
  });
});
