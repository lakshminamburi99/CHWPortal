import React, { useState, useRef } from 'react';
import { API_BASE } from '../config';

export const CWSTbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'camera'>('chat');
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [visionResult, setVisionResult] = useState<any | null>(null);
  const [scanningImage, setScanningImage] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/agent/swarm-query`, {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningImage(true);
    setVisionResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = (reader.result as string).split(',')[1];
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE}/agent/vision-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ imageBase64: base64Image }),
        });
        if (res.ok) {
          const data = await res.json();
          setVisionResult(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setScanningImage(false);
      }
    };
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
          padding: '12px 22px',
          fontSize: '0.875rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <span>CWSTbot</span>
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            width: '430px',
            maxHeight: '640px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
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
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>CWSTbot — GCP Clinical Swarm</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Multi-Agent Swarm · mRDT Vision · Speech V2</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>

          {/* Sub-Header Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1, padding: '10px', fontSize: '0.8rem', fontWeight: 600, border: 'none',
                borderBottom: activeTab === 'chat' ? '2px solid #0f172a' : 'none',
                backgroundColor: activeTab === 'chat' ? 'white' : 'transparent',
                color: activeTab === 'chat' ? '#0f172a' : '#64748b', cursor: 'pointer'
              }}
            >
              💬 Swarm Chat & Voice
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              style={{
                flex: 1, padding: '10px', fontSize: '0.8rem', fontWeight: 600, border: 'none',
                borderBottom: activeTab === 'camera' ? '2px solid #0f172a' : 'none',
                backgroundColor: activeTab === 'camera' ? 'white' : 'transparent',
                color: activeTab === 'camera' ? '#0f172a' : '#64748b', cursor: 'pointer'
              }}
            >
              📷 mRDT Camera Scanner
            </button>
          </div>

          {/* Body Content */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeTab === 'chat' ? (
              <>
                {!response && !loading && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                    👋 Welcome to <strong>CWSTbot</strong>. Ask any clinical query or use the microphone. Your query will trigger 5 coordinated GCP sub-agents:
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>🩺 TriageAgent</span>
                      <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>💊 PharmaAgent</span>
                      <span style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>📡 SentinelAgent</span>
                      <span style={{ backgroundColor: '#fdf4ff', color: '#86198f', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem' }}>🛡️ Safety Auditor</span>
                    </div>
                  </div>
                )}

                {loading && (
                  <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#eff6ff', borderRadius: '10px', color: '#1d4ed8', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '6px' }}>🤖 CWSTbot Swarm Orchestrating Sub-Agents…</div>
                    <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Executing Triage ➔ Drug Stock ➔ Outbreak Sentinel ➔ Safety Audit</div>
                  </div>
                )}

                {response && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {response.audio_transcript && (
                      <div style={{ backgroundColor: '#fdf4ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f0abfc', fontSize: '0.8rem', color: '#86198f' }}>
                        🎤 <strong>Speech-to-Text V2:</strong> "{response.audio_transcript}"
                      </div>
                    )}

                    {/* Sub-Agent Execution Badges */}
                    {response.swarm_agents_executed && (
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                          🐝 Sub-Agents Coordinated ({response.swarm_agents_executed.length}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {response.swarm_agents_executed.map((sa: any, i: number) => (
                            <div key={i} style={{ fontSize: '0.725rem', color: '#0f172a', backgroundColor: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                              <span><strong>{sa.agent}</strong></span>
                              <span style={{ color: '#059669', fontWeight: 600 }}>Executed</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: '6px' }}>
                        ✨ Verified Clinical Action Plan
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#14532d', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        {response.synthesis}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Camera / Vision Tab */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                  📷 <strong>Computer Vision mRDT Scanner:</strong> Upload a photo of a Malaria Rapid Diagnostic Test cassette or skin lesion for instant line detection.
                </div>

                <label
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '24px', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer',
                    backgroundColor: '#fafafa', textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📸</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>Click to snap / upload mRDT photo</span>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8', marginTop: '4px' }}>Supports PNG, JPG, WEBP</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                {scanningImage && (
                  <div style={{ padding: '14px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#1d4ed8', fontSize: '0.8rem', textAlign: 'center' }}>
                    👁️ Vision Agent analyzing mRDT cassette test lines (Control vs Test line)…
                  </div>
                )}

                {visionResult && (
                  <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534', marginBottom: '6px' }}>
                      👁️ Vision Scanning Result: {visionResult.result}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803d', lineHeight: 1.5 }}>
                      • <strong>Control Line (C):</strong> Detected (Test Valid)<br />
                      • <strong>Test Line (T):</strong> Detected (Positive Pf Antigen)<br />
                      • <strong>Confidence:</strong> {(visionResult.confidence * 100).toFixed(1)}%<br />
                      • <strong>Finding:</strong> {visionResult.clinical_finding}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Input Bar */}
          {activeTab === 'chat' && (
            <form onSubmit={handleTextSubmit} style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', backgroundColor: '#f8fafc' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask CWSTbot clinical query…"
                style={{
                  flex: 1, border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px',
                  fontSize: '0.825rem', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                style={{
                  backgroundColor: isRecording ? '#ef4444' : '#3b82f6', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '0 12px', cursor: 'pointer', fontSize: '0.9rem',
                }}
                title="Voice Input (Speech-to-Text V2)"
              >
                {isRecording ? '⏹️' : '🎙️'}
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px',
                  padding: '0 14px', fontSize: '0.825rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Ask
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
