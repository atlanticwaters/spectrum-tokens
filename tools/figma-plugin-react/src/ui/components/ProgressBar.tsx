import React from 'react';

export interface ProgressBarProps {
  current: number;
  total: number;
  message?: string;
  'aria-label'?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  message,
  'aria-label': ariaLabel,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const containerStyles: React.CSSProperties = {
    width: '100%',
  };

  const barContainerStyles: React.CSSProperties = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
  };

  const barFillStyles: React.CSSProperties = {
    height: '100%',
    width: `${clampedPercentage}%`,
    backgroundColor: '#1976d2',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  };

  const infoStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#333',
  };

  const messageStyles: React.CSSProperties = {
    flex: 1,
    marginRight: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const percentageStyles: React.CSSProperties = {
    fontWeight: 600,
    minWidth: '45px',
    textAlign: 'right',
  };

  const countStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  };

  return (
    <div
      style={containerStyles}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={ariaLabel || `Progress: ${current} of ${total}`}
    >
      <div style={infoStyles}>
        {message && (
          <span style={messageStyles} title={message}>
            {message}
          </span>
        )}
        <span style={percentageStyles}>{clampedPercentage}%</span>
      </div>
      <div style={barContainerStyles}>
        <div style={barFillStyles} />
      </div>
      <div style={countStyles}>
        {current} / {total}
      </div>
    </div>
  );
};

export default ProgressBar;
