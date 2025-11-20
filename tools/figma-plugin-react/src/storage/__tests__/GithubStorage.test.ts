// Mock @octokit/rest BEFORE any imports
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn(),
  };
});

import { GithubStorage } from '../GithubStorage';
import type { GithubConfig } from '../GithubStorage';
import type { TokenData } from '../IStorageProvider';
import { Octokit } from '@octokit/rest';

const MockedOctokit = Octokit as jest.MockedClass<typeof Octokit>;

describe('GithubStorage', () => {
  let storage: GithubStorage;
  let mockGetContent: jest.Mock;
  let mockCreateOrUpdateFileContents: jest.Mock;
  let mockGet: jest.Mock;
  let config: GithubConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      owner: 'test-owner',
      repo: 'test-repo',
      path: 'tokens.json',
      branch: 'main',
      token: 'test-token',
    };

    // Create mock functions
    mockGetContent = jest.fn();
    mockCreateOrUpdateFileContents = jest.fn();
    mockGet = jest.fn();

    // Create mock Octokit instance
    MockedOctokit.mockImplementation(
      () =>
        ({
          repos: {
            getContent: mockGetContent,
            createOrUpdateFileContents: mockCreateOrUpdateFileContents,
            get: mockGet,
          },
        }) as any
    );

    storage = new GithubStorage(config);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(storage.name).toBe('GitHub');
      expect(storage.type).toBe('github');
      expect(storage.canRead).toBe(true);
      expect(storage.canWrite).toBe(true);
    });

    it('should use default branch when not provided', () => {
      const configWithoutBranch = {
        owner: 'owner',
        repo: 'repo',
        path: 'tokens.json',
        token: 'token',
      };

      const storageWithDefaultBranch = new GithubStorage(configWithoutBranch);
      expect(storageWithDefaultBranch.getConfig().branch).toBe('main');
    });

    it('should use provided branch', () => {
      expect(storage.getConfig().branch).toBe('main');
    });

    it('should create Octokit instance with token', () => {
      expect(MockedOctokit).toHaveBeenCalledWith({ auth: 'test-token' });
    });
  });

  describe('read', () => {
    it('should successfully read token data', async () => {
      const tokenData: TokenData = {
        tokens: {
          color: { primary: '#000' },
        },
        metadata: {
          version: '1.0.0',
          lastModified: '2024-01-01T00:00:00Z',
        },
      };

      const content = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      mockGetContent.mockResolvedValue({
        data: {
          content,
          sha: 'test-sha',
          encoding: 'base64',
        },
      } as any);

      const result = await storage.read();
      expect(result).toEqual(tokenData);
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'tokens.json',
        ref: 'main',
      });
    });

    it('should throw error if path is a directory', async () => {
      mockGetContent.mockResolvedValue({
        data: [{ name: 'file1.json' }, { name: 'file2.json' }],
      } as any);

      await expect(storage.read()).rejects.toThrow('GitHub (read): Path is not a file');
    });

    it('should throw error if content is not valid JSON', async () => {
      const content = Buffer.from('invalid json').toString('base64');

      mockGetContent.mockResolvedValue({
        data: {
          content,
          sha: 'test-sha',
          encoding: 'base64',
        },
      } as any);

      await expect(storage.read()).rejects.toThrow('GitHub (read):');
    });

    it('should throw error if token data is invalid format', async () => {
      const invalidData = { notTokens: 'invalid' };
      const content = Buffer.from(JSON.stringify(invalidData)).toString('base64');

      mockGetContent.mockResolvedValue({
        data: {
          content,
          sha: 'test-sha',
          encoding: 'base64',
        },
      } as any);

      await expect(storage.read()).rejects.toThrow(
        'GitHub (read): Invalid token data format'
      );
    });

    it('should handle network errors', async () => {
      mockGetContent.mockRejectedValue(new Error('Network error'));

      await expect(storage.read()).rejects.toThrow('GitHub (read): Network error');
    });

    it('should handle 404 errors', async () => {
      const error: any = new Error('Not Found');
      error.status = 404;
      mockGetContent.mockRejectedValue(error);

      await expect(storage.read()).rejects.toThrow('GitHub (read): Not Found');
    });

    it('should accept token data without metadata', async () => {
      const tokenData = {
        tokens: {
          color: { primary: '#000' },
        },
      };

      const content = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      mockGetContent.mockResolvedValue({
        data: {
          content,
          sha: 'test-sha',
          encoding: 'base64',
        },
      } as any);

      const result = await storage.read();
      expect(result).toEqual(tokenData);
    });
  });

  describe('write', () => {
    const tokenData: TokenData = {
      tokens: {
        color: { primary: '#000' },
      },
      metadata: {
        version: '1.0.0',
        lastModified: '2024-01-01T00:00:00Z',
      },
    };

    it('should create new file when file does not exist', async () => {
      const error: any = new Error('Not Found');
      error.status = 404;
      mockGetContent.mockRejectedValue(error);
      mockCreateOrUpdateFileContents.mockResolvedValue({} as any);

      await storage.write(tokenData);

      const expectedContent = Buffer.from(JSON.stringify(tokenData, null, 2)).toString(
        'base64'
      );

      expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'tokens.json',
        message: 'Update tokens via Spectrum Figma Plugin',
        content: expectedContent,
        branch: 'main',
        sha: undefined,
      });
    });

    it('should update existing file with SHA', async () => {
      mockGetContent.mockResolvedValue({
        data: {
          sha: 'existing-sha',
          content: Buffer.from('{}').toString('base64'),
        },
      } as any);

      mockCreateOrUpdateFileContents.mockResolvedValue({} as any);

      await storage.write(tokenData);

      const expectedContent = Buffer.from(JSON.stringify(tokenData, null, 2)).toString(
        'base64'
      );

      expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'tokens.json',
        message: 'Update tokens via Spectrum Figma Plugin',
        content: expectedContent,
        branch: 'main',
        sha: 'existing-sha',
      });
    });

    it('should handle write errors', async () => {
      const error: any = new Error('Not Found');
      error.status = 404;
      mockGetContent.mockRejectedValue(error);

      mockCreateOrUpdateFileContents.mockRejectedValue(
        new Error('Permission denied')
      );

      await expect(storage.write(tokenData)).rejects.toThrow(
        'GitHub (write): Permission denied'
      );
    });

    it('should propagate non-404 errors from getContent', async () => {
      const error: any = new Error('Server error');
      error.status = 500;
      mockGetContent.mockRejectedValue(error);

      await expect(storage.write(tokenData)).rejects.toThrow(
        'GitHub (write): Server error'
      );
    });

    it('should format JSON with 2-space indentation', async () => {
      const error: any = new Error('Not Found');
      error.status = 404;
      mockGetContent.mockRejectedValue(error);
      mockCreateOrUpdateFileContents.mockResolvedValue({} as any);

      await storage.write(tokenData);

      const calls = mockCreateOrUpdateFileContents.mock.calls;
      const content = Buffer.from(calls[0][0].content, 'base64').toString('utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toEqual(tokenData);
      expect(content).toContain('\n  '); // Check for indentation
    });
  });

  describe('validateConfig', () => {
    it('should return true for valid config', async () => {
      mockGet.mockResolvedValue({} as any);

      const result = await storage.validateConfig({
        owner: 'owner',
        repo: 'repo',
        token: 'token',
      });

      expect(result).toBe(true);
      expect(MockedOctokit).toHaveBeenLastCalledWith({ auth: 'token' });
    });

    it('should return false for invalid config', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      const result = await storage.validateConfig({
        owner: 'owner',
        repo: 'invalid',
        token: 'token',
      });

      expect(result).toBe(false);
    });

    it('should handle authentication errors', async () => {
      const error: any = new Error('Unauthorized');
      error.status = 401;
      mockGet.mockRejectedValue(error);

      const result = await storage.validateConfig({
        owner: 'owner',
        repo: 'repo',
        token: 'invalid-token',
      });

      expect(result).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token is present', () => {
      expect(storage.isAuthenticated()).toBe(true);
    });

    it('should return false when token is empty', () => {
      const storageWithoutToken = new GithubStorage({
        owner: 'owner',
        repo: 'repo',
        path: 'tokens.json',
        token: '',
      });

      expect(storageWithoutToken.isAuthenticated()).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should clear token', async () => {
      expect(storage.isAuthenticated()).toBe(true);

      await storage.disconnect();

      expect(storage.getConfig().token).toBe('');
      expect(storage.isAuthenticated()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return config object', () => {
      const returnedConfig = storage.getConfig();

      expect(returnedConfig).toEqual({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'tokens.json',
        branch: 'main',
        token: 'test-token',
      });
    });

    it('should return a new object each time', () => {
      const returnedConfig1 = storage.getConfig();
      const returnedConfig2 = storage.getConfig();

      expect(returnedConfig1).toEqual(returnedConfig2);
      expect(returnedConfig1).not.toBe(returnedConfig2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete read-write cycle', async () => {
      // Initial read (file exists)
      const initialData: TokenData = {
        tokens: { color: { primary: '#000' } },
        metadata: { version: '1.0.0', lastModified: '2024-01-01T00:00:00Z' },
      };

      mockGetContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(initialData)).toString('base64'),
          sha: 'sha-1',
        },
      } as any);

      const readData = await storage.read();
      expect(readData).toEqual(initialData);

      // Write updated data
      const updatedData: TokenData = {
        tokens: { color: { primary: '#fff', secondary: '#000' } },
        metadata: { version: '2.0.0', lastModified: '2024-01-02T00:00:00Z' },
      };

      mockCreateOrUpdateFileContents.mockResolvedValue({} as any);

      await storage.write(updatedData);

      expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith(
        expect.objectContaining({
          sha: 'sha-1',
        })
      );
    });

    it('should handle different branches', async () => {
      const devBranchStorage = new GithubStorage({
        ...config,
        branch: 'develop',
      });

      const tokenData: TokenData = {
        tokens: { test: 'value' },
      };

      mockGetContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(tokenData)).toString('base64'),
          sha: 'test-sha',
        },
      } as any);

      await devBranchStorage.read();

      expect(mockGetContent).toHaveBeenCalledWith(
        expect.objectContaining({
          ref: 'develop',
        })
      );
    });
  });
});
