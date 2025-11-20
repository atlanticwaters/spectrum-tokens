import React, { useEffect, useState } from 'react';
import Button from '../Button';

export interface NodeInspectorProps {
  selectedNodeId: string | null;
}

interface NodeData {
  id: string;
  name: string;
  type: string;
  appliedTokens: string[];
}

export function NodeInspector({ selectedNodeId }: NodeInspectorProps) {
  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedNodeId) {
      loadNodeData(selectedNodeId);
    } else {
      setNodeData(null);
    }
  }, [selectedNodeId]);

  useEffect(() => {
    // Listen for node data from plugin
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg?.type === 'node-data') {
        setNodeData(msg.payload);
        setLoading(false);
      } else if (msg?.type === 'node-tokens-cleared') {
        if (nodeData && msg.payload.nodeId === nodeData.id) {
          setNodeData({ ...nodeData, appliedTokens: [] });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [nodeData]);

  const loadNodeData = (nodeId: string) => {
    setLoading(true);
    parent.postMessage(
      {
        pluginMessage: {
          type: 'get-node-data',
          payload: { nodeId },
        },
      },
      '*'
    );
  };

  const handleClearTokens = () => {
    if (!nodeData) return;

    parent.postMessage(
      {
        pluginMessage: {
          type: 'clear-node-tokens',
          payload: { nodeId: nodeData.id },
        },
      },
      '*'
    );
  };

  const handleNavigateToToken = (tokenName: string) => {
    window.dispatchEvent(
      new CustomEvent('navigate-to-token', { detail: { tokenName } })
    );
  };

  if (!selectedNodeId) {
    return (
      <div
        className="node-inspector-empty"
        style={{ padding: '16px', textAlign: 'center', color: '#999' }}
      >
        Select a node to inspect
      </div>
    );
  }

  if (loading && !nodeData) {
    return (
      <div
        className="node-inspector-loading"
        style={{ padding: '16px', textAlign: 'center' }}
      >
        Loading node data...
      </div>
    );
  }

  if (!nodeData) {
    return (
      <div
        className="node-inspector-not-found"
        style={{ padding: '16px', textAlign: 'center', color: '#999' }}
      >
        Node not found
      </div>
    );
  }

  return (
    <div className="node-inspector" style={{ padding: '12px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>{nodeData.name}</div>
        <div style={{ fontSize: '11px', color: '#666' }}>{nodeData.type}</div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
          Applied Tokens:
        </div>
        {nodeData.appliedTokens.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#999' }}>No tokens applied</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {nodeData.appliedTokens.map((tokenName) => (
              <div
                key={tokenName}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{tokenName}</span>
                <button
                  onClick={() => handleNavigateToToken(tokenName)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#0d66d0',
                    cursor: 'pointer',
                  }}
                  aria-label={`Navigate to ${tokenName}`}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {nodeData.appliedTokens.length > 0 && (
        <Button variant="secondary" onClick={handleClearTokens}>
          Clear All Tokens
        </Button>
      )}
    </div>
  );
}
