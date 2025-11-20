import { LocalStorage } from '../LocalStorage';
import type { TokenData } from '../IStorageProvider';

describe('LocalStorage', () => {
  let storage: LocalStorage;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    storage = new LocalStorage();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(storage.name).toBe('Local Storage');
      expect(storage.type).toBe('local');
      expect(storage.canRead).toBe(true);
      expect(storage.canWrite).toBe(true);
    });
  });

  describe('read', () => {
    it('should read token data from localStorage', async () => {
      const tokenData: TokenData = {
        tokens: {
          color: { primary: '#000' },
        },
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01T00:00:00Z',
        },
      };

      localStorage.setItem('spectrum-tokens', JSON.stringify(tokenData));

      const result = await storage.read();
      expect(result).toEqual(tokenData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('spectrum-tokens');
    });

    it('should throw error when no data in localStorage', async () => {
      await expect(storage.read()).rejects.toThrow(
        'Local Storage (read): No tokens found in local storage'
      );
    });

    it('should throw error for invalid JSON', async () => {
      localStorage.setItem('spectrum-tokens', 'invalid json');

      await expect(storage.read()).rejects.toThrow('Local Storage (read):');
    });

    it('should throw error for invalid token data format', async () => {
      const invalidData = { notTokens: 'invalid' };
      localStorage.setItem('spectrum-tokens', JSON.stringify(invalidData));

      await expect(storage.read()).rejects.toThrow(
        'Local Storage (read): Invalid token data format in storage'
      );
    });

    it('should accept token data without metadata', async () => {
      const tokenData = {
        tokens: {
          color: { primary: '#000' },
        },
      };

      localStorage.setItem('spectrum-tokens', JSON.stringify(tokenData));

      const result = await storage.read();
      expect(result).toEqual(tokenData);
    });
  });

  describe('write', () => {
    it('should write token data to localStorage', async () => {
      const tokenData: TokenData = {
        tokens: {
          color: { primary: '#000' },
        },
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01T00:00:00Z',
        },
      };

      await storage.write(tokenData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'spectrum-tokens',
        JSON.stringify(tokenData, null, 2)
      );

      const stored = localStorage.getItem('spectrum-tokens');
      expect(JSON.parse(stored!)).toEqual(tokenData);
    });

    it('should format JSON with 2-space indentation', async () => {
      const tokenData: TokenData = {
        tokens: { color: { primary: '#000' } },
      };

      await storage.write(tokenData);

      const stored = localStorage.getItem('spectrum-tokens');
      expect(stored).toContain('\n  ');
    });

    it('should handle write errors', async () => {
      const tokenData: TokenData = { tokens: {} };

      // Mock localStorage.setItem to throw error
      (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      await expect(storage.write(tokenData)).rejects.toThrow(
        'Local Storage (write): Quota exceeded'
      );
    });
  });

  describe('clear', () => {
    it('should clear token data from localStorage', async () => {
      const tokenData: TokenData = {
        tokens: { color: { primary: '#000' } },
      };

      await storage.write(tokenData);
      expect(localStorage.getItem('spectrum-tokens')).toBeTruthy();

      await storage.clear();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('spectrum-tokens');
      expect(localStorage.getItem('spectrum-tokens')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should always return true', () => {
      expect(storage.isAuthenticated()).toBe(true);
    });
  });

  describe('getStorageKey', () => {
    it('should return the storage key', () => {
      expect(storage.getStorageKey()).toBe('spectrum-tokens');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete read-write-clear cycle', async () => {
      const tokenData: TokenData = {
        tokens: {
          color: { primary: '#000', secondary: '#fff' },
          spacing: { small: '8px', large: '16px' },
        },
        metadata: {
          version: '2.0.0',
          lastModified: '2024-01-02T00:00:00Z',
          source: 'figma',
        },
      };

      // Write
      await storage.write(tokenData);

      // Read
      const readData = await storage.read();
      expect(readData).toEqual(tokenData);

      // Clear
      await storage.clear();
      await expect(storage.read()).rejects.toThrow('No tokens found');
    });

    it('should handle multiple writes', async () => {
      const data1: TokenData = {
        tokens: { color: { primary: '#000' } },
      };

      const data2: TokenData = {
        tokens: { color: { primary: '#fff', secondary: '#000' } },
      };

      await storage.write(data1);
      let result = await storage.read();
      expect(result).toEqual(data1);

      await storage.write(data2);
      result = await storage.read();
      expect(result).toEqual(data2);
    });
  });
});
