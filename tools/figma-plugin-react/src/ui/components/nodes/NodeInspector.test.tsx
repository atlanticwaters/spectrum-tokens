import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NodeInspector } from './NodeInspector';

describe('NodeInspector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial States', () => {
    it('shows empty state when no node is selected', () => {
      render(<NodeInspector selectedNodeId={null} />);
      expect(screen.getByText('Select a node to inspect')).toBeInTheDocument();
    });

    it('shows loading state when node data is being fetched', () => {
      render(<NodeInspector selectedNodeId="123:456" />);
      expect(screen.getByText('Loading node data...')).toBeInTheDocument();
    });

    it('has correct CSS class for empty state', () => {
      render(<NodeInspector selectedNodeId={null} />);
      const emptyElement = screen.getByText('Select a node to inspect');
      expect(emptyElement.className).toBe('node-inspector-empty');
    });

    it('has correct CSS class for loading state', () => {
      render(<NodeInspector selectedNodeId="123:456" />);
      const loadingElement = screen.getByText('Loading node data...');
      expect(loadingElement.className).toBe('node-inspector-loading');
    });
  });

  describe('Message Handling', () => {
    it('sends get-node-data message when node is selected', () => {
      const postMessageSpy = jest.spyOn(window.parent, 'postMessage');

      render(<NodeInspector selectedNodeId="123:456" />);

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'get-node-data',
            payload: { nodeId: '123:456' },
          },
        },
        '*'
      );
    });

    it('displays node data when received from plugin', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      // Simulate message from plugin
      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Button Component',
              type: 'COMPONENT',
              appliedTokens: ['primary-color', 'spacing-md'],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('Button Component')).toBeInTheDocument();
        expect(screen.getByText('COMPONENT')).toBeInTheDocument();
        expect(screen.getByText('primary-color')).toBeInTheDocument();
        expect(screen.getByText('spacing-md')).toBeInTheDocument();
      });
    });

    it('shows not found when node data is null', async () => {
      render(<NodeInspector selectedNodeId="999:999" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: null,
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('Node not found')).toBeInTheDocument();
      });
    });

    it('updates when selectedNodeId changes', () => {
      const postMessageSpy = jest.spyOn(window.parent, 'postMessage');
      const { rerender } = render(<NodeInspector selectedNodeId="123:456" />);

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginMessage: expect.objectContaining({
            payload: { nodeId: '123:456' },
          }),
        }),
        '*'
      );

      rerender(<NodeInspector selectedNodeId="789:012" />);

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginMessage: expect.objectContaining({
            payload: { nodeId: '789:012' },
          }),
        }),
        '*'
      );
    });

    it('clears node data when selectedNodeId becomes null', () => {
      const { rerender } = render(<NodeInspector selectedNodeId="123:456" />);

      // First, set node data
      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['token1'],
            },
          },
        },
      });
      window.dispatchEvent(messageEvent);

      // Then deselect
      rerender(<NodeInspector selectedNodeId={null} />);
      expect(screen.getByText('Select a node to inspect')).toBeInTheDocument();
      expect(screen.queryByText('Test Node')).not.toBeInTheDocument();
    });
  });

  describe('Node Display', () => {
    it('displays node name and type', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Header Frame',
              type: 'FRAME',
              appliedTokens: [],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('Header Frame')).toBeInTheDocument();
        expect(screen.getByText('FRAME')).toBeInTheDocument();
      });
    });

    it('shows "No tokens applied" when appliedTokens is empty', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Empty Node',
              type: 'RECTANGLE',
              appliedTokens: [],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('No tokens applied')).toBeInTheDocument();
      });
    });

    it('does not show clear button when no tokens applied', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Empty Node',
              type: 'RECTANGLE',
              appliedTokens: [],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.queryByText('Clear All Tokens')).not.toBeInTheDocument();
      });
    });

    it('displays multiple applied tokens', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Styled Node',
              type: 'TEXT',
              appliedTokens: ['primary-color', 'font-size-lg', 'spacing-md'],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('primary-color')).toBeInTheDocument();
        expect(screen.getByText('font-size-lg')).toBeInTheDocument();
        expect(screen.getByText('spacing-md')).toBeInTheDocument();
      });
    });

    it('shows clear button when tokens are applied', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Styled Node',
              type: 'RECTANGLE',
              appliedTokens: ['primary-color'],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('Clear All Tokens')).toBeInTheDocument();
      });
    });
  });

  describe('Token Navigation', () => {
    it('renders View button for each token', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['token1', 'token2'],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        expect(viewButtons).toHaveLength(2);
      });
    });

    it('dispatches navigate-to-token event when View is clicked', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['primary-color'],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('primary-color')).toBeInTheDocument();
      });

      const eventListener = jest.fn();
      window.addEventListener('navigate-to-token', eventListener);

      const viewButton = screen.getByLabelText('Navigate to primary-color');
      await userEvent.click(viewButton);

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'navigate-to-token',
          detail: { tokenName: 'primary-color' },
        })
      );

      window.removeEventListener('navigate-to-token', eventListener);
    });

    it('View button has correct aria-label', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['spacing-lg'],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        const viewButton = screen.getByLabelText('Navigate to spacing-lg');
        expect(viewButton).toBeInTheDocument();
      });
    });
  });

  describe('Clear Tokens Functionality', () => {
    it('sends clear-node-tokens message when Clear All Tokens is clicked', async () => {
      const postMessageSpy = jest.spyOn(window.parent, 'postMessage');
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['token1'],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('Clear All Tokens')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear All Tokens');
      await userEvent.click(clearButton);

      expect(postMessageSpy).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'clear-node-tokens',
            payload: { nodeId: '123:456' },
          },
        },
        '*'
      );
    });

    it('clears tokens when node-tokens-cleared message is received', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      // Set initial node data with tokens
      const nodeDataEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['token1', 'token2'],
            },
          },
        },
      });

      window.dispatchEvent(nodeDataEvent);

      await waitFor(() => {
        expect(screen.getByText('token1')).toBeInTheDocument();
        expect(screen.getByText('token2')).toBeInTheDocument();
      });

      // Clear tokens
      const clearEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-tokens-cleared',
            payload: { nodeId: '123:456' },
          },
        },
      });

      window.dispatchEvent(clearEvent);

      await waitFor(() => {
        expect(screen.getByText('No tokens applied')).toBeInTheDocument();
        expect(screen.queryByText('token1')).not.toBeInTheDocument();
        expect(screen.queryByText('token2')).not.toBeInTheDocument();
        expect(screen.queryByText('Clear All Tokens')).not.toBeInTheDocument();
      });
    });

    it('does not clear tokens if nodeId does not match', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      // Set initial node data with tokens
      const nodeDataEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['token1'],
            },
          },
        },
      });

      window.dispatchEvent(nodeDataEvent);

      await waitFor(() => {
        expect(screen.getByText('token1')).toBeInTheDocument();
      });

      // Try to clear with different nodeId
      const clearEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-tokens-cleared',
            payload: { nodeId: '999:999' },
          },
        },
      });

      window.dispatchEvent(clearEvent);

      // Tokens should still be there
      await waitFor(() => {
        expect(screen.getByText('token1')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid node selection changes', () => {
      const postMessageSpy = jest.spyOn(window.parent, 'postMessage');
      const { rerender } = render(<NodeInspector selectedNodeId="1:1" />);

      rerender(<NodeInspector selectedNodeId="2:2" />);
      rerender(<NodeInspector selectedNodeId="3:3" />);
      rerender(<NodeInspector selectedNodeId="4:4" />);

      expect(postMessageSpy).toHaveBeenCalledTimes(4);
      expect(postMessageSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          pluginMessage: expect.objectContaining({
            payload: { nodeId: '4:4' },
          }),
        }),
        '*'
      );
    });

    it('handles empty token name gracefully', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Test Node',
              type: 'FRAME',
              appliedTokens: ['', 'valid-token', ''],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('valid-token')).toBeInTheDocument();
        // Empty tokens should still render but will be empty strings
        const tokens = screen.getAllByRole('button', { name: /Navigate to/ });
        expect(tokens.length).toBeGreaterThan(0);
      });
    });

    it('handles node with very long name', async () => {
      const longName = 'A'.repeat(200);
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: longName,
              type: 'FRAME',
              appliedTokens: [],
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('handles many applied tokens', async () => {
      const manyTokens = Array.from({ length: 50 }, (_, i) => `token-${i}`);
      render(<NodeInspector selectedNodeId="123:456" />);

      const messageEvent = new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'node-data',
            payload: {
              id: '123:456',
              name: 'Heavy Node',
              type: 'FRAME',
              appliedTokens: manyTokens,
            },
          },
        },
      });

      window.dispatchEvent(messageEvent);

      await waitFor(() => {
        expect(screen.getByText('token-0')).toBeInTheDocument();
        expect(screen.getByText('token-49')).toBeInTheDocument();
      });
    });

    it('preserves loading state while waiting for response', async () => {
      render(<NodeInspector selectedNodeId="123:456" />);

      // Loading should be shown
      expect(screen.getByText('Loading node data...')).toBeInTheDocument();

      // After some time, still loading
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.getByText('Loading node data...')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<NodeInspector selectedNodeId="123:456" />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('does not throw error when receiving message after unmount', () => {
      const { unmount } = render(<NodeInspector selectedNodeId="123:456" />);
      unmount();

      expect(() => {
        const messageEvent = new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'node-data',
              payload: { id: '123:456', name: 'Test', type: 'FRAME', appliedTokens: [] },
            },
          },
        });
        window.dispatchEvent(messageEvent);
      }).not.toThrow();
    });
  });
});
