import React from 'react';

export interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  'aria-label'?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  error,
  id,
  'aria-label': ariaLabel,
}) => {
  const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(event.target.value);
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: error ? '#d32f2f' : '#333',
    marginBottom: '4px',
  };

  const inputStyles: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '14px',
    lineHeight: '1.5',
    border: `1px solid ${error ? '#d32f2f' : '#ddd'}`,
    borderRadius: '4px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: disabled ? '#f5f5f5' : 'white',
    color: disabled ? '#999' : '#333',
    cursor: disabled ? 'not-allowed' : 'text',
    fontFamily: 'inherit',
  };

  const errorStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#d32f2f',
    marginTop: '4px',
  };

  return (
    <div style={containerStyles}>
      <label htmlFor={inputId} style={labelStyles}>
        {label}
      </label>
      <input
        type={type}
        id={inputId}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel || label}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        style={inputStyles}
        onFocus={(e) => {
          if (!disabled && !error) {
            e.target.style.borderColor = '#1976d2';
            e.target.style.boxShadow = '0 0 0 2px rgba(25, 118, 210, 0.2)';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#d32f2f' : '#ddd';
          e.target.style.boxShadow = 'none';
        }}
      />
      {error && (
        <span id={`${inputId}-error`} role="alert" style={errorStyles}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
