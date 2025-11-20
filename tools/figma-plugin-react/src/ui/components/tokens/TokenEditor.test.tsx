import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TokenEditor } from './TokenEditor';
import tokensReducer, { setEditingToken } from '../../store/slices/tokensSlice';

// Helper to create a test store
function createTestStore(initialState = {}) {
  return configureStore({
    reducer: {
      tokens: tokensReducer,
    },
    preloadedState: {
      tokens: {
        tokens: [],
        selectedToken: null,
        editingToken: null,
        isLoading: false,
        error: null,
        ...initialState,
      },
    },
  });
}

// Helper to render with Redux
function renderWithRedux(ui: React.ReactElement, store = createTestStore()) {
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe('TokenEditor', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create token dialog', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      expect(screen.getByText('Create Token')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('primary-color')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('allows editing all fields in create mode', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const nameInput = screen.getByPlaceholderText('primary-color');
      const typeSelect = screen.getByLabelText('Token Type');

      expect(nameInput).not.toBeDisabled();
      expect(typeSelect).not.toBeDisabled();
    });

    it('shows error when name is empty', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(screen.getByText('Token name is required')).toBeInTheDocument();
    });

    it('shows error when value is empty', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'test-token' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(screen.getByText('Token value is required')).toBeInTheDocument();
    });

    it('creates color token successfully', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'primary-blue' } });

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: '#0000FF' } });

      const descriptionInput = screen.getByPlaceholderText('Brief description of this token');
      fireEvent.change(descriptionInput, { target: { value: 'Primary brand color' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
        expect(state.tokens.tokens[0]).toEqual({
          name: 'primary-blue',
          value: '#0000FF',
          type: 'color',
          description: 'Primary brand color',
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('validates color format', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'test-color' } });

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: 'not#valid' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(screen.getByText('Invalid color format')).toBeInTheDocument();
    });

    it('accepts valid hex colors', async () => {
      const validColors = ['#FFF', '#FFFFFF', '#FFFFFFFF'];

      for (const color of validColors) {
        const { store, unmount } = renderWithRedux(
          <TokenEditor
            isOpen={true}
            onClose={mockOnClose}
            mode="create"
          />
        );

        const nameInput = screen.getByPlaceholderText('primary-color');
        fireEvent.change(nameInput, { target: { value: 'test-color' } });

        const colorInput = screen.getByLabelText('Color value text');
        fireEvent.change(colorInput, { target: { value: color } });

        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);

        await waitFor(() => {
          const state = store.getState();
          expect(state.tokens.tokens).toHaveLength(1);
          expect(state.tokens.tokens[0]).toEqual({
            name: 'test-color',
            value: color,
            type: 'color',
            description: '',
          });
        });

        unmount();
      }
    });

    it('accepts valid rgb colors', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'test-color' } });

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: 'rgb(255, 0, 0)' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
      });
    });

    it('creates dimension token successfully', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const typeSelect = screen.getByLabelText('Token Type');
      fireEvent.change(typeSelect, { target: { value: 'dimension' } });

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'spacing-md' } });

      const valueInput = screen.getByLabelText('Dimension value');
      fireEvent.change(valueInput, { target: { value: '16' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
        expect(state.tokens.tokens[0]).toEqual({
          name: 'spacing-md',
          value: '16',
          type: 'dimension',
          description: '',
        });
      });
    });

    it('validates dimension must be numeric', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const typeSelect = screen.getByLabelText('Token Type');
      fireEvent.change(typeSelect, { target: { value: 'dimension' } });

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'spacing-md' } });

      const valueInput = screen.getByLabelText('Dimension value');
      // Number inputs reject non-numeric input and become empty string
      fireEvent.change(valueInput, { target: { value: 'not-a-number' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Empty number input triggers the general "value required" error
      expect(screen.getByText('Token value is required')).toBeInTheDocument();
    });

    it('creates opacity token successfully', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const typeSelect = screen.getByLabelText('Token Type');
      fireEvent.change(typeSelect, { target: { value: 'opacity' } });

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'opacity-50' } });

      const valueInput = screen.getByLabelText('Opacity value');
      fireEvent.change(valueInput, { target: { value: '0.5' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
        expect(state.tokens.tokens[0]).toEqual({
          name: 'opacity-50',
          value: '0.5',
          type: 'opacity',
          description: '',
        });
      });
    });

    it('validates opacity range', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const typeSelect = screen.getByLabelText('Token Type');
      fireEvent.change(typeSelect, { target: { value: 'opacity' } });

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'opacity-invalid' } });

      const valueInput = screen.getByLabelText('Opacity value');
      fireEvent.change(valueInput, { target: { value: '1.5' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      expect(screen.getByText('Opacity must be between 0 and 1')).toBeInTheDocument();
    });

    it('creates font family token successfully', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const typeSelect = screen.getByLabelText('Token Type');
      fireEvent.change(typeSelect, { target: { value: 'fontFamily' } });

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'font-primary' } });

      const valueInput = screen.getByLabelText('Font family');
      fireEvent.change(valueInput, { target: { value: 'Inter' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
        expect(state.tokens.tokens[0]).toEqual({
          name: 'font-primary',
          value: 'Inter',
          type: 'fontFamily',
          description: '',
        });
      });
    });

    it('creates font weight token successfully', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const typeSelect = screen.getByLabelText('Token Type');
      fireEvent.change(typeSelect, { target: { value: 'fontWeight' } });

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'font-bold' } });

      const valueSelect = screen.getByLabelText('Font weight');
      fireEvent.change(valueSelect, { target: { value: '700' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
        expect(state.tokens.tokens[0]).toEqual({
          name: 'font-bold',
          value: '700',
          type: 'fontWeight',
          description: '',
        });
      });
    });

    it('creates line height token successfully', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const typeSelect = screen.getByLabelText('Token Type');
      fireEvent.change(typeSelect, { target: { value: 'lineHeight' } });

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'line-height-normal' } });

      const valueInput = screen.getByLabelText('Line height');
      fireEvent.change(valueInput, { target: { value: '1.5' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
        expect(state.tokens.tokens[0]).toEqual({
          name: 'line-height-normal',
          value: '1.5',
          type: 'lineHeight',
          description: '',
        });
      });
    });
  });

  describe('Edit Mode', () => {
    const initialToken = {
      name: 'existing-token',
      value: '#FF0000',
      type: 'color',
      description: 'Existing token description',
    };

    it('renders edit token dialog', () => {
      const store = createTestStore({ editingToken: initialToken });
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
        />,
        store
      );

      expect(screen.getByText('Edit Token')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('loads initial token values from Redux', () => {
      const store = createTestStore({ editingToken: initialToken });
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
        />,
        store
      );

      expect(screen.getByDisplayValue('existing-token')).toBeInTheDocument();
      expect(screen.getByDisplayValue('#FF0000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing token description')).toBeInTheDocument();
    });

    it('disables name and type in edit mode', () => {
      const store = createTestStore({ editingToken: initialToken });
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
        />,
        store
      );

      const nameInput = screen.getByDisplayValue('existing-token');
      const typeSelect = screen.getByLabelText('Token Type');

      expect(nameInput).toBeDisabled();
      expect(typeSelect).toBeDisabled();
    });

    it('allows editing value and description', async () => {
      const store = createTestStore({
        editingToken: initialToken,
        tokens: [initialToken]
      });
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
        />,
        store
      );

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: '#00FF00' } });

      const descriptionInput = screen.getByDisplayValue('Existing token description');
      fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens[0].value).toBe('#00FF00');
        expect(state.tokens.tokens[0].description).toBe('Updated description');
      });
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when cancel button is clicked', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when closed', async () => {
      const { rerender } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'test-token' } });

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: '#FF0000' } });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Reopen the modal
      rerender(
        <Provider store={createTestStore()}>
          <TokenEditor
            isOpen={false}
            onClose={mockOnClose}
            mode="create"
          />
        </Provider>
      );

      rerender(
        <Provider store={createTestStore()}>
          <TokenEditor
            isOpen={true}
            onClose={mockOnClose}
            mode="create"
          />
        </Provider>
      );

      // Form should be reset
      const newNameInput = screen.getByPlaceholderText('primary-color');
      expect(newNameInput).toHaveValue('');
    });

    it('does not render when isOpen is false', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={false}
          onClose={mockOnClose}
          mode="create"
        />
      );

      expect(screen.queryByText('Create Token')).not.toBeInTheDocument();
    });
  });

  describe('Color Picker Integration', () => {
    it('syncs color picker with text input', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: '#FF0000' } });

      const colorPicker = screen.getByLabelText('Color picker');
      // Color picker normalizes to lowercase
      expect(colorPicker).toHaveValue('#ff0000');
    });

    it('updates text input when color picker changes', () => {
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const colorPicker = screen.getByLabelText('Color picker');
      fireEvent.change(colorPicker, { target: { value: '#00FF00' } });

      const colorInput = screen.getByLabelText('Color value text');
      // Color value is set to what the color picker returns (lowercase)
      expect(colorInput).toHaveValue('#00ff00');
    });
  });

  describe('Redux Integration', () => {
    it('dispatches addToken action when creating a token', async () => {
      const { store } = renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />
      );

      const nameInput = screen.getByPlaceholderText('primary-color');
      fireEvent.change(nameInput, { target: { value: 'test-token' } });

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: '#123456' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens).toHaveLength(1);
        expect(state.tokens.tokens[0].name).toBe('test-token');
      });
    });

    it('dispatches updateToken action when editing a token', async () => {
      const existingToken = {
        name: 'token-to-edit',
        value: '#000000',
        type: 'color',
        description: 'Original',
      };

      const store = createTestStore({
        editingToken: existingToken,
        tokens: [existingToken],
      });

      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="edit"
        />,
        store
      );

      const colorInput = screen.getByLabelText('Color value text');
      fireEvent.change(colorInput, { target: { value: '#FFFFFF' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tokens.tokens[0].value).toBe('#FFFFFF');
      });
    });

    it('clears error on close', () => {
      const store = createTestStore({ error: 'Some error' });
      renderWithRedux(
        <TokenEditor
          isOpen={true}
          onClose={mockOnClose}
          mode="create"
        />,
        store
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      const state = store.getState();
      expect(state.tokens.error).toBeNull();
    });
  });
});
