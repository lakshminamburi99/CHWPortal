import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-foreground)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'var(--secondary)',
    color: 'var(--secondary-foreground)',
    border: '1px solid var(--border)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    border: '1px solid var(--border)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    border: 'none',
  },
  danger: {
    backgroundColor: 'var(--destructive)',
    color: 'var(--destructive-foreground)',
    border: 'none',
  },
  link: {
    backgroundColor: 'transparent',
    color: 'var(--primary)',
    border: 'none',
    textDecoration: 'underline',
    padding: '0',
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm:   { padding: '0.3rem 0.75rem',  fontSize: '0.8rem',    height: '32px' },
  md:   { padding: '0.5rem 1rem',     fontSize: '0.875rem',  height: '38px' },
  lg:   { padding: '0.65rem 1.5rem',  fontSize: '1rem',      height: '44px' },
  icon: { padding: '0.5rem',          fontSize: '1rem',      height: '38px', width: '38px' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', style, children, disabled, ...props }, ref) => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.4rem',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background-color 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      letterSpacing: '0.01em',
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    return (
      <button ref={ref} style={base} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
