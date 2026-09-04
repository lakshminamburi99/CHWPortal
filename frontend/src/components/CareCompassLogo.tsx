import React from 'react';

interface CareCompassLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'icon' | 'mark' | 'horizontal' | 'hero';
  showSubtitle?: boolean;
  subtitleText?: string;
  theme?: 'dark' | 'light' | 'sidebar' | 'colored';
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap: Record<string, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

/**
 * CareCompassMark — Creative, Relatable & Iconic Community Healthcare Emblem
 * 
 * Visual Elements:
 * 1. Nurturing Heart Wings (Community Care, empathy & protective maternal/family embrace)
 * 2. Guiding Compass Rose (Frontline navigation, orientation & outreach)
 * 3. Clinical Cross & Vital Life Pulse (Medical safety, clinical triage & vital signs)
 * 4. Illuminated Central Beacon (Hope & community health equity)
 */
export const CareCompassMark: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 36,
  className,
  style,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const gradCyan = `cc-cyan-${uid}`;
  const gradEmerald = `cc-emerald-${uid}`;
  const gradHeart = `cc-heart-${uid}`;
  const gradStar = `cc-star-${uid}`;
  const glowId = `cc-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label="Care Compass Healthcare Emblem"
    >
      <defs>
        {/* Ocean to Sky Medical Gradient */}
        <linearGradient id={gradCyan} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Vital Health & Healing Leaf Gradient */}
        <linearGradient id={gradEmerald} x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Compass Guiding Star Radiant Gradient */}
        <linearGradient id={gradStar} x1="50" y1="5" x2="50" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        {/* Warm Caring Heart Gradient */}
        <linearGradient id={gradHeart} x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Soft Clinical Bloom Glow */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Outer Protective Orbit Ring (Precision Coordinate Markers) ── */}
      <circle cx="50" cy="50" r="45" stroke={`url(#${gradCyan})`} strokeWidth="2" strokeOpacity="0.35" strokeDasharray="3 4" />
      <circle cx="50" cy="50" r="48" stroke={`url(#${gradEmerald})`} strokeWidth="1" strokeOpacity="0.2" />

      {/* 4 Cardinal Navigation Points (N, E, S, W Beacons) */}
      <circle cx="50" cy="5" r="3.5" fill="#38bdf8" filter={`url(#${glowId})`} />
      <circle cx="50" cy="5" r="1.75" fill="#ffffff" />

      <circle cx="95" cy="50" r="3" fill="#34d399" />
      <circle cx="95" cy="50" r="1.5" fill="#ffffff" />

      <circle cx="50" cy="95" r="3" fill="#10b981" />
      <circle cx="50" cy="95" r="1.5" fill="#ffffff" />

      <circle cx="5" cy="50" r="3" fill="#0284c7" />
      <circle cx="5" cy="50" r="1.5" fill="#ffffff" />

      {/* ── Primary Emblem: Embracing Caring Hands & Heart Ribbon ── */}
      {/* Left Wing / Caring Embrace Hand */}
      <path
        d="M50 84 C32 72 16 56 16 38 C16 24 27 15 39 15 C45 15 48 18 50 22 C52 18 55 15 61 15 C73 15 84 24 84 38 C84 56 68 72 50 84 Z"
        fill={`url(#${gradHeart})`}
        fillOpacity="0.12"
        stroke={`url(#${gradCyan})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Dynamic Compass Star & Clinical Cross Core ── */}
      {/* North Apex Needle (Guiding Star) */}
      <path
        d="M50 10 L55 36 L50 43 L45 36 Z"
        fill={`url(#${gradStar})`}
        filter={`url(#${glowId})`}
      />
      <path
        d="M50 10 L55 36 L50 43 Z"
        fill="#ffffff"
        fillOpacity="0.45"
      />

      {/* South Arrow Base */}
      <path
        d="M50 78 L45 57 L50 50 L55 57 Z"
        fill={`url(#${gradEmerald})`}
      />
      <path
        d="M50 78 L45 57 L50 50 Z"
        fill="#ffffff"
        fillOpacity="0.25"
      />

      {/* West Embrace Arm */}
      <path
        d="M22 47 L43 42 L50 47 L43 52 Z"
        fill={`url(#${gradCyan})`}
      />
      <path
        d="M22 47 L43 42 L50 47 Z"
        fill="#ffffff"
        fillOpacity="0.3"
      />

      {/* East Embrace Arm */}
      <path
        d="M78 47 L57 52 L50 47 L57 42 Z"
        fill={`url(#${gradEmerald})`}
      />
      <path
        d="M78 47 L57 42 L50 47 Z"
        fill="#ffffff"
        fillOpacity="0.3"
      />

      {/* ── Vital Signs Pulse Waveform across Horizon ── */}
      <path
        d="M28 47 L36 47 L40 37 L45 57 L49 41 L53 51 L56 47 L72 47"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Radiating Beacon Node */}
      <circle cx="50" cy="47" r="4.5" fill="#ffffff" filter={`url(#${glowId})`} />
      <circle cx="50" cy="47" r="2.5" fill="#0284c7" />
    </svg>
  );
};

