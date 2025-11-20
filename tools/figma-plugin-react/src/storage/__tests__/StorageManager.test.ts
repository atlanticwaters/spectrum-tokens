import { StorageManager } from '../StorageManager';
import { StorageProvider } from '../StorageProvider';
import type { IStorageProvider, TokenData } from '../IStorageProvider';

// Mock storage providers for testing
class MockReadOnlyProvider extends StorageProvider {
  readonly name = 'Mock Read-Only';
  readonly type = 'mock-readonly';
  readonly canRead = true;
  readonly canWrite = false;

  async read(): Promise<TokenData> {
    return {
      tokens: { test: 'readonly' },
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      },
    };
  }

  async write(_data: TokenData): Promise<void> {
    throw new Error('Read-only provider');
  }
}

class MockReadWriteProvider extends StorageProvider {
  readonly name = 'Mock Read-Write';
  readonly type = 'mock-readwrite';
  readonly canRead = true;
  readonly canWrite = true;

  private data: TokenData = {
    tokens: {},
  };

  async read(): Promise<TokenData> {
    return this.data;
  }

  async write(data: TokenData): Promise<void> {
    this.data = data;
  }
}

describe('StorageManager', () => {
  let manager: StorageManager;
  let readOnlyProvider: IStorageProvider;
  let readWriteProvider: IStorageProvider;

  beforeEach(() => {
    manager = new StorageManager();
    readOnlyProvider = new MockReadOnlyProvider();
    readWriteProvider = new MockReadWriteProvider();
  });

  describe('register', () => {
    it('should register a provider', () => {
      manager.register(readOnlyProvider);
      expect(manager.getProvider('mock-readonly')).toBe(readOnlyProvider);
    });

    it('should register multiple providers', () => {
      manager.register(readOnlyProvider);
      manager.register(readWriteProvider);

      expect(manager.getProvider('mock-readonly')).toBe(readOnlyProvider);
      expect(manager.getProvider('mock-readwrite')).toBe(readWriteProvider);
    });

    it('should overwrite provider with same type', () => {
      const provider1 = new MockReadOnlyProvider();
      const provider2 = new MockReadOnlyProvider();

      manager.register(provider1);
      manager.register(provider2);

      expect(manager.getProvider('mock-readonly')).toBe(provider2);
    });
  });

  describe('getProvider', () => {
    it('should return provider by type', () => {
      manager.register(readOnlyProvider);
      expect(manager.getProvider('mock-readonly')).toBe(readOnlyProvider);
    });

    it('should return undefined for unregistered provider', () => {
      expect(manager.getProvider('nonexistent')).toBeUndefined();
    });
  });

  describe('setActiveProvider', () => {
    it('should set active provider by type', () => {
      manager.register(readOnlyProvider);
      manager.setActiveProvider('mock-readonly');
      expect(manager.getActiveProvider()).toBe(readOnlyProvider);
    });

    it('should throw error if provider not found', () => {
      expect(() => {
        manager.setActiveProvider('nonexistent');
      }).toThrow('Provider not found: nonexistent');
    });

    it('should switch between providers', () => {
      manager.register(readOnlyProvider);
      manager.register(readWriteProvider);

      manager.setActiveProvider('mock-readonly');
      expect(manager.getActiveProvider()).toBe(readOnlyProvider);

      manager.setActiveProvider('mock-readwrite');
      expect(manager.getActiveProvider()).toBe(readWriteProvider);
    });
  });

  describe('getActiveProvider', () => {
    it('should return null when no active provider', () => {
      expect(manager.getActiveProvider()).toBeNull();
    });

    it('should return active provider', () => {
      manager.register(readOnlyProvider);
      manager.setActiveProvider('mock-readonly');
      expect(manager.getActiveProvider()).toBe(readOnlyProvider);
    });
  });

  describe('clearActiveProvider', () => {
    it('should clear active provider', () => {
      manager.register(readOnlyProvider);
      manager.setActiveProvider('mock-readonly');
      expect(manager.getActiveProvider()).toBe(readOnlyProvider);

      manager.clearActiveProvider();
      expect(manager.getActiveProvider()).toBeNull();
    });
  });

  describe('getAllProviders', () => {
    it('should return empty array when no providers registered', () => {
      expect(manager.getAllProviders()).toEqual([]);
    });

    it('should return all registered providers', () => {
      manager.register(readOnlyProvider);
      manager.register(readWriteProvider);

      const providers = manager.getAllProviders();
      expect(providers).toHaveLength(2);
      expect(providers).toContain(readOnlyProvider);
      expect(providers).toContain(readWriteProvider);
    });
  });

  describe('read', () => {
    it('should read from active provider', async () => {
      manager.register(readOnlyProvider);
      manager.setActiveProvider('mock-readonly');

      const data = await manager.read();
      expect(data).toHaveProperty('tokens');
      expect(data.tokens).toEqual({ test: 'readonly' });
    });

    it('should throw error when no active provider', async () => {
      await expect(manager.read()).rejects.toThrow('No active storage provider');
    });

    it('should propagate provider read errors', async () => {
      const errorProvider = new MockReadOnlyProvider();
      jest.spyOn(errorProvider, 'read').mockRejectedValue(new Error('Read failed'));

      manager.register(errorProvider);
      manager.setActiveProvider('mock-readonly');

      await expect(manager.read()).rejects.toThrow('Read failed');
    });
  });

  describe('write', () => {
    it('should write to active provider', async () => {
      manager.register(readWriteProvider);
      manager.setActiveProvider('mock-readwrite');

      const data: TokenData = {
        tokens: { color: { primary: '#000' } },
      };

      await manager.write(data);
      const readData = await manager.read();
      expect(readData).toEqual(data);
    });

    it('should throw error when no active provider', async () => {
      const data: TokenData = { tokens: {} };
      await expect(manager.write(data)).rejects.toThrow('No active storage provider');
    });

    it('should throw error for read-only provider', async () => {
      manager.register(readOnlyProvider);
      manager.setActiveProvider('mock-readonly');

      const data: TokenData = { tokens: {} };
      await expect(manager.write(data)).rejects.toThrow(
        'Provider Mock Read-Only is read-only'
      );
    });

    it('should propagate provider write errors', async () => {
      const errorProvider = new MockReadWriteProvider();
      jest.spyOn(errorProvider, 'write').mockRejectedValue(new Error('Write failed'));

      manager.register(errorProvider);
      manager.setActiveProvider('mock-readwrite');

      const data: TokenData = { tokens: {} };
      await expect(manager.write(data)).rejects.toThrow('Write failed');
    });
  });

  describe('integration', () => {
    it('should support complete workflow', async () => {
      // Register providers
      manager.register(readOnlyProvider);
      manager.register(readWriteProvider);

      // Set active provider
      manager.setActiveProvider('mock-readwrite');

      // Write data
      const testData: TokenData = {
        tokens: {
          color: { primary: '#000', secondary: '#fff' },
          spacing: { small: '8px', large: '16px' },
        },
        metadata: {
          version: '2.0.0',
          lastModified: '2024-01-01T00:00:00Z',
          source: 'test',
        },
      };

      await manager.write(testData);

      // Read data
      const readData = await manager.read();
      expect(readData).toEqual(testData);

      // Switch provider
      manager.setActiveProvider('mock-readonly');
      const readOnlyData = await manager.read();
      expect(readOnlyData.tokens).toEqual({ test: 'readonly' });

      // Clear active provider
      manager.clearActiveProvider();
      expect(manager.getActiveProvider()).toBeNull();
    });
  });
});
