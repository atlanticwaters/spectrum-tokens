import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
  'aria-label': ariaLabel,
}) => {
  const baseStyles: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    opacity: disabled || loading ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const variantStyles: React.CSSProperties =
    variant === 'primary'
      ? {
          backgroundColor: '#1976d2',
          color: 'white',
        }
      : {
          backgroundColor: '#f5f5f5',
          color: '#333',
          border: '1px solid #ddd',
        };

  const hoverStyles: React.CSSProperties = {
    ...(variant === 'primary' && {
      backgroundColor: '#1565c0',
    }),
    ...(variant === 'secondary' && {
      backgroundColor: '#eeeeee',
    }),
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      style={{
        ...baseStyles,
        ...variantStyles,
        ...(isHovered && !disabled && !loading ? hoverStyles : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
          role="status"
          aria-label="Loading"
        />
      )}
      {children}
    </button>
  );
};

export default Button;
