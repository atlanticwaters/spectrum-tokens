import { AppDispatch } from '../store';
import { storageManager } from '../../storage/StorageManager';
import { GithubStorage } from '../../storage/GithubStorage';
import { LocalStorage } from '../../storage/LocalStorage';
import { UrlStorage } from '../../storage/UrlStorage';
import {
  setSyncStatus,
  setSyncSuccess,
  setSyncError,
  setConnected,
  setStorageConfig,
} from '../store/slices/storageSlice';

export function initializeStorageProvider(type: string, config: any) {
  return async (dispatch: AppDispatch) => {
    try {
      let provider;

      switch (type) {
        case 'github':
          provider = new GithubStorage(config);
          break;
        case 'local':
          provider = new LocalStorage();
          break;
        case 'url':
          provider = new UrlStorage(config);
          break;
        default:
          throw new Error(`Unknown storage type: ${type}`);
      }

      storageManager.register(provider);
      storageManager.setActiveProvider(type);

      // Save config
      dispatch(setStorageConfig(config));
      dispatch(setConnected(true));
    } catch (error) {
      dispatch(setConnected(false));
      dispatch(
        setSyncError(error instanceof Error ? error.message : 'Failed to initialize storage')
      );
      throw error;
    }
  };
}

export function pullTokens() {
  return async (dispatch: AppDispatch) => {
    dispatch(setSyncStatus('syncing'));

    try {
      const data = await storageManager.read();

      // TODO: Update tokens in collections slice
      // For now, just mark as successful
      dispatch(setSyncSuccess());

      return data;
    } catch (error) {
      dispatch(setSyncError(error instanceof Error ? error.message : 'Failed to pull tokens'));
      throw error;
    }
  };
}

export function pushTokens(tokenData: any) {
  return async (dispatch: AppDispatch) => {
    dispatch(setSyncStatus('syncing'));

    try {
      await storageManager.write(tokenData);
      dispatch(setSyncSuccess());
    } catch (error) {
      dispatch(setSyncError(error instanceof Error ? error.message : 'Failed to push tokens'));
      throw error;
    }
  };
}
