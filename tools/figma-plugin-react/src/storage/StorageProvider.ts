import { IStorageProvider, TokenData } from './IStorageProvider';

export abstract class StorageProvider implements IStorageProvider {
  abstract readonly name: string;
  abstract readonly type: string;
  abstract readonly canRead: boolean;
  abstract readonly canWrite: boolean;

  abstract read(): Promise<TokenData>;
  abstract write(data: TokenData): Promise<void>;

  protected handleError(context: string, error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const fullMessage = `${this.name} (${context}): ${message}`;
    console.error(fullMessage, error);
    throw new Error(fullMessage);
  }

  protected validateTokenData(data: any): data is TokenData {
    return (
      data !== null &&
      typeof data === 'object' &&
      'tokens' in data &&
      typeof data.tokens === 'object'
    );
  }
}
