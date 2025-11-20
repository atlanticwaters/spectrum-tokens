import { StorageProvider } from './StorageProvider';
import type { TokenData } from './IStorageProvider';

export class LocalStorage extends StorageProvider {
  readonly name = 'Local Storage';
  readonly type = 'local';
  readonly canRead = true;
  readonly canWrite = true;

  private readonly storageKey = 'spectrum-tokens';

  async read(): Promise<TokenData> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        throw new Error('No tokens found in local storage');
      }

      const parsed = JSON.parse(stored);
      if (!this.validateTokenData(parsed)) {
        throw new Error('Invalid token data format in storage');
      }

      return parsed;
    } catch (error) {
      this.handleError('read', error);
    }
  }

  async write(data: TokenData): Promise<void> {
    try {
      const json = JSON.stringify(data, null, 2);
      localStorage.setItem(this.storageKey, json);
    } catch (error) {
      this.handleError('write', error);
    }
  }

  isAuthenticated(): boolean {
    return true; // Always available
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  // For testing: get storage key
  getStorageKey(): string {
    return this.storageKey;
  }
}
