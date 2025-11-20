import React from 'react';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}) => {
  const checkboxId = id || `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(event.target.checked);
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    userSelect: 'none',
  };

  const checkboxStyles: React.CSSProperties = {
    width: '18px',
    height: '18px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    accentColor: '#1976d2',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <label htmlFor={checkboxId} style={containerStyles}>
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel || label}
        aria-checked={checked}
        style={checkboxStyles}
      />
      <span style={labelStyles}>{label}</span>
    </label>
  );
};

export default Checkbox;
