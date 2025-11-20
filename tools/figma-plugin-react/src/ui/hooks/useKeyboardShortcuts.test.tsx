import React from 'react';
import { render } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

// Test component that uses the hook
function TestComponent({ shortcuts }: { shortcuts: Record<string, () => void> }) {
  useKeyboardShortcuts(shortcuts);
  return <div>Test Component</div>;
}

describe('useKeyboardShortcuts', () => {
  let originalPlatform: string;

  beforeEach(() => {
    originalPlatform = navigator.platform;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  describe('Basic Functionality', () => {
    it('calls handler when single key is pressed', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ escape: handler }} />);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not call handler for unregistered keys', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ escape: handler }} />);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it('calls multiple different handlers for different keys', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      render(
        <TestComponent
          shortcuts={{
            escape: handler1,
            enter: handler2,
          }}
        />
      );

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(escapeEvent);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(enterEvent);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modifier Keys - Mac', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });
    });

    it('handles cmd+key on Mac', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+n': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles cmd+shift+key on Mac', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+shift+s': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        shiftKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles cmd+alt+key on Mac', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+alt+d': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        metaKey: true,
        altKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not trigger when only modifier is pressed', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+n': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'Meta',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Modifier Keys - Windows/Linux', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });
    });

    it('handles ctrl+key on Windows', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'ctrl+n': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles ctrl+shift+key on Windows', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'ctrl+shift+s': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles ctrl+alt+key on Windows', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'ctrl+alt+d': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true,
        altKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('uses cmd modifier on Mac platforms', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+f': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('uses ctrl modifier on Windows platforms', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'ctrl+f': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('uses ctrl modifier on Linux platforms', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        writable: true,
      });

      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'ctrl+f': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Case Insensitivity', () => {
    it('handles uppercase letters', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+n': handler }} />);

      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'N',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('normalizes key to lowercase', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ escape: handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'ESCAPE',
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Prevention', () => {
    it('prevents default when shortcut matches', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+n': handler }} />);

      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
      });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('does not prevent default when shortcut does not match', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+n': handler }} />);

      const event = new KeyboardEvent('keydown', {
        key: 'x',
      });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const handler = jest.fn();
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = render(<TestComponent shortcuts={{ escape: handler }} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('does not call handler after unmount', () => {
      const handler = jest.fn();
      const { unmount } = render(<TestComponent shortcuts={{ escape: handler }} />);

      unmount();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Dynamic Shortcuts', () => {
    it('updates shortcuts when prop changes', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const { rerender } = render(<TestComponent shortcuts={{ escape: handler1 }} />);

      const event1 = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event1);
      expect(handler1).toHaveBeenCalledTimes(1);

      // Update shortcuts
      rerender(<TestComponent shortcuts={{ escape: handler2 }} />);

      const event2 = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event2);

      expect(handler1).toHaveBeenCalledTimes(1); // Not called again
      expect(handler2).toHaveBeenCalledTimes(1); // New handler called
    });

    it('handles empty shortcuts object', () => {
      const { rerender } = render(<TestComponent shortcuts={{ escape: jest.fn() }} />);

      rerender(<TestComponent shortcuts={{}} />);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => window.dispatchEvent(event)).not.toThrow();
    });
  });

  describe('Complex Shortcuts', () => {
    it('handles three modifiers', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+shift+alt+k': handler }} />);

      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        shiftKey: true,
        altKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not trigger when modifier combination is incomplete', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+shift+k': handler }} />);

      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      // Only cmd+k, missing shift
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Special Keys', () => {
    it('handles escape key', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ escape: handler }} />);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles enter key', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ enter: handler }} />);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles space key', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ ' ': handler }} />);

      const event = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles arrow keys', () => {
      const leftHandler = jest.fn();
      const rightHandler = jest.fn();
      render(
        <TestComponent
          shortcuts={{
            arrowleft: leftHandler,
            arrowright: rightHandler,
          }}
        />
      );

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

      expect(leftHandler).toHaveBeenCalledTimes(1);
      expect(rightHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Handlers', () => {
    it('can register many shortcuts at once', () => {
      const handlers = {
        'cmd+n': jest.fn(),
        'cmd+s': jest.fn(),
        'cmd+o': jest.fn(),
        'cmd+p': jest.fn(),
        escape: jest.fn(),
        enter: jest.fn(),
      };

      render(<TestComponent shortcuts={handlers} />);

      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', metaKey: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', metaKey: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(handlers['cmd+n']).toHaveBeenCalledTimes(1);
      expect(handlers['cmd+s']).toHaveBeenCalledTimes(1);
      expect(handlers['escape']).toHaveBeenCalledTimes(1);
      expect(handlers['cmd+o']).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid key presses', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ escape: handler }} />);

      for (let i = 0; i < 10; i++) {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(event);
      }

      expect(handler).toHaveBeenCalledTimes(10);
    });

    it('does not error with undefined handler', () => {
      render(<TestComponent shortcuts={{ escape: undefined as any }} />);

      expect(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        window.dispatchEvent(event);
      }).not.toThrow();
    });

    it('handles numeric keys', () => {
      const handler = jest.fn();
      render(<TestComponent shortcuts={{ 'cmd+1': handler }} />);

      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      const event = new KeyboardEvent('keydown', {
        key: '1',
        metaKey: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
