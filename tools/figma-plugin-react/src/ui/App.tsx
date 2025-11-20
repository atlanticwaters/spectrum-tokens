import React, { useEffect, useState } from 'react';
import type { PluginMessage, PluginResponse, ExportSettings as ExportSettingsType } from '../shared/types';
import { DEFAULT_EXPORT_SETTINGS } from '../shared/types';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setLoading, setError } from './store/slices/uiSlice';
import { setCollections } from './store/slices/collectionsSlice';
import { StorageSelector } from './components/storage/StorageSelector';
import { GithubConfigModal, GithubConfigData } from './components/storage/GithubConfigModal';
import { SyncPanel } from './components/storage/SyncPanel';
import { TokenEditor } from './components/tokens/TokenEditor';
import { FindReplace } from './components/operations/FindReplace';
import { NodeInspector } from './components/nodes/NodeInspector';
import { ToastContainer } from './components/feedback/ToastContainer';
import { LoadingOverlay } from './components/feedback/LoadingOverlay';
import { HistoryButtons } from './components/toolbar/HistoryButtons';
import { ExportSettings } from './components/export/ExportSettings';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useHistory } from './hooks/useHistory';
import { initializeStorageProvider, pullTokens, pushTokens } from './operations/syncOperations';
import Button from './components/Button';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.ui);
  const { collections } = useAppSelector((state) => state.collections);
  const storageType = useAppSelector((state) => state.storage.type);
  const tokensLoading = useAppSelector((state) => state.tokens.isLoading);
  const [showGithubConfig, setShowGithubConfig] = useState(false);
  const [showTokenEditor, setShowTokenEditor] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [tokenEditorMode, setTokenEditorMode] = useState<'create' | 'edit'>('create');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettingsType>(DEFAULT_EXPORT_SETTINGS);

  // History operations
  const { handleUndo, handleRedo } = useHistory();

  useEffect(() => {
    // Set up message listener for plugin responses
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as PluginResponse;

      console.log('UI received message:', msg.type);

      switch (msg.type) {
        case 'collections-scanned':
          dispatch(setCollections(msg.payload.collections));
          dispatch(setLoading(false));
          break;

        case 'export-error':
          dispatch(setError(msg.payload.error));
          dispatch(setLoading(false));
          break;

        case 'export-progress':
          console.log('Export progress RAW payload:', JSON.stringify(msg.payload, null, 2));
          console.log('Export progress payload type:', typeof msg.payload);
          console.log('Export progress payload keys:', msg.payload ? Object.keys(msg.payload) : 'null');
          break;

        case 'export-complete':
          console.log('Export complete RAW payload:', JSON.stringify(msg.payload, null, 2));
          console.log('Export complete:', msg.payload);
          dispatch(setLoading(false));

          // Trigger file downloads
          if (msg.payload.files && msg.payload.files.length > 0) {
            console.log(`📥 Downloading ${msg.payload.files.length} file(s)...`);

            msg.payload.files.forEach((file: { filename: string; content: string }, index: number) => {
              console.log(`📄 Downloading file ${index + 1}/${msg.payload.files.length}: ${file.filename}`);

              // Create blob with JSON content
              const blob = new Blob([file.content], { type: 'application/json' });
              const url = URL.createObjectURL(blob);

              // Create download link
              const a = document.createElement('a');
              a.href = url;
              a.download = file.filename;
              a.style.display = 'none';
              document.body.appendChild(a);

              // Trigger download
              a.click();

              // Cleanup
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 100);
            });

            // Show success message
            const totalTokens = msg.payload.statistics?.totalTokens || 0;
            const fileCount = msg.payload.files.length;
            console.log(`✅ Successfully exported ${totalTokens} tokens to ${fileCount} file(s)`);
            alert(`✅ Export successful!\n\n${totalTokens} tokens exported to ${fileCount} JSON file(s).\n\nCheck your Downloads folder for:\n${msg.payload.files.map((f: any) => f.filename).join('\n')}`);
          } else {
            console.warn('⚠️ No files generated from export');
            alert('Export completed but no files were generated. Check console for details.');
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial collection scan
    sendMessageToPlugin({ type: 'scan-collections' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [dispatch]);

  const sendMessageToPlugin = (message: PluginMessage) => {
    parent.postMessage({ pluginMessage: message }, '*');
  };

  const handleClose = () => {
    sendMessageToPlugin({ type: 'close-plugin' });
  };

  const handleConfigureClick = () => {
    if (storageType === 'github') {
      setShowGithubConfig(true);
    }
    // Handle other types as needed
  };

  const handleGithubConfigSave = async (config: GithubConfigData) => {
    try {
      await dispatch(initializeStorageProvider('github', config));
      setShowGithubConfig(false);
    } catch (error) {
      console.error('Failed to configure GitHub:', error);
    }
  };

  const handlePullClick = async () => {
    try {
      await dispatch(pullTokens());
    } catch (error) {
      console.error('Failed to pull tokens:', error);
    }
  };

  const handlePushClick = async () => {
    // TODO: Get current tokens from state
    const tokens = {}; // placeholder
    try {
      await dispatch(pushTokens({ tokens }));
    } catch (error) {
      console.error('Failed to push tokens:', error);
    }
  };

  const handleCreateToken = () => {
    setTokenEditorMode('create');
    setShowTokenEditor(true);
  };

  const handleFindReplace = (find: string, replace: string, options: any) => {
    console.log('Find/Replace:', { find, replace, options });
    // TODO: Execute find/replace operation
    setShowFindReplace(false);
  };

  const handleExportTokens = () => {
    dispatch(setLoading(true));

    // Send export message to plugin with all collections and current settings
    sendMessageToPlugin({
      type: 'export-tokens',
      payload: {
        selections: collections,
        settings: exportSettings,
      },
    });
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+n': handleCreateToken,
    'ctrl+n': handleCreateToken,
    'cmd+f': () => setShowFindReplace(true),
    'ctrl+f': () => setShowFindReplace(true),
    'cmd+z': handleUndo,
    'ctrl+z': handleUndo,
    'cmd+shift+z': handleRedo,
    'ctrl+shift+z': handleRedo,
    escape: () => {
      setShowTokenEditor(false);
      setShowFindReplace(false);
    },
  });

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
        Spectrum Token Manager (React)
      </h1>

      {/* Storage Configuration */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e0e0e0', paddingBottom: '16px' }}>
        <StorageSelector onConfigureClick={handleConfigureClick} />
        <SyncPanel onPullClick={handlePullClick} onPushClick={handlePushClick} />
      </div>

      {/* Export Settings */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e0e0e0', paddingBottom: '16px' }}>
        <ExportSettings settings={exportSettings} onChange={setExportSettings} />
      </div>

      {/* Token Operations */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e0e0e0', paddingBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
          Token Operations
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button onClick={handleExportTokens}>Export All Tokens</Button>
          <Button onClick={handleCreateToken}>Create Token</Button>
          <Button variant="secondary" onClick={() => setShowFindReplace(true)}>
            Find & Replace
          </Button>
          <HistoryButtons />
        </div>
      </div>

      {/* Node Inspector - Demo Section */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e0e0e0', paddingBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
          Node Inspector (Demo)
        </h3>
        {!selectedNodeId && (
          <div style={{ marginBottom: '8px' }}>
            <Button variant="secondary" onClick={() => setSelectedNodeId('test-node-123')}>
              Demo: Select Test Node
            </Button>
          </div>
        )}
        {selectedNodeId && (
          <>
            <Button variant="secondary" onClick={() => setSelectedNodeId(null)} style={{ marginBottom: '8px' }}>
              Clear Selection
            </Button>
            <NodeInspector selectedNodeId={selectedNodeId} />
          </>
        )}
      </div>

      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading collections...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isLoading && !error && (
        <div>
          <div
            style={{
              padding: '20px',
              marginBottom: '16px',
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50',
              borderRadius: '4px',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2e7d32' }}>
              ✓ React + Redux is working!
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#1b5e20' }}>
              Found {collections.length} collection(s)
            </p>
          </div>

          {collections.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
                Collections:
              </h3>
              <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
                {collections.map((collection) => (
                  <li key={collection.collectionId} style={{ marginBottom: '4px' }}>
                    {collection.collectionName} ({collection.variableCount} variables)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Close Plugin
          </button>
        </div>
      )}

      {/* Modals */}
      <GithubConfigModal
        isOpen={showGithubConfig}
        onClose={() => setShowGithubConfig(false)}
        onSave={handleGithubConfigSave}
      />

      <TokenEditor
        isOpen={showTokenEditor}
        onClose={() => setShowTokenEditor(false)}
        mode={tokenEditorMode}
      />

      <FindReplace
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        onReplace={handleFindReplace}
        tokens={[]}
      />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Loading overlay for async operations */}
      <LoadingOverlay isLoading={tokensLoading} message="Processing tokens..." />
    </div>
  );
};

export default App;
