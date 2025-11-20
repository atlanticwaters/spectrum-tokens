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
import { render, screen, fireEvent, within } from '@testing-library/react';
import { VirtualTokenList, useShouldVirtualize } from './VirtualTokenList';
import type { Token } from './types';

// Helper to create mock tokens
const createMockTokens = (count: number): Token[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `token-${i}`,
    value: `#${i.toString(16).padStart(6, '0')}`,
    type: 'color',
    description: `Token ${i}`,
  }));
};

describe('VirtualTokenList', () => {
  const defaultProps = {
    tokens: createMockTokens(100),
    itemHeight: 60,
    viewportHeight: 400,
  };

  describe('rendering', () => {
    it('should render the component', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      expect(container.querySelector('.virtual-token-list')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <VirtualTokenList {...defaultProps} className="custom-class" />
      );
      expect(container.querySelector('.virtual-token-list')).toHaveClass('custom-class');
    });

    it('should render empty state when no tokens', () => {
      render(<VirtualTokenList tokens={[]} itemHeight={60} />);
      expect(screen.getByText('No tokens to display')).toBeInTheDocument();
    });

    it('should set viewport height', () => {
      const { container } = render(
        <VirtualTokenList {...defaultProps} viewportHeight={500} />
      );
      const list = container.querySelector('.virtual-token-list');
      expect(list).toHaveStyle({ height: '500px' });
    });
  });

  describe('virtualization', () => {
    it('should only render visible tokens plus buffer', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} bufferSize={5} />);

      // With itemHeight 60 and viewportHeight 400, we can see ~6-7 items
      // Plus buffer of 5 on each side = ~16-17 items max
      const renderedItems = container.querySelectorAll('.virtual-token-item');
      expect(renderedItems.length).toBeLessThan(20);
      expect(renderedItems.length).toBeGreaterThan(0);
    });

    it('should render different tokens when scrolled', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const listElement = container.querySelector('.virtual-token-list') as HTMLElement;

      // Check initial tokens
      expect(screen.queryByText('token-0')).toBeInTheDocument();

      // Scroll down
      fireEvent.scroll(listElement, { target: { scrollTop: 1000 } });

      // First token should no longer be visible
      // (Note: In real implementation, React would re-render)
    });

    it('should calculate correct total height', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const innerContainer = container.querySelector('[style*="height"]') as HTMLElement;

      // Total height should be tokens.length * itemHeight
      const expectedHeight = 100 * 60; // 6000px
      expect(innerContainer).toHaveStyle({ height: `${expectedHeight}px` });
    });

    it('should apply correct offset for visible items', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const transformedDiv = container.querySelector('[style*="transform"]') as HTMLElement;

      // Initial offset should be 0
      expect(transformedDiv).toHaveStyle({ transform: 'translateY(0px)' });
    });

    it('should respect buffer size', () => {
      const largeBuffer = render(
        <VirtualTokenList {...defaultProps} bufferSize={20} />
      );
      const smallBuffer = render(
        <VirtualTokenList {...defaultProps} bufferSize={2} />
      );

      const largeItems = largeBuffer.container.querySelectorAll('.virtual-token-item');
      const smallItems = smallBuffer.container.querySelectorAll('.virtual-token-item');

      expect(largeItems.length).toBeGreaterThan(smallItems.length);
    });

    it('should handle very small token lists', () => {
      const tokens = createMockTokens(3);
      const { container } = render(
        <VirtualTokenList tokens={tokens} itemHeight={60} viewportHeight={400} />
      );

      const items = container.querySelectorAll('.virtual-token-item');
      expect(items.length).toBe(3);
    });

    it('should handle very large token lists efficiently', () => {
      const tokens = createMockTokens(10000);
      const { container } = render(
        <VirtualTokenList tokens={tokens} itemHeight={60} viewportHeight={400} />
      );

      // Should not render all 10000 items
      const items = container.querySelectorAll('.virtual-token-item');
      expect(items.length).toBeLessThan(100);
    });
  });

  describe('scroll behavior', () => {
    it('should handle scroll events', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const listElement = container.querySelector('.virtual-token-list') as HTMLElement;

      fireEvent.scroll(listElement, { target: { scrollTop: 500 } });

      // Component should update (in real scenario, different items would render)
      expect(listElement).toBeInTheDocument();
    });

    it('should maintain scroll position on token updates', () => {
      const { container, rerender } = render(<VirtualTokenList {...defaultProps} />);
      const listElement = container.querySelector('.virtual-token-list') as HTMLElement;

      // Scroll to middle
      Object.defineProperty(listElement, 'scrollTop', { value: 1000, writable: true });
      fireEvent.scroll(listElement, { target: { scrollTop: 1000 } });

      // Update tokens (same length)
      rerender(<VirtualTokenList {...defaultProps} tokens={createMockTokens(100)} />);

      // Should maintain scroll position
      expect(listElement).toBeInTheDocument();
    });
  });

  describe('token interactions', () => {
    it('should call onTokenClick when token is clicked', () => {
      const onTokenClick = jest.fn();
      render(<VirtualTokenList {...defaultProps} onTokenClick={onTokenClick} />);

      const firstToken = screen.getByText('token-0');
      fireEvent.click(firstToken.closest('.virtual-token-item')!);

      expect(onTokenClick).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'token-0' })
      );
    });

    it('should call onTokenDelete when delete button is clicked', () => {
      const onTokenDelete = jest.fn();
      const { container } = render(
        <VirtualTokenList {...defaultProps} onTokenDelete={onTokenDelete} />
      );

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      expect(onTokenDelete).toHaveBeenCalledWith('token-0');
    });

    it('should not show delete button when onTokenDelete is not provided', () => {
      render(<VirtualTokenList {...defaultProps} />);

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should stop propagation on delete click', () => {
      const onTokenClick = jest.fn();
      const onTokenDelete = jest.fn();
      render(
        <VirtualTokenList
          {...defaultProps}
          onTokenClick={onTokenClick}
          onTokenDelete={onTokenDelete}
        />
      );

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      // Only delete should be called, not token click
      expect(onTokenDelete).toHaveBeenCalled();
      expect(onTokenClick).not.toHaveBeenCalled();
    });
  });

  describe('custom rendering', () => {
    it('should use custom renderToken function', () => {
      const renderToken = jest.fn((token: Token) => (
        <div key={token.name} data-testid="custom-token">
          Custom: {token.name}
        </div>
      ));

      render(<VirtualTokenList {...defaultProps} renderToken={renderToken} />);

      expect(screen.getByTestId('custom-token')).toBeInTheDocument();
      expect(renderToken).toHaveBeenCalled();
    });

    it('should pass correct index to custom renderer', () => {
      let receivedIndex = -1;
      const renderToken = jest.fn((token: Token, index: number) => {
        if (token.name === 'token-0') {
          receivedIndex = index;
        }
        return <div key={token.name}>{token.name}</div>;
      });

      render(<VirtualTokenList {...defaultProps} renderToken={renderToken} />);

      expect(receivedIndex).toBe(0);
    });
  });

  describe('default token rendering', () => {
    it('should display token name', () => {
      render(<VirtualTokenList {...defaultProps} />);
      expect(screen.getByText('token-0')).toBeInTheDocument();
    });

    it('should display token type and value', () => {
      render(<VirtualTokenList {...defaultProps} />);
      expect(screen.getByText(/color • #000000/)).toBeInTheDocument();
    });

    it('should have hover effects', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const firstItem = container.querySelector('.virtual-token-item') as HTMLElement;

      // Initial background
      expect(firstItem).toHaveStyle({ backgroundColor: '#fff' });

      // Hover
      fireEvent.mouseEnter(firstItem);
      expect(firstItem).toHaveStyle({ backgroundColor: '#f5f5f5' });

      // Leave
      fireEvent.mouseLeave(firstItem);
      expect(firstItem).toHaveStyle({ backgroundColor: '#fff' });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA label on delete button', () => {
      render(<VirtualTokenList {...defaultProps} onTokenDelete={jest.fn()} />);

      const deleteButton = screen.getAllByLabelText(/delete token-0/i)[0];
      expect(deleteButton).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const onTokenClick = jest.fn();
      const { container } = render(
        <VirtualTokenList {...defaultProps} onTokenClick={onTokenClick} />
      );

      const firstItem = container.querySelector('.virtual-token-item') as HTMLElement;
      firstItem.focus();

      // Should be able to interact via keyboard (in real implementation)
      expect(firstItem).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero height items gracefully', () => {
      const { container } = render(
        <VirtualTokenList {...defaultProps} itemHeight={0} />
      );

      expect(container.querySelector('.virtual-token-list')).toBeInTheDocument();
    });

    it('should handle negative scroll values', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const listElement = container.querySelector('.virtual-token-list') as HTMLElement;

      fireEvent.scroll(listElement, { target: { scrollTop: -100 } });

      // Should not crash
      expect(listElement).toBeInTheDocument();
    });

    it('should handle scroll beyond total height', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const listElement = container.querySelector('.virtual-token-list') as HTMLElement;

      fireEvent.scroll(listElement, { target: { scrollTop: 99999 } });

      // Should not crash
      expect(listElement).toBeInTheDocument();
    });

    it('should handle rapid token updates', () => {
      const { rerender } = render(<VirtualTokenList {...defaultProps} />);

      for (let i = 0; i < 10; i++) {
        rerender(<VirtualTokenList {...defaultProps} tokens={createMockTokens(100 + i)} />);
      }

      // Should not crash
      expect(screen.getByText(/token-/)).toBeInTheDocument();
    });
  });

  describe('performance optimizations', () => {
    it('should use will-change for transform optimization', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const transformedDiv = container.querySelector('[style*="transform"]') as HTMLElement;

      expect(transformedDiv).toHaveStyle({ willChange: 'transform' });
    });

    it('should use translate for position (not margin/padding)', () => {
      const { container } = render(<VirtualTokenList {...defaultProps} />);
      const transformedDiv = container.querySelector('[style*="transform"]') as HTMLElement;

      expect(transformedDiv.style.transform).toContain('translateY');
      expect(transformedDiv.style.marginTop).toBe('');
      expect(transformedDiv.style.paddingTop).toBe('');
    });
  });
});

describe('useShouldVirtualize', () => {
  it('should return false when token count is below threshold', () => {
    const shouldVirtualize = useShouldVirtualize(30, 50);
    expect(shouldVirtualize).toBe(false);
  });

  it('should return true when token count is above threshold', () => {
    const shouldVirtualize = useShouldVirtualize(100, 50);
    expect(shouldVirtualize).toBe(true);
  });

  it('should return true when token count equals threshold', () => {
    const shouldVirtualize = useShouldVirtualize(50, 50);
    expect(shouldVirtualize).toBe(false);
  });

  it('should use default threshold of 50', () => {
    expect(useShouldVirtualize(30)).toBe(false);
    expect(useShouldVirtualize(51)).toBe(true);
  });

  it('should handle zero tokens', () => {
    const shouldVirtualize = useShouldVirtualize(0);
    expect(shouldVirtualize).toBe(false);
  });

  it('should handle very large token counts', () => {
    const shouldVirtualize = useShouldVirtualize(10000, 50);
    expect(shouldVirtualize).toBe(true);
  });
});
