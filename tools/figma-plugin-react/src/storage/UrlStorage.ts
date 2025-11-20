import { StorageProvider } from './StorageProvider';
import type { TokenData } from './IStorageProvider';

export interface UrlConfig {
  url: string;
}

export class UrlStorage extends StorageProvider {
  readonly name = 'URL Storage';
  readonly type = 'url';
  readonly canRead = true;
  readonly canWrite = false;

  private config: UrlConfig;

  constructor(config: UrlConfig) {
    super();
    this.config = config;
  }

  async read(): Promise<TokenData> {
    try {
      const response = await fetch(this.config.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!this.validateTokenData(data)) {
        throw new Error('Invalid token data format from URL');
      }

      return data;
    } catch (error) {
      this.handleError('read', error);
    }
  }

  async write(_data: TokenData): Promise<void> {
    throw new Error('URL storage is read-only');
  }

  isAuthenticated(): boolean {
    return true;
  }

  getConfig(): Readonly<UrlConfig> {
    return { ...this.config };
  }
}
