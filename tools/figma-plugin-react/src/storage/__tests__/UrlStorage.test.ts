import { UrlStorage } from '../UrlStorage';
import type { TokenData } from '../IStorageProvider';

// Mock global fetch
global.fetch = jest.fn();

describe('UrlStorage', () => {
  let storage: UrlStorage;
  const testUrl = 'https://example.com/tokens.json';

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new UrlStorage({ url: testUrl });
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(storage.name).toBe('URL Storage');
      expect(storage.type).toBe('url');
      expect(storage.canRead).toBe(true);
      expect(storage.canWrite).toBe(false);
    });

    it('should store config', () => {
      expect(storage.getConfig().url).toBe(testUrl);
    });
  });

  describe('read', () => {
    it('should fetch and return token data', async () => {
      const tokenData: TokenData = {
        tokens: {
          color: { primary: '#000' },
        },
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => tokenData,
      });

      const result = await storage.read();
      expect(result).toEqual(tokenData);
      expect(global.fetch).toHaveBeenCalledWith(testUrl);
    });

    it('should throw error for HTTP error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(storage.read()).rejects.toThrow(
        'URL Storage (read): HTTP 404: Not Found'
      );
    });

    it('should throw error for network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(storage.read()).rejects.toThrow(
        'URL Storage (read): Network error'
      );
    });

    it('should throw error for invalid JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(storage.read()).rejects.toThrow('URL Storage (read): Invalid JSON');
    });

    it('should throw error for invalid token data format', async () => {
      const invalidData = { notTokens: 'invalid' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => invalidData,
      });

      await expect(storage.read()).rejects.toThrow(
        'URL Storage (read): Invalid token data format from URL'
      );
    });

    it('should accept token data without metadata', async () => {
      const tokenData = {
        tokens: {
          color: { primary: '#000' },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => tokenData,
      });

      const result = await storage.read();
      expect(result).toEqual(tokenData);
    });

    it('should handle different status codes', async () => {
      const testCases = [
        { status: 401, statusText: 'Unauthorized' },
        { status: 403, statusText: 'Forbidden' },
        { status: 500, statusText: 'Internal Server Error' },
        { status: 503, statusText: 'Service Unavailable' },
      ];

      for (const testCase of testCases) {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: testCase.status,
          statusText: testCase.statusText,
        });

        await expect(storage.read()).rejects.toThrow(
          `URL Storage (read): HTTP ${testCase.status}: ${testCase.statusText}`
        );
      }
    });
  });

  describe('write', () => {
    it('should throw error as URL storage is read-only', async () => {
      const tokenData: TokenData = {
        tokens: { color: { primary: '#000' } },
      };

      await expect(storage.write(tokenData)).rejects.toThrow('URL storage is read-only');
    });
  });

  describe('isAuthenticated', () => {
    it('should always return true', () => {
      expect(storage.isAuthenticated()).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return config object', () => {
      const config = storage.getConfig();
      expect(config).toEqual({ url: testUrl });
    });

    it('should return a new object each time', () => {
      const config1 = storage.getConfig();
      const config2 = storage.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex token data', async () => {
      const complexData: TokenData = {
        tokens: {
          color: {
            primary: '#000',
            secondary: '#fff',
            accent: {
              blue: '#0066cc',
              red: '#cc0000',
            },
          },
          spacing: {
            xs: '4px',
            sm: '8px',
            md: '16px',
            lg: '24px',
            xl: '32px',
          },
          typography: {
            fontFamily: {
              sans: 'Inter, sans-serif',
              mono: 'Fira Code, monospace',
            },
            fontSize: {
              sm: '12px',
              base: '14px',
              lg: '16px',
            },
          },
        },
        metadata: {
          version: '3.0.0',
          lastModified: '2024-01-15T10:30:00Z',
          source: 'design-system',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => complexData,
      });

      const result = await storage.read();
      expect(result).toEqual(complexData);
    });

    it('should handle multiple read operations', async () => {
      const tokenData: TokenData = {
        tokens: { color: { primary: '#000' } },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => tokenData,
      });

      const result1 = await storage.read();
      const result2 = await storage.read();
      const result3 = await storage.read();

      expect(result1).toEqual(tokenData);
      expect(result2).toEqual(tokenData);
      expect(result3).toEqual(tokenData);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
