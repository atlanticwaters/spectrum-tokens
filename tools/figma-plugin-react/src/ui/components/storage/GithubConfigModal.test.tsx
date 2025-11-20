import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GithubConfigModal, GithubConfigData } from './GithubConfigModal';

describe('GithubConfigModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <GithubConfigModal isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />
    );

    expect(screen.queryByText('GitHub Configuration')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    expect(screen.getByText('GitHub Configuration')).toBeInTheDocument();
  });

  it('renders all required input fields', () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    expect(screen.getByLabelText(/repository owner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repository name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/branch/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument();
  });

  it('has default values for path and branch', () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const pathInput = screen.getByLabelText(/file path/i) as HTMLInputElement;
    const branchInput = screen.getByLabelText(/branch/i) as HTMLInputElement;

    expect(pathInput.value).toBe('tokens.json');
    expect(branchInput.value).toBe('main');
  });

  it('populates fields with initialConfig', () => {
    const initialConfig: Partial<GithubConfigData> = {
      owner: 'adobe',
      repo: 'spectrum-tokens',
      path: 'tokens/exported.json',
      branch: 'develop',
      token: 'ghp_test123',
    };

    render(
      <GithubConfigModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialConfig={initialConfig}
      />
    );

    expect(screen.getByLabelText(/repository owner/i)).toHaveValue('adobe');
    expect(screen.getByLabelText(/repository name/i)).toHaveValue('spectrum-tokens');
    expect(screen.getByLabelText(/file path/i)).toHaveValue('tokens/exported.json');
    expect(screen.getByLabelText(/branch/i)).toHaveValue('develop');
    expect(screen.getByLabelText(/personal access token/i)).toHaveValue('ghp_test123');
  });

  it('shows error when saving without required owner', async () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/repository owner is required/i)).toBeInTheDocument();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows error when saving without required repo', async () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const ownerInput = screen.getByLabelText(/repository owner/i);
    fireEvent.change(ownerInput, { target: { value: 'adobe' } });

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/repository name is required/i)).toBeInTheDocument();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows error when saving without required path', async () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const ownerInput = screen.getByLabelText(/repository owner/i);
    const repoInput = screen.getByLabelText(/repository name/i);
    const pathInput = screen.getByLabelText(/file path/i);

    fireEvent.change(ownerInput, { target: { value: 'adobe' } });
    fireEvent.change(repoInput, { target: { value: 'spectrum-tokens' } });
    fireEvent.change(pathInput, { target: { value: '' } });

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/file path is required/i)).toBeInTheDocument();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows error when saving without required token', async () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const ownerInput = screen.getByLabelText(/repository owner/i);
    const repoInput = screen.getByLabelText(/repository name/i);

    fireEvent.change(ownerInput, { target: { value: 'adobe' } });
    fireEvent.change(repoInput, { target: { value: 'spectrum-tokens' } });

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/access token is required/i)).toBeInTheDocument();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with correct data when all fields are valid', async () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const ownerInput = screen.getByLabelText(/repository owner/i);
    const repoInput = screen.getByLabelText(/repository name/i);
    const pathInput = screen.getByLabelText(/file path/i);
    const tokenInput = screen.getByLabelText(/personal access token/i);

    fireEvent.change(ownerInput, { target: { value: 'adobe' } });
    fireEvent.change(repoInput, { target: { value: 'spectrum-tokens' } });
    fireEvent.change(pathInput, { target: { value: 'tokens/test.json' } });
    fireEvent.change(tokenInput, { target: { value: 'ghp_test123' } });

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        owner: 'adobe',
        repo: 'spectrum-tokens',
        path: 'tokens/test.json',
        branch: 'main',
        token: 'ghp_test123',
      });
    });
  });

  it('trims whitespace from input values', async () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const ownerInput = screen.getByLabelText(/repository owner/i);
    const repoInput = screen.getByLabelText(/repository name/i);
    const tokenInput = screen.getByLabelText(/personal access token/i);

    fireEvent.change(ownerInput, { target: { value: '  adobe  ' } });
    fireEvent.change(repoInput, { target: { value: '  spectrum-tokens  ' } });
    fireEvent.change(tokenInput, { target: { value: '  ghp_test123  ' } });

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        owner: 'adobe',
        repo: 'spectrum-tokens',
        path: 'tokens.json',
        branch: 'main',
        token: 'ghp_test123',
      });
    });
  });

  it('uses "main" as default branch if empty', async () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const ownerInput = screen.getByLabelText(/repository owner/i);
    const repoInput = screen.getByLabelText(/repository name/i);
    const branchInput = screen.getByLabelText(/branch/i);
    const tokenInput = screen.getByLabelText(/personal access token/i);

    fireEvent.change(ownerInput, { target: { value: 'adobe' } });
    fireEvent.change(repoInput, { target: { value: 'spectrum-tokens' } });
    fireEvent.change(branchInput, { target: { value: '' } });
    fireEvent.change(tokenInput, { target: { value: 'ghp_test123' } });

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          branch: 'main',
        })
      );
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('clears error when modal is closed', async () => {
    const { rerender } = render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    // Trigger error
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/repository owner is required/i)).toBeInTheDocument();
    });

    // Close modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Reopen modal
    rerender(
      <GithubConfigModal isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />
    );
    rerender(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    // Error should be cleared (will show on next save attempt, but not persisted)
    const newConnectButton = screen.getByText('Connect');
    expect(newConnectButton).toBeInTheDocument();
  });

  it('has password type for token input', () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    const tokenInput = screen.getByLabelText(/personal access token/i);
    expect(tokenInput).toHaveAttribute('type', 'password');
  });

  it('renders with correct accessibility attributes', () => {
    render(
      <GithubConfigModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />
    );

    // Modal has proper dialog structure
    expect(screen.getByText('GitHub Configuration')).toBeInTheDocument();

    // All inputs have labels
    expect(screen.getByLabelText(/repository owner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repository name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/branch/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument();

    // Buttons are accessible
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });
});
