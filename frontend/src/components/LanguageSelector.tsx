import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type SupportedLanguage } from '../utils/languages';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'pill' | 'minimal' | 'select';
  className?: string;
  style?: React.CSSProperties;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
  style = {},
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang: SupportedLanguage =
    supportedLanguages.find((l) => l.code === i18n.language) || supportedLanguages[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Native Select variant
  if (variant === 'select') {
    return (
      <select
        value={currentLang.code}
        onChange={(e) => handleSelectLanguage(e.target.value)}
        aria-label="Select Language"
        className={className}
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.35rem 0.65rem',
          fontSize: '0.8125rem',
          fontFamily: 'inherit',
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
          cursor: 'pointer',
          outline: 'none',
          ...style,
        }}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    );
  }

  // Pill variant
  if (variant === 'pill') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          gap: '0.25rem',
          padding: '0.25rem',
          backgroundColor: 'var(--muted)',
          borderRadius: 'var(--radius-md)',
          ...style,
        }}
      >
        {supportedLanguages.map((lang) => {
          const isActive = lang.code === currentLang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code)}
              style={{
                border: 'none',
                background: isActive ? 'var(--card)' : 'transparent',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.78rem',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
                fontFamily: 'inherit',
              }}
            >
              {lang.nativeName}
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div
      ref={dropdownRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Language Selector"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)',
          color: 'var(--foreground)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'border-color var(--transition-fast)',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{currentLang.nativeName}</span>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--muted-foreground)',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {currentLang.code}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform var(--transition-fast)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            insetInlineEnd: 0,
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-raised)',
            zIndex: 9999,
            minWidth: '160px',
            overflow: 'hidden',
            animation: 'fadeIn 120ms ease',
          }}
        >
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLanguage(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.65rem 0.95rem',
                  fontSize: '0.825rem',
                  backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--foreground)',
                  fontWeight: isSelected ? 600 : 400,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'start',
                  fontFamily: 'inherit',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <span>{lang.nativeName}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: isSelected ? 'var(--accent)' : 'var(--muted-foreground)',
                  }}
                >
                  {lang.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
