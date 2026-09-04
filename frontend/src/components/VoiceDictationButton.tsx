import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SpeechRecognitionSession,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../services/speechService';

export interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  size?: 'sm' | 'md' | 'lg';
  mode?: 'append' | 'replace';
  label?: string;
  variant?: 'pill' | 'icon' | 'full';
  defaultLanguage?: string;
  disabled?: boolean;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  currentValue = '',
  size = 'md',
  mode = 'append',
  label = 'Voice Dictate',
  variant = 'pill',
  defaultLanguage,
  disabled = false,
}) => {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    const langCode = defaultLanguage || i18n.language || 'en';
    const found = SUPPORTED_LANGUAGES.find(l => l.code === langCode || l.locale.startsWith(langCode));
    return found || SUPPORTED_LANGUAGES[0];
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const sessionRef = useRef<SpeechRecognitionSession | null>(null);
  const timerRef = useRef<any>(null);
  const baseValueRef = useRef<string>(currentValue);

  // Sync base value when not listening
  useEffect(() => {
    if (!isListening) {
      baseValueRef.current = currentValue;
    }
  }, [currentValue, isListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleToggleListening = () => {
    if (disabled) return;
    setErrorMsg(null);

    if (isListening) {
      // Stop
      if (sessionRef.current) {
        sessionRef.current.stop();
      }
      setIsListening(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else {
      // Start
      baseValueRef.current = currentValue;
      const session = new SpeechRecognitionSession({
        locale: selectedLang.locale,
        onStart: () => {
          setIsListening(true);
          setDuration(0);
          timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
          }, 1000);
        },
        onResult: (transcript: string) => {
          if (mode === 'append') {
            const base = baseValueRef.current ? baseValueRef.current.trim() : '';
            const combined = base ? `${base} ${transcript}` : transcript;
            onTranscript(combined);
          } else {
            onTranscript(transcript);
          }
        },
        onError: (err: string) => {
          setErrorMsg(err);
          setIsListening(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        },
        onEnd: () => {
          setIsListening(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        },
      });

      sessionRef.current = session;
      const started = session.start();
      if (!started) {
        setIsListening(false);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSupported = SpeechRecognitionSession.isSupported();

  if (!isSupported) {
    return (
      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        <span>🎤</span> <span style={{ fontSize: '0.7rem' }}>Manual Input Only</span>
      </span>
    );
  }

  const btnPadding = size === 'sm' ? '0.25rem 0.55rem' : size === 'lg' ? '0.55rem 1rem' : '0.4rem 0.75rem';
  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '0.9rem' : '0.8125rem';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
      {/* Main Dictation Toggle Button */}
      <button
        type="button"
        onClick={handleToggleListening}
        disabled={disabled}
        title={isListening ? 'Click to stop listening' : `Dictate notes in ${selectedLang.name}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: btnPadding,
          fontSize,
          fontWeight: 600,
          borderRadius: '9999px',
          border: isListening ? '1.5px solid #ef4444' : '1px solid var(--border)',
          backgroundColor: isListening ? '#fef2f2' : 'var(--card)',
          color: isListening ? '#b91c1c' : 'var(--foreground)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.35)' : 'var(--shadow-sm)',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Animated Mic Icon */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size === 'sm' ? '0.85rem' : '1rem',
          animation: isListening ? 'pulse 1.2s infinite' : 'none',
        }}>
          {isListening ? '🎙️' : '🎤'}
        </span>

        {variant !== 'icon' && (
          <span>
            {isListening ? (
              <strong style={{ color: '#dc2626' }}>Listening... ({formatTimer(duration)})</strong>
            ) : (
              label
            )}
          </span>
        )}

        {/* Live Audio Visualizer Dots when recording */}
        {isListening && (
          <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center', marginLeft: '2px' }}>
            <span style={{ width: '3px', height: '10px', backgroundColor: '#ef4444', borderRadius: '2px', animation: 'pulse 0.6s infinite alternate' }} />
            <span style={{ width: '3px', height: '16px', backgroundColor: '#ef4444', borderRadius: '2px', animation: 'pulse 0.9s infinite alternate' }} />
            <span style={{ width: '3px', height: '8px', backgroundColor: '#ef4444', borderRadius: '2px', animation: 'pulse 0.7s infinite alternate' }} />
          </span>
        )}
      </button>

      {/* Language Switcher Pill */}
      {!isListening && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowLangMenu(prev => !prev)}
            title="Change dictation language"
            style={{
              padding: '0.2rem 0.45rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{selectedLang.flag}</span>
            <span>{selectedLang.code.toUpperCase()}</span>
            <span style={{ fontSize: '0.6rem' }}>▼</span>
          </button>

          {showLangMenu && (
            <div style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              zIndex: 50,
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.35rem',
              minWidth: '150px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}>
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang);
                    setShowLangMenu(false);
                  }}
                  style={{
                    padding: '0.35rem 0.5rem',
                    textAlign: 'left',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: selectedLang.code === lang.code ? 'var(--primary)' : 'transparent',
                    color: selectedLang.code === lang.code ? 'var(--primary-foreground)' : 'var(--foreground)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{lang.flag} {lang.name}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({lang.nativeName})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Badge */}
      {errorMsg && (
        <span style={{
          fontSize: '0.7rem',
          color: '#991b1b',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          padding: '0.2rem 0.5rem',
          maxWidth: '220px',
        }}>
          ⚠️ {errorMsg}
        </span>
      )}
    </div>
  );
};
