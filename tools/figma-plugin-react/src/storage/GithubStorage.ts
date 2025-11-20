import { Octokit } from '@octokit/rest';
import { StorageProvider } from './StorageProvider';
import type { TokenData } from './IStorageProvider';

export interface GithubConfig {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  token: string;
}

export class GithubStorage extends StorageProvider {
  readonly name = 'GitHub';
  readonly type = 'github';
  readonly canRead = true;
  readonly canWrite = true;

  private octokit: Octokit;
  private config: GithubConfig;

  constructor(config: GithubConfig) {
    super();
    this.config = {
      ...config,
      branch: config.branch || 'main',
    };
    this.octokit = new Octokit({ auth: config.token });
  }

  async read(): Promise<TokenData> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        ref: this.config.branch,
      });

      if (!('content' in data) || Array.isArray(data)) {
        throw new Error('Path is not a file');
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const parsed = JSON.parse(content);

      if (!this.validateTokenData(parsed)) {
        throw new Error('Invalid token data format');
      }

      return parsed;
    } catch (error) {
      this.handleError('read', error);
    }
  }

  async write(data: TokenData): Promise<void> {
    try {
      // Get current file SHA for update (required by GitHub API)
      let sha: string | undefined;
      try {
        const { data: currentFile } = await this.octokit.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: this.config.path,
          ref: this.config.branch,
        });
        if ('sha' in currentFile) {
          sha = currentFile.sha;
        }
      } catch (error: any) {
        if (error.status !== 404) {
          throw error;
        }
        // File doesn't exist, will create new
      }

      const content = JSON.stringify(data, null, 2);
      const contentBase64 = Buffer.from(content).toString('base64');

      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        message: `Update tokens via Spectrum Figma Plugin`,
        content: contentBase64,
        branch: this.config.branch,
        sha,
      });
    } catch (error) {
      this.handleError('write', error);
    }
  }

  async validateConfig(config: any): Promise<boolean> {
    try {
      const testOctokit = new Octokit({ auth: config.token });
      await testOctokit.repos.get({
        owner: config.owner,
        repo: config.repo,
      });
      return true;
    } catch {
      return false;
    }
  }

  isAuthenticated(): boolean {
    return !!this.config.token;
  }

  async disconnect(): Promise<void> {
    // Clear token (in real implementation, might revoke OAuth token)
    this.config.token = '';
  }

  // Getter methods for testing and configuration access
  getConfig(): Readonly<GithubConfig> {
    return { ...this.config };
  }
}
