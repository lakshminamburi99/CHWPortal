import React, { useState } from 'react';
import { getAvatarForUser } from '../../utils/avatars';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

interface AvatarProps {
  src?: string;
  name?: string;
  role?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  shape?: 'circle' | 'rounded';
  border?: boolean;
  borderColor?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const sizePixels: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  '2xl': 80,
};

const statusColors: Record<AvatarStatus, string> = {
  online: '#16a34a',
  busy: '#dc2626',
  away: '#f59e0b',
  offline: '#94a3b8',
};

const gradientPalette = [
  'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
  'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
];

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  role,
  size = 'md',
  status,
  shape = 'circle',
  border = false,
  borderColor = 'rgba(255, 255, 255, 0.2)',
  alt,
  className = '',
  style = {},
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const px = typeof size === 'number' ? size : sizePixels[size] || 40;

  // Resolve source: explicit src, or lookup helper
  const resolvedSrc = src || (name ? getAvatarForUser({ name, role }) : undefined);

  // Compute initials
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  // Deterministic gradient choice based on string char code sum
  const charSum = (name || 'U').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bgGradient = gradientPalette[charSum % gradientPalette.length];

  const borderRadius = shape === 'circle' ? '50%' : `${Math.round(px * 0.24)}px`;
  const fontSize = Math.max(10, Math.round(px * 0.38));

  // Status indicator dimensions
  const dotSize = Math.max(6, Math.round(px * 0.26));
  const dotOffset = shape === 'circle' ? Math.round(px * 0.04) : 0;

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        width: `${px}px`,
        height: `${px}px`,
        minWidth: `${px}px`,
        minHeight: `${px}px`,
        borderRadius,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {resolvedSrc && !imgError ? (
        <img
          src={resolvedSrc}
          alt={alt || name}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius,
            border: border ? `2px solid ${borderColor}` : 'none',
            display: 'block',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius,
            background: bgGradient,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: `${fontSize}px`,
            letterSpacing: '0.02em',
            border: border ? `2px solid ${borderColor}` : 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            userSelect: 'none',
          }}
        >
          {initials}
        </div>
      )}

      {/* Online / Active status badge */}
      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: `${dotOffset}px`,
            right: `${dotOffset}px`,
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            borderRadius: '50%',
            backgroundColor: statusColors[status] || statusColors.online,
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
          }}
          title={status.toUpperCase()}
        />
      )}
    </div>
  );
};
