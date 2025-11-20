import { IStorageProvider, TokenData } from './IStorageProvider';

export class StorageManager {
  private providers = new Map<string, IStorageProvider>();
  private activeProvider: IStorageProvider | null = null;

  register(provider: IStorageProvider): void {
    this.providers.set(provider.type, provider);
  }

  getProvider(type: string): IStorageProvider | undefined {
    return this.providers.get(type);
  }

  setActiveProvider(type: string): void {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Provider not found: ${type}`);
    }
    this.activeProvider = provider;
  }

  getActiveProvider(): IStorageProvider | null {
    return this.activeProvider;
  }

  async read(): Promise<TokenData> {
    if (!this.activeProvider) {
      throw new Error('No active storage provider');
    }
    return await this.activeProvider.read();
  }

  async write(data: TokenData): Promise<void> {
    if (!this.activeProvider) {
      throw new Error('No active storage provider');
    }
    if (!this.activeProvider.canWrite) {
      throw new Error(`Provider ${this.activeProvider.name} is read-only`);
    }
    return await this.activeProvider.write(data);
  }

  clearActiveProvider(): void {
    this.activeProvider = null;
  }

  getAllProviders(): IStorageProvider[] {
    return Array.from(this.providers.values());
  }
}

export const storageManager = new StorageManager();
