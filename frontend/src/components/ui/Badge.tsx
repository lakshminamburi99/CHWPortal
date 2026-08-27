import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'outline';
}

const variantStyles: Record<string, React.CSSProperties> = {
  success: { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' },
  warning: { backgroundColor: '#fef9c3', color: '#92400e', border: '1px solid #fde68a' },
  danger:  { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
  info:    { backgroundColor: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  default: { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' },
  outline: { backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' },
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', style, children, ...props }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.2rem 0.55rem',
      borderRadius: '9999px',
      fontSize: '0.7rem',
      fontWeight: 600,
      fontFamily: 'var(--font-sans)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      ...variantStyles[variant],
      ...style,
    }}
    {...props}
  >
    {children}
  </span>
);
