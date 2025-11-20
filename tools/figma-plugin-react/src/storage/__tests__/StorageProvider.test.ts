import { StorageProvider } from '../StorageProvider';
import type { TokenData } from '../IStorageProvider';

// Create a concrete implementation for testing
class TestStorageProvider extends StorageProvider {
  readonly name = 'Test Storage';
  readonly type = 'test';
  readonly canRead = true;
  readonly canWrite = true;

  async read(): Promise<TokenData> {
    return {
      tokens: { test: 'value' },
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      },
    };
  }

  async write(_data: TokenData): Promise<void> {
    // Mock implementation
  }

  // Expose protected methods for testing
  public testHandleError(context: string, error: unknown): never {
    return this.handleError(context, error);
  }

  public testValidateTokenData(data: any): data is TokenData {
    return this.validateTokenData(data);
  }
}

describe('StorageProvider', () => {
  let provider: TestStorageProvider;

  beforeEach(() => {
    provider = new TestStorageProvider();
  });

  describe('validateTokenData', () => {
    it('should return true for valid token data', () => {
      const validData = {
        tokens: { color: { primary: '#000' } },
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01T00:00:00Z',
        },
      };

      expect(provider.testValidateTokenData(validData)).toBe(true);
    });

    it('should return true for token data without metadata', () => {
      const validData = {
        tokens: { color: { primary: '#000' } },
      };

      expect(provider.testValidateTokenData(validData)).toBe(true);
    });

    it('should return false for null', () => {
      expect(provider.testValidateTokenData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(provider.testValidateTokenData(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(provider.testValidateTokenData('string')).toBe(false);
      expect(provider.testValidateTokenData(123)).toBe(false);
      expect(provider.testValidateTokenData(true)).toBe(false);
    });

    it('should return false for object without tokens property', () => {
      const invalidData = {
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01T00:00:00Z',
        },
      };

      expect(provider.testValidateTokenData(invalidData)).toBe(false);
    });

    it('should return false for object with non-object tokens', () => {
      const invalidData = {
        tokens: 'not an object',
      };

      expect(provider.testValidateTokenData(invalidData)).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should throw error with formatted message for Error instance', () => {
      const error = new Error('Something went wrong');

      expect(() => {
        provider.testHandleError('read', error);
      }).toThrow('Test Storage (read): Something went wrong');
    });

    it('should throw error with unknown error message for non-Error', () => {
      expect(() => {
        provider.testHandleError('write', 'string error');
      }).toThrow('Test Storage (write): Unknown error');
    });

    it('should log the error to console', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      try {
        provider.testHandleError('test', error);
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Test Storage (test): Test error',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('abstract methods', () => {
    it('should have required properties', () => {
      expect(provider.name).toBe('Test Storage');
      expect(provider.type).toBe('test');
      expect(provider.canRead).toBe(true);
      expect(provider.canWrite).toBe(true);
    });

    it('should implement read method', async () => {
      const data = await provider.read();
      expect(data).toHaveProperty('tokens');
      expect(data).toHaveProperty('metadata');
    });

    it('should implement write method', async () => {
      const data: TokenData = {
        tokens: { test: 'value' },
      };

      await expect(provider.write(data)).resolves.toBeUndefined();
    });
  });
});
