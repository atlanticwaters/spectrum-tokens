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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TokenBrowser } from './TokenBrowser';
import tokensReducer from '../../store/slices/tokensSlice';
import type { Token } from './types';

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
  {
    name: 'spacing-medium',
    value: 16,
    type: 'spacing',
  },
  {
    name: 'typography-heading',
    value: { fontSize: 24 },
    type: 'typography',
  },
];

// Helper to create a test store
function createTestStore(tokens: Token[] = []) {
  return configureStore({
    reducer: {
      tokens: tokensReducer,
    },
    preloadedState: {
      tokens: {
        tokens,
        selectedToken: null,
        editingToken: null,
        isLoading: false,
        error: null,
      },
    },
  });
}

// Helper to render with Redux
function renderWithRedux(ui: React.ReactElement, store = createTestStore(mockTokens)) {
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe('TokenBrowser', () => {
  describe('rendering', () => {
    it('renders all tokens initially', () => {
      renderWithRedux(<TokenBrowser />);

      expect(screen.getByText('color-primary')).toBeInTheDocument();
      expect(screen.getByText('color-secondary')).toBeInTheDocument();
      expect(screen.getByText('spacing-small')).toBeInTheDocument();
    });

    it('renders search input', () => {
      renderWithRedux(<TokenBrowser />);
      expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
    });

    it('renders type filter dropdown', () => {
      renderWithRedux(<TokenBrowser />);
      expect(screen.getByLabelText('Filter tokens by type')).toBeInTheDocument();
    });

    it('displays token count', () => {
      renderWithRedux(<TokenBrowser />);
      expect(screen.getByText(`Showing ${mockTokens.length} of ${mockTokens.length} tokens`)).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters tokens by search query', async () => {
      renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');
      fireEvent.change(searchInput, { target: { value: 'primary' } });

      await waitFor(() => {
        expect(screen.getByText('color-primary')).toBeInTheDocument();
        expect(screen.queryByText('color-secondary')).not.toBeInTheDocument();
      });
    });

    it('search is case-insensitive', async () => {
      renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');
      fireEvent.change(searchInput, { target: { value: 'PRIMARY' } });

      await waitFor(() => {
        expect(screen.getByText('color-primary')).toBeInTheDocument();
      });
    });

    it('shows empty state when no tokens match search', async () => {
      renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No tokens found')).toBeInTheDocument();
      });
    });

    it('updates token count when filtering by search', async () => {
      renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');
      fireEvent.change(searchInput, { target: { value: 'color' } });

      await waitFor(() => {
        expect(screen.getByText(`Showing 2 of ${mockTokens.length} tokens`)).toBeInTheDocument();
      });
    });

    it('can clear search to show all tokens', async () => {
      renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');

      // First filter
      fireEvent.change(searchInput, { target: { value: 'primary' } });
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 5 tokens')).toBeInTheDocument();
      });

      // Clear filter
      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Showing 5 of 5 tokens')).toBeInTheDocument();
      });
    });
  });

  describe('type filter functionality', () => {
    it('populates type filter with unique token types', () => {
      renderWithRedux(<TokenBrowser />);

      const typeFilter = screen.getByLabelText('Filter tokens by type') as HTMLSelectElement;
      const options = Array.from(typeFilter.options).map((opt) => opt.value);

      expect(options).toContain('all');
      expect(options).toContain('color');
      expect(options).toContain('spacing');
      expect(options).toContain('typography');
    });

    it('filters tokens by selected type', async () => {
      renderWithRedux(<TokenBrowser />);

      const typeFilter = screen.getByLabelText('Filter tokens by type');
      fireEvent.change(typeFilter, { target: { value: 'color' } });

      await waitFor(() => {
        expect(screen.getByText('color-primary')).toBeInTheDocument();
        expect(screen.getByText('color-secondary')).toBeInTheDocument();
        expect(screen.queryByText('spacing-small')).not.toBeInTheDocument();
      });
    });

    it('updates token count when filtering by type', async () => {
      renderWithRedux(<TokenBrowser />);

      const typeFilter = screen.getByLabelText('Filter tokens by type');
      fireEvent.change(typeFilter, { target: { value: 'spacing' } });

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 5 tokens')).toBeInTheDocument();
      });
    });

    it('shows all tokens when "all" type is selected', async () => {
      renderWithRedux(<TokenBrowser />);

      const typeFilter = screen.getByLabelText('Filter tokens by type');

      // First filter by color
      fireEvent.change(typeFilter, { target: { value: 'color' } });
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 5 tokens')).toBeInTheDocument();
      });

      // Then select "all"
      fireEvent.change(typeFilter, { target: { value: 'all' } });
      await waitFor(() => {
        expect(screen.getByText('Showing 5 of 5 tokens')).toBeInTheDocument();
      });
    });

    it('sorts token types alphabetically in dropdown', () => {
      renderWithRedux(<TokenBrowser />);

      const typeFilter = screen.getByLabelText('Filter tokens by type') as HTMLSelectElement;
      const options = Array.from(typeFilter.options)
        .map((opt) => opt.value)
        .filter((val) => val !== 'all');

      // Check that types are sorted
      const sorted = [...options].sort();
      expect(options).toEqual(sorted);
    });
  });

  describe('combined filtering', () => {
    it('applies both search and type filters together', async () => {
      renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');
      const typeFilter = screen.getByLabelText('Filter tokens by type');

      // Filter by type first
      fireEvent.change(typeFilter, { target: { value: 'color' } });

      // Then search
      fireEvent.change(searchInput, { target: { value: 'primary' } });

      await waitFor(() => {
        expect(screen.getByText('color-primary')).toBeInTheDocument();
        expect(screen.queryByText('color-secondary')).not.toBeInTheDocument();
        expect(screen.getByText('Showing 1 of 5 tokens')).toBeInTheDocument();
      });
    });

    it('shows empty state when combined filters match nothing', async () => {
      renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');
      const typeFilter = screen.getByLabelText('Filter tokens by type');

      fireEvent.change(typeFilter, { target: { value: 'color' } });
      fireEvent.change(searchInput, { target: { value: 'spacing' } });

      await waitFor(() => {
        expect(screen.getByText('No tokens found')).toBeInTheDocument();
      });
    });
  });

  describe('token interactions', () => {
    it('dispatches selectToken when token is clicked', async () => {
      const { store } = renderWithRedux(<TokenBrowser />);

      fireEvent.click(screen.getByLabelText('Token: color-primary'));

      const state = store.getState();
      expect(state.tokens.selectedToken).toEqual(mockTokens[0]);
    });

    it('calls onTokenApply when apply button is clicked', async () => {
      const onTokenApply = jest.fn();
      renderWithRedux(<TokenBrowser onTokenApply={onTokenApply} />);

      const applyButtons = screen.getAllByRole('button', { name: 'Apply' });
      fireEvent.click(applyButtons[0]);

      expect(onTokenApply).toHaveBeenCalledWith(mockTokens[0]);
    });
  });

  describe('empty state', () => {
    it('shows empty state when no tokens provided', () => {
      const store = createTestStore([]);
      renderWithRedux(<TokenBrowser />, store);
      expect(screen.getByText('No tokens found')).toBeInTheDocument();
    });

    it('displays correct count for empty tokens', () => {
      const store = createTestStore([]);
      renderWithRedux(<TokenBrowser />, store);
      expect(screen.getByText('Showing 0 of 0 tokens')).toBeInTheDocument();
    });

    it('still renders search and filter controls when empty', () => {
      const store = createTestStore([]);
      renderWithRedux(<TokenBrowser />, store);

      expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter tokens by type')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithRedux(<TokenBrowser />);

      expect(screen.getByLabelText('Filter tokens by type')).toBeInTheDocument();
      expect(screen.getByLabelText('Search Tokens')).toBeInTheDocument();
    });

    it('token count has status role', () => {
      renderWithRedux(<TokenBrowser />);
      const status = screen.getByText(/Showing \d+ of \d+ tokens/);

      expect(status).toHaveAttribute('role', 'status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('performance', () => {
    it('handles large token sets efficiently', () => {
      const largeTokenSet: Token[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `token-${i}`,
        value: `#${i.toString(16).padStart(6, '0')}`,
        type: i % 2 === 0 ? 'color' : 'spacing',
      }));

      const store = createTestStore(largeTokenSet);
      renderWithRedux(<TokenBrowser />, store);
      expect(screen.getByText('Showing 1000 of 1000 tokens')).toBeInTheDocument();
    });

    it('memoizes filtered tokens to avoid unnecessary re-renders', async () => {
      const { rerender } = renderWithRedux(<TokenBrowser />);

      const searchInput = screen.getByPlaceholderText('Search by name...');
      fireEvent.change(searchInput, { target: { value: 'color' } });

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 5 tokens')).toBeInTheDocument();
      });

      // Rerender with same props should use memoized values
      const store = createTestStore(mockTokens);
      rerender(
        <Provider store={store}>
          <TokenBrowser />
        </Provider>
      );

      // Search should still be applied
      expect(screen.getByText('Showing 2 of 5 tokens')).toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('reads tokens from Redux store', () => {
      const customTokens = [
        { name: 'test-token', value: '#000000', type: 'color' },
      ];
      const store = createTestStore(customTokens);
      renderWithRedux(<TokenBrowser />, store);

      expect(screen.getByText('test-token')).toBeInTheDocument();
    });

    it('updates display when tokens in store change', async () => {
      const store = createTestStore([]);
      const { rerender } = renderWithRedux(<TokenBrowser />, store);

      expect(screen.getByText('Showing 0 of 0 tokens')).toBeInTheDocument();

      // Add token to store
      store.dispatch({
        type: 'tokens/addToken',
        payload: { name: 'new-token', value: '#123456', type: 'color' },
      });

      // Rerender
      rerender(
        <Provider store={store}>
          <TokenBrowser />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('new-token')).toBeInTheDocument();
        expect(screen.getByText('Showing 1 of 1 tokens')).toBeInTheDocument();
      });
    });
  });
});
