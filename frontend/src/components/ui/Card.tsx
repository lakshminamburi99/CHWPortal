import React from 'react';

const baseStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-card)',
  fontFamily: 'var(--font-sans)',
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  style,
  children,
  ...props
}) => (
  <div style={{ ...baseStyle, ...style }} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  style,
  children,
  ...props
}) => (
  <div style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', ...style }} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  style,
  children,
  ...props
}) => (
  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)', fontFamily: 'var(--font-sans)', ...style }} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  style,
  children,
  ...props
}) => (
  <div style={{ padding: '1rem 1.5rem', ...style }} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  style,
  children,
  ...props
}) => (
  <div style={{ padding: '0.75rem 1.5rem 1.25rem', display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border)', ...style }} {...props}>
    {children}
  </div>
);
