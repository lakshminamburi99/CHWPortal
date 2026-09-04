import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import {
  SpeechSynthesisService,
  SUPPORTED_LANGUAGES,
  CAREGIVER_AUDIO_GUIDELINES,
  type SupportedLanguage,
  type CaregiverGuidanceItem,
} from '../services/speechService';

export interface MultilingualAudioPlayerProps {
  initialProtocolKey?: string;
  customSpokenText?: string;
  customTitle?: string;
  patientName?: string;
  defaultLanguageCode?: string;
}

export const MultilingualAudioPlayer: React.FC<MultilingualAudioPlayerProps> = ({
  initialProtocolKey = 'CHILD_PNEUMONIA',
  customSpokenText,
  customTitle,
  patientName = 'Patient',
  defaultLanguageCode = 'en',
}) => {
  const [selectedProtocolKey, setSelectedProtocolKey] = useState<string>(initialProtocolKey);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    const found = SUPPORTED_LANGUAGES.find(l => l.code === defaultLanguageCode);
    return found || SUPPORTED_LANGUAGES[0];
  });
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const activeGuidance: CaregiverGuidanceItem = CAREGIVER_AUDIO_GUIDELINES[selectedProtocolKey] || CAREGIVER_AUDIO_GUIDELINES.CHILD_PNEUMONIA;
  const currentTranslation = activeGuidance.translations[selectedLang.code] || activeGuidance.translations.en;

  const spokenContent = customSpokenText || currentTranslation.spokenText;
  const title = customTitle || activeGuidance.title;

  useEffect(() => {
    return () => {
      SpeechSynthesisService.stop();
    };
  }, []);

  const handlePlay = () => {
    setErrorNotice(null);

    if (isPaused) {
      SpeechSynthesisService.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const success = SpeechSynthesisService.speak(spokenContent, {
      lang: selectedLang.locale,
      rate: playbackRate,
      onStart: () => {
        setIsPlaying(true);
        setIsPaused(false);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      onError: (err: any) => {
        console.warn('Speech synthesis error:', err);
        setErrorNotice('Audio playback requires browser speech permissions or audio support.');
        setIsPlaying(false);
        setIsPaused(false);
      },
    });

    if (!success) {
      setErrorNotice('Web Speech Synthesis is not supported in this browser.');
    }
  };

  const handlePause = () => {
    SpeechSynthesisService.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    SpeechSynthesisService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    if (isPlaying) {
      SpeechSynthesisService.stop();
      setIsPlaying(false);
      setIsPaused(false);
    }
    setSelectedLang(lang);
  };

  return (
    <Card style={{
      border: '1.5px solid #3b82f6',
      background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.12)',
    }}>
      <CardContent style={{ padding: '1.5rem' }}>
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔊</span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#1e40af' }}>
                Multilingual Caregiver Spoken Guidance
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                Play compassionate clinical instructions aloud to caregivers in their native language
              </p>
            </div>
          </div>
          <Badge variant="info">WHO Protocol Audio</Badge>
        </div>

        {/* Protocol & Language Selector Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* Protocol Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              📋 Clinical Discharge Module
            </label>
            <select
              value={selectedProtocolKey}
              onChange={e => {
                if (isPlaying) handleStop();
                setSelectedProtocolKey(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'white',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--foreground)',
              }}
            >
              {Object.values(CAREGIVER_AUDIO_GUIDELINES).map(item => (
                <option key={item.protocolKey} value={item.protocolKey}>
                  {item.title} ({item.category})
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              🌐 Spoken Language ({SUPPORTED_LANGUAGES.length})
            </label>
            <select
              value={selectedLang.code}
              onChange={e => {
                const found = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                if (found) handleLanguageChange(found);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'white',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--foreground)',
              }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} — {lang.nativeName} ({lang.locale})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audio Visualizer & Player Controls Bar */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dbeafe',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* Play/Pause/Stop Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isPlaying ? (
              <Button
                variant="primary"
                onClick={handlePlay}
                style={{
                  backgroundColor: '#2563eb',
                  borderColor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                }}
              >
                <span>▶️</span> {isPaused ? 'Resume Audio' : 'Play Spoken Guidance'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePause}
                style={{
                  borderColor: '#f59e0b',
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                }}
              >
                <span>⏸</span> Pause
              </Button>
            )}

            {(isPlaying || isPaused) && (
              <Button
                variant="outline"
                onClick={handleStop}
                style={{
                  borderColor: '#ef4444',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>⏹</span> Stop
              </Button>
            )}
          </div>

          {/* Animated Waveform Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isPlaying ? '#2563eb' : '#94a3b8' }}>
              {isPlaying ? '🔊 Spoken Audio Active' : isPaused ? '⏸ Paused' : 'Ready'}
            </span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '20px' }}>
              {[12, 18, 24, 15, 20, 10, 16, 22].map((height, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '3.5px',
                    height: isPlaying ? `${height}px` : '4px',
                    backgroundColor: isPlaying ? '#3b82f6' : '#cbd5e1',
                    borderRadius: '2px',
                    transition: 'height 0.2s ease',
                    animation: isPlaying ? `pulse ${0.4 + (idx % 4) * 0.2}s infinite alternate` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Speed Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Speed:</span>
            {[
              { label: '0.8x (Slow)', val: 0.8 },
              { label: '1.0x (Normal)', val: 1.0 },
              { label: '1.2x (Fast)', val: 1.2 },
            ].map(rate => (
              <button
                key={rate.val}
                type="button"
                onClick={() => {
                  setPlaybackRate(rate.val);
                  if (isPlaying) {
                    handleStop();
                  }
                }}
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: playbackRate === rate.val ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                  backgroundColor: playbackRate === rate.val ? '#eff6ff' : 'white',
                  color: playbackRate === rate.val ? '#1d4ed8' : '#64748b',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {rate.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Spoken Text Transcript & Translation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Target Language Spoken Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#2563eb' }}>
                🗣️ Spoken Transcript ({selectedLang.nativeName})
              </span>
              <span style={{ fontSize: '0.75rem' }}>{selectedLang.flag}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.6, margin: 0 }}>
              "{spokenContent}"
            </p>
          </div>

          {/* CHW English Reference Card */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                🇬🇧 CHW Protocol Summary (English)
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              <strong>Guidance:</strong> {currentTranslation.displayText}
            </p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#0369a1' }}>
              💡 <em>{currentTranslation.englishSummary}</em>
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '0.75rem',
          }}>
            ⚠️ {errorNotice}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
