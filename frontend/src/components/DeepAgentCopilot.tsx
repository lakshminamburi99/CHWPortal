import React, { useState, useRef } from 'react';
import { API_BASE } from '../config';

export const DeepAgentCopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setResponse(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          await submitVoiceQuery(base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      // Fallback if mic permission denied
      submitVoiceQuery('mock_audio_base64');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitVoiceQuery = async (audioBase64: string) => {
    setLoading(true);
    setResponse(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/agent/voice-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ audioBase64 }),
      });
      if (res.ok) {
        const data = await res.json();
        setResponse(data);
        if (data.audio_transcript) {
          setQuery(data.audio_transcript);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(p => !p)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0f172a',
          color: 'white',
          border: 'none',
          borderRadius: '999px',
          padding: '12px 20px',
          fontSize: '0.875rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(15,23,42,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🤖</span>
        <span>GCP Deep Agent</span>
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            width: '420px',
            maxHeight: '620px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#0f172a',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>GCP Deep Clinical Agent</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tool Calling & Speech-to-Text V2</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>

          {/* Body Content */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Initial Helper Banner */}
            {!response && !loading && (
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                👋 Ask any complex clinical query by text or microphone. The <strong>GCP Deep Agent</strong> will autonomously invoke 6 tools: Speech-to-Text V2, EHR records, iCCM protocols, WHO guidelines, hospital bed availability, and follow-up scheduling.
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#eff6ff', borderRadius: '10px', color: '#1d4ed8', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>🤖 Deep Agent Reasoning & Executing Tools…</div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Querying Cloud SQL EHR, WHO Vector Search & Speech API</div>
              </div>
            )}

            {/* Response Output */}
            {response && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Speech Transcript if applicable */}
                {response.audio_transcript && (
                  <div style={{ backgroundColor: '#fdf4ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f0abfc', fontSize: '0.8rem', color: '#86198f' }}>
                    🎤 <strong>Speech-to-Text Transcript:</strong> "{response.audio_transcript}"
                  </div>
                )}

                {/* Tool Calling Execution Logs */}
                {response.tool_calls_executed && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                      🔧 Autonomous Tool Calls Executed ({response.tool_calls_executed.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {response.tool_calls_executed.map((tc: any, i: number) => (
                        <div key={i} style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: '#0f172a', backgroundColor: 'white', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                          ⚡ <code>{tc.tool}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent Synthesis */}
                <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: '6px' }}>
                    ✨ Agent Clinical Action Plan
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#14532d', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {response.synthesis}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Bar */}
          <form onSubmit={handleTextSubmit} style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', backgroundColor: '#f8fafc' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type clinical query or use microphone…"
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.825rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              type="button"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              style={{
                backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0 12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              title="Voice Input (Speech-to-Text V2)"
            >
              {isRecording ? '⏹️' : '🎙️'}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0 14px',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </>
  );
};
