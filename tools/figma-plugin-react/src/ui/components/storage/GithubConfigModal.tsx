import React, { useState } from 'react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';

export interface GithubConfigData {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  token: string;
}

interface GithubConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: GithubConfigData) => void;
  initialConfig?: Partial<GithubConfigData>;
}

export function GithubConfigModal({
  isOpen,
  onClose,
  onSave,
  initialConfig = {},
}: GithubConfigModalProps) {
  const [owner, setOwner] = useState(initialConfig.owner || '');
  const [repo, setRepo] = useState(initialConfig.repo || '');
  const [path, setPath] = useState(initialConfig.path || 'tokens.json');
  const [branch, setBranch] = useState(initialConfig.branch || 'main');
  const [token, setToken] = useState(initialConfig.token || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validation
    if (!owner.trim()) {
      setError('Repository owner is required');
      return;
    }
    if (!repo.trim()) {
      setError('Repository name is required');
      return;
    }
    if (!path.trim()) {
      setError('File path is required');
      return;
    }
    if (!token.trim()) {
      setError('Access token is required');
      return;
    }

    setError('');
    onSave({
      owner: owner.trim(),
      repo: repo.trim(),
      path: path.trim(),
      branch: branch.trim() || 'main',
      token: token.trim(),
    });
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="GitHub Configuration">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '400px' }}>
        <Input
          label="Repository Owner"
          value={owner}
          onChange={setOwner}
          placeholder="adobe"
          error={error && !owner.trim() ? error : undefined}
        />
        <Input
          label="Repository Name"
          value={repo}
          onChange={setRepo}
          placeholder="spectrum-tokens"
          error={error && !repo.trim() ? error : undefined}
        />
        <Input
          label="File Path"
          value={path}
          onChange={setPath}
          placeholder="tokens/exported.json"
          error={error && !path.trim() ? error : undefined}
        />
        <Input
          label="Branch (optional)"
          value={branch}
          onChange={setBranch}
          placeholder="main"
        />
        <Input
          label="Personal Access Token"
          type="password"
          value={token}
          onChange={setToken}
          placeholder="ghp_xxxxxxxxxxxx"
          error={error && !token.trim() ? error : undefined}
        />
        {error && (
          <div
            style={{
              color: '#d32f2f',
              fontSize: '12px',
              padding: '8px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
            }}
            role="alert"
          >
            {error}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Connect</Button>
        </div>
      </div>
    </Modal>
  );
}
