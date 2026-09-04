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

export const CareCompassMark: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({
  size = 36,
  className,
  style,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const gradPrimary = `cc-grad-primary-${uid}`;
  const gradSecondary = `cc-grad-secondary-${uid}`;
  const gradAccent = `cc-grad-accent-${uid}`;
  const glowFilter = `cc-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label="Care Compass Logo"
    >
      <defs>
        {/* Vibrant Medical/Navigation Gradients */}
        <linearGradient id={gradPrimary} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>

        <linearGradient id={gradSecondary} x1="90" y1="10" x2="10" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id={gradAccent} x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Subtle Soft Glow */}
        <filter id={glowFilter} x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Compass Coordinate Ring */}
      <circle cx="50" cy="50" r="44" stroke={`url(#${gradPrimary})`} strokeWidth="2.5" strokeOpacity="0.4" strokeDasharray="2 3.5" />
      <circle cx="50" cy="50" r="47.5" stroke={`url(#${gradPrimary})`} strokeWidth="1" strokeOpacity="0.25" />

      {/* 4 Cardinal Compass Tick Markers (N, E, S, W) */}
      <line x1="50" y1="2" x2="50" y2="9" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="91" x2="50" y2="98" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="2" y1="50" x2="9" y2="50" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="91" y1="50" x2="98" y2="50" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />

      {/* Intermediate Navigation Beacons */}
      <circle cx="21" cy="21" r="1.5" fill="#38bdf8" fillOpacity="0.6" />
      <circle cx="79" cy="21" r="1.5" fill="#38bdf8" fillOpacity="0.6" />
      <circle cx="21" cy="79" r="1.5" fill="#10b981" fillOpacity="0.6" />
      <circle cx="79" cy="79" r="1.5" fill="#10b981" fillOpacity="0.6" />

      {/* Inner Protective Halo */}
      <circle cx="50" cy="50" r="32" fill={`url(#${gradPrimary})`} fillOpacity="0.08" stroke={`url(#${gradSecondary})`} strokeWidth="1.5" strokeOpacity="0.35" />

      {/* ── Care & Compass Core: Medical Cross + Compass Star Hybrid ── */}
      
      {/* North Pointer (Guiding Star Apex) */}
      <path
        d="M50 12 L56 38 L50 44 L44 38 Z"
        fill={`url(#${gradAccent})`}
        filter={`url(#${glowFilter})`}
      />
      {/* North Facet Highlight */}
      <path
        d="M50 12 L56 38 L50 44 Z"
        fill="#ffffff"
        fillOpacity="0.3"
      />

      {/* South Pointer */}
      <path
        d="M50 88 L44 62 L50 56 L56 62 Z"
        fill={`url(#${gradSecondary})`}
      />
      {/* South Facet Highlight */}
      <path
        d="M50 88 L44 62 L50 56 Z"
        fill="#ffffff"
        fillOpacity="0.2"
      />

      {/* West Pointer (Embrace Wing) */}
      <path
        d="M12 50 L38 44 L44 50 L38 56 Z"
        fill={`url(#${gradPrimary})`}
      />
      {/* West Facet Highlight */}
      <path
        d="M12 50 L38 44 L44 50 Z"
        fill="#ffffff"
        fillOpacity="0.25"
      />

      {/* East Pointer (Embrace Wing) */}
      <path
        d="M88 50 L62 56 L56 50 L62 44 Z"
        fill={`url(#${gradSecondary})`}
      />
      {/* East Facet Highlight */}
      <path
        d="M88 50 L62 56 L56 50 Z"
        fill="#ffffff"
        fillOpacity="0.25"
      />

      {/* Diagonal Support Rays (Subtle 8-Point Rose) */}
      <path d="M26 26 L39 41 L41 39 Z" fill="#38bdf8" fillOpacity="0.45" />
      <path d="M74 26 L61 41 L59 39 Z" fill="#38bdf8" fillOpacity="0.45" />
      <path d="M26 74 L39 59 L41 61 Z" fill="#10b981" fillOpacity="0.45" />
      <path d="M74 74 L61 59 L59 61 Z" fill="#10b981" fillOpacity="0.45" />

      {/* ── Central Clinical Heartbeat / Vital Pulse Waveform ── */}
      <path
        d="M34 50 L42 50 L46 41 L50 59 L54 44 L57 53 L60 50 L66 50"
        stroke="#ffffff"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Beacon Node */}
      <circle cx="50" cy="50" r="3" fill="#ffffff" filter={`url(#${glowFilter})`} />
      <circle cx="50" cy="50" r="1.5" fill="#0284c7" />
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

  // Render icon inside a polished, modern container
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
            ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
            : isSidebar
            ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(14, 165, 233, 0.08) 100%)'
            : 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
          border: isLight
            ? '1px solid #bae6fd'
            : isSidebar
            ? '1px solid rgba(56, 189, 248, 0.3)'
            : '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: isLight
            ? '0 2px 8px rgba(2, 132, 199, 0.12)'
            : '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
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
    const subColor = isSidebar ? 'rgba(255, 255, 255, 0.55)' : theme === 'light' ? '#64748b' : 'rgba(255, 255, 255, 0.65)';

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
              ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(14, 165, 233, 0.08) 100%)'
              : theme === 'light'
              ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: isSidebar ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
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
              letterSpacing: '-0.02em',
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
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <CareCompassMark size={pixelSize} />
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '1.45rem',
              lineHeight: 1.15,
              color: '#ffffff',
              letterSpacing: '-0.025em',
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
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 500, marginTop: '2px' }}>
              {subtitleText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
