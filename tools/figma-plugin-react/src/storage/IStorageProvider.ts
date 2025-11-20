export interface TokenData {
  tokens: Record<string, any>;
  metadata?: {
    version: string;
    lastModified: string;
    source?: string;
  };
}

export interface StorageConfig {
  type: 'github' | 'local' | 'url';
  [key: string]: any; // Provider-specific config
}

export interface IStorageProvider {
  readonly name: string;
  readonly type: string;
  readonly canRead: boolean;
  readonly canWrite: boolean;

  // Core operations
  read(): Promise<TokenData>;
  write(data: TokenData): Promise<void>;

  // Authentication (optional)
  authenticate?(): Promise<void>;
  isAuthenticated?(): boolean;
  disconnect?(): Promise<void>;

  // Validation
  validateConfig?(config: any): Promise<boolean>;
}