export const CareCompassLogo: React.FC<CareCompassLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  subtitleText = 'Community Health Platform',
  theme = 'sidebar',
  className = '',
  style = {},
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 36;

  // Render raw mark only
  if (variant === 'mark') {
    return <CareCompassMark size={pixelSize} className={className} style={style} />;
  }

  // Render icon inside a container
  if (variant === 'icon') {
    const isSidebar = theme === 'sidebar';
    const isLight = theme === 'light';

    return (
      <div
        className={className}
        style={{
          width: `${pixelSize + 8}px`,
          height: `${pixelSize + 8}px`,
          borderRadius: `${Math.round(pixelSize * 0.32)}px`,
          background: isLight
            ? 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)'
            : isSidebar
            ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(16, 185, 129, 0.15) 100%)'
            : 'linear-gradient(135deg, #0c4a6e 0%, #065f46 100%)',
          border: isLight
            ? '1px solid #bae6fd'
            : isSidebar
            ? '1px solid rgba(56, 189, 248, 0.4)'
            : '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: isLight
            ? '0 2px 8px rgba(2, 132, 199, 0.12)'
            : '0 4px 14px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style,
        }}
      >
        <CareCompassMark size={pixelSize - 2} />
      </div>
    );
  }

  // Render full horizontal logo (Icon + Wordmark)
  if (variant === 'horizontal') {
    const isSidebar = theme === 'sidebar';
    const textColor = isSidebar ? 'var(--sidebar-foreground, #ffffff)' : theme === 'light' ? '#0f172a' : '#ffffff';
    const subColor = isSidebar ? 'rgba(255, 255, 255, 0.65)' : theme === 'light' ? '#64748b' : 'rgba(255, 255, 255, 0.7)';

    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${Math.max(8, Math.round(pixelSize * 0.28))}px`,
          fontFamily: 'var(--font-sans, "Plus Jakarta Sans", system-ui, sans-serif)',
          userSelect: 'none',
          ...style,
        }}
      >
        <div
          style={{
            width: `${pixelSize + 6}px`,
            height: `${pixelSize + 6}px`,
            borderRadius: `${Math.round(pixelSize * 0.28)}px`,
            background: isSidebar
              ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(16, 185, 129, 0.12) 100%)'
              : theme === 'light'
              ? 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #059669 100%)',
            border: isSidebar ? '1px solid rgba(56, 189, 248, 0.38)' : '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
            flexShrink: 0,
          }}
        >
          <CareCompassMark size={pixelSize} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: `${Math.max(14, Math.round(pixelSize * 0.52))}px`,
              lineHeight: 1.15,
              color: textColor,
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Care</span>
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Compass
            </span>
          </div>
          {showSubtitle && (
            <div
              style={{
                fontSize: `${Math.max(10, Math.round(pixelSize * 0.3))}px`,
                color: subColor,
                lineHeight: 1.2,
                fontWeight: 500,
                letterSpacing: '0.01em',
                marginTop: '1px',
              }}
            >
              {subtitleText}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render large Hero presentation (e.g. For Login / Splash)
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.75rem',
        userSelect: 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: `${pixelSize + 12}px`,
            height: `${pixelSize + 12}px`,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(16, 185, 129, 0.18) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(2, 132, 199, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CareCompassMark size={pixelSize + 2} />
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '1.55rem',
              lineHeight: 1.15,
              color: '#ffffff',
              letterSpacing: '-0.03em',
            }}
          >
            Care{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Compass
            </span>
          </div>
          {showSubtitle && (
            <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 500, marginTop: '2px' }}>
              {subtitleText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
