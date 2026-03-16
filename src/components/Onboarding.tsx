import React, { useState, useEffect, useCallback } from 'react';

interface OnboardingProps {
  onEnter: () => void;
}

const BOOT_MESSAGES = [
  '> VASTAV AGENT v4.0 — BOOT SEQUENCE INITIATED',
  '> Loading Google Gemini 2.5 Flash Neural Core...',
  '> Mounting 6 Judicial AI Modules...',
  '> J1: Forensic & Biometric .............. [OK]',
  '> J2: AI Artifacts & Neural ............. [OK]',
  '> J3: Contextual & Semantic ............. [OK]',
  '> J4: Physics & Lighting ................ [OK]',
  '> J5: Chief Justice ..................... [OK]',
  '> J6: SynthID Specialist ................ [OK]',
  '> Consensus Engine ...................... [ONLINE]',
  '> ALL SYSTEMS OPERATIONAL. AWAITING OPERATOR.',
];

const JUDGE_LABELS = ['Forensic', 'Neural', 'Context', 'Physics', 'Chief', 'SynthID'];

export const OnboardingScreen: React.FC<OnboardingProps> = ({ onEnter }) => {
  const [step, setStep] = useState(0); // 0=Intro, 1=Boot, 2=Architecture, 3=Auth
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [activeNodes, setActiveNodes] = useState(0);
  const [dataFlow, setDataFlow] = useState(0);
  const [visible, setVisible] = useState(true);

  // Skip handler — any click or key skips to auth
  const skip = useCallback(() => {
    if (step < 3) setStep(3);
  }, [step]);

  useEffect(() => {
    const handleKey = () => skip();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [skip]);

  // STEP 0 → 1: Cinematic intro quote
  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), 5000);
    return () => clearTimeout(t);
  }, [step]);

  // STEP 1: Boot sequence
  useEffect(() => {
    if (step !== 1) return;
    setBootLines([]);
    setActiveNodes(0);
    let idx = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (idx < BOOT_MESSAGES.length) {
        const msg = BOOT_MESSAGES[idx];
        setBootLines(prev => [...prev, msg]);
        if (idx >= 3 && idx <= 8) setActiveNodes(idx - 2);
        idx++;
        setTimeout(tick, 320);
      } else {
        setTimeout(() => { if (!cancelled) setStep(2); }, 1800);
      }
    };
    setTimeout(tick, 400);
    return () => { cancelled = true; };
  }, [step]);

  // STEP 2: Architecture + auto-advance
  useEffect(() => {
    if (step !== 2) return;
    const flowTimer = setInterval(() => setDataFlow(p => (p + 1) % 4), 1500);
    const t = setTimeout(() => setStep(3), 7000);
    return () => { clearInterval(flowTimer); clearTimeout(t); };
  }, [step]);

  const fadeOut = (cb: () => void) => {
    setVisible(false);
    setTimeout(cb, 800);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif', background: '#050505', color: '#F5F5F7' }}
      onClick={step < 3 ? skip : undefined}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(0,229,255,0.05) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 70%, rgba(123,97,255,0.04) 0%, transparent 50%)' }} />
      </div>

      {/* Skip hint — shown during steps 0-2 */}
      {step < 3 && (
        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.3em', cursor: 'pointer', userSelect: 'none', zIndex: 10 }}
          onClick={e => { e.stopPropagation(); skip(); }}>
          Press any key to skip →
        </div>
      )}

      {/* ── STEP 0: PHILOSOPHY ── */}
      {step === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          style={{ animation: 'ob-fadein 2s ease forwards' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 24px #00E5FF', margin: '0 auto 5rem', animation: 'ob-pulse 2.5s ease-in-out infinite' }} />
          <h1 style={{ fontSize: 'clamp(1.8rem,4.5vw,4rem)', fontWeight: 300, lineHeight: 1.35, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.025em', marginBottom: '1.25rem' }}>
            Truth is rarely singular.
          </h1>
          <p style={{ fontSize: 'clamp(1.5rem,4vw,3.5rem)', fontWeight: 300, color: '#fff', letterSpacing: '-0.025em', textShadow: '0 0 80px rgba(0,229,255,0.25)', animation: 'ob-fadein 2s ease 1s both' }}>
            It emerges from consensus.
          </p>
        </div>
      )}

      {/* ── STEP 1: BOOT SEQUENCE ── */}
      {step === 1 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ animation: 'ob-fadein 0.8s ease forwards' }}>
          {/* Neural center pulse */}
          <div style={{ position: 'relative', marginBottom: '3.5rem' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,229,255,0.08)', filter: 'blur(20px)', animation: 'ob-pulse 2s infinite' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 30px #00E5FF', position: 'relative', zIndex: 1 }} />
          </div>

          {/* 6 Judge Nodes */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3.5rem', alignItems: 'flex-start', position: 'relative' }}>
            {/* Connection lines svg */}
            <svg style={{ position: 'absolute', top: 6, left: 0, width: '100%', height: 12, overflow: 'visible', pointerEvents: 'none' }}>
              {[0,1,2,3,4].map(i => (
                <line key={i}
                  x1={`${i * 20 + 10}%`} y1="50%" x2={`${(i+1)*20+10}%`} y2="50%"
                  stroke="#00E5FF" strokeWidth="1"
                  strokeOpacity={activeNodes > i + 1 ? 0.4 : 0}
                  style={{ transition: 'stroke-opacity 0.6s ease' }}
                />
              ))}
            </svg>
            {JUDGE_LABELS.map((label, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', position: 'relative',
                  background: activeNodes > i ? '#00E5FF' : 'rgba(255,255,255,0.1)',
                  boxShadow: activeNodes > i ? '0 0 20px #00E5FF' : 'none',
                  transform: activeNodes > i ? 'scale(1)' : 'scale(0.6)',
                  transition: 'all 0.6s ease'
                }}>
                  {activeNodes > i && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(0,229,255,0.4)', animation: 'ob-ping 2s ease-in-out infinite' }} />}
                </div>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Boot messages terminal */}
          <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {bootLines.filter(Boolean).map((line, i) => {
              const isSpecial = line.includes('[ONLINE]') || line.includes('OPERATIONAL');
              const isOk = line.includes('[OK]');
              return (
                <div key={i} style={{
                  fontSize: 12, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                  color: isSpecial ? '#00E5FF' : isOk ? 'rgba(0,255,163,0.7)' : 'rgba(255,255,255,0.45)',
                  textShadow: isSpecial ? '0 0 20px rgba(0,229,255,0.5)' : 'none',
                  fontWeight: isSpecial ? 500 : 400,
                  animation: 'ob-fadein 0.4s ease forwards'
                }}>
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 2: ARCHITECTURE ── */}
      {step === 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ animation: 'ob-fadein 1s ease forwards' }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '4rem' }}>
            System Architecture
          </p>

          {/* Horizontal flow diagram */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>

            {/* Evidence Node */}
            <ArchNode label="Evidence Input" active={dataFlow === 0} color="#00E5FF">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.6, animation: 'ob-pulse 2s infinite' }} />
            </ArchNode>

            <FlowArrow color="rgba(0,229,255,0.4)" />

            {/* Judges */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                AI Analysis Layer
              </span>
              {JUDGE_LABELS.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 26, borderRadius: 7, border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 8px #00E5FF', animation: 'ob-pulse 2s infinite', animationDelay: `${i * 0.15}s` }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>{label}</span>
                </div>
              ))}
            </div>

            <FlowArrow color="rgba(123,97,255,0.5)" />

            {/* Consensus */}
            <ArchNode label="Consensus Engine" active={dataFlow === 2} color="#7B61FF" spin>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7B61FF', boxShadow: '0 0 20px #7B61FF' }} />
            </ArchNode>

            <FlowArrow color="rgba(255,255,255,0.2)" />

            {/* Verdict */}
            <ArchNode label="Final Verdict" active={dataFlow === 3} color="#fff">
              <div style={{ width: 3, height: 28, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
            </ArchNode>
          </div>

          <p style={{ marginTop: '3.5rem', fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: 300, letterSpacing: '0.02em', animation: 'ob-fadein 1s ease 1s both' }}>
            Multiple intelligences. One verified truth.
          </p>
        </div>
      )}

      {/* ── STEP 3: OPERATOR AUTH ── */}
      {step === 3 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ animation: 'ob-fadein 1.2s ease forwards' }}>

          {/* Rotating aura */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(0,229,255,0.06), rgba(123,97,255,0.06), rgba(0,229,255,0.06))', filter: 'blur(60px)', animation: 'ob-spin 30s linear infinite', pointerEvents: 'none', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Logo */}
            <div style={{ position: 'relative', marginBottom: '3rem' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,229,255,0.2)', filter: 'blur(25px)', animation: 'ob-pulse 4s ease infinite' }} />
              <img src="/AGENT.png" alt="VASTAV" style={{ width: 72, height: 72, position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.4))' }}
                onError={(e: any) => { e.target.style.display = 'none'; }} />
            </div>

            <h2 style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.55em', marginBottom: '2.5rem', fontWeight: 300 }}>
              Operator Access Required
            </h2>

            {/* Glassmorphic panel */}
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', padding: '2.25rem', borderRadius: 24, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 20px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)', boxSizing: 'border-box' as const }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
                <input type="text" disabled value="VASTAV-0X-ADMIN"
                  style={{ width: '100%', boxSizing: 'border-box' as const, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.9rem 1.25rem', fontSize: 13, color: 'rgba(255,255,255,0.55)', borderRadius: 12, outline: 'none', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }} />
                <input type="password" disabled value="••••••••••••"
                  style={{ width: '100%', boxSizing: 'border-box' as const, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.9rem 1.25rem', fontSize: 13, color: 'rgba(255,255,255,0.55)', borderRadius: 12, outline: 'none', fontFamily: 'Inter, sans-serif', letterSpacing: '0.25em' }} />
              </div>
              <button onClick={onEnter}
                style={{ width: '100%', padding: '1.1rem', borderRadius: 12, background: '#fff', color: '#000', fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 30px rgba(255,255,255,0.1)' }}
                onMouseOver={(e: any) => { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 12px 40px rgba(255,255,255,0.2)'; }}
                onMouseOut={(e: any) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 8px 30px rgba(255,255,255,0.1)'; }}>
                Access System
              </button>
            </div>

            {/* Credits */}
            <div style={{ marginTop: '3rem', textAlign: 'center', animation: 'ob-fadein 1s ease 0.5s both' }}>
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '0.6rem', fontWeight: 300 }}>
                Engineered By
              </p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 300, textShadow: '0 0 30px rgba(255,255,255,0.15)', cursor: 'default' }}>
                NAVNEET SINGH
              </p>
              <p style={{ fontSize: 8, color: 'rgba(0,229,255,0.5)', letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: '0.6rem', fontWeight: 300, animation: 'ob-glow 3s ease-in-out infinite' }}>
                Ekoahamdutivnasti Technologies
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global keyframe styles */}
      <style>{`
        @keyframes ob-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ob-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes ob-spin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes ob-ping {
          0% { transform: scale(1); opacity: 0.8; }
          80%, 100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes ob-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(0,229,255,0.3); }
          50% { text-shadow: 0 0 25px rgba(0,229,255,0.7); }
        }
      `}</style>
    </div>
  );
};

// ── Helper sub-components ──

function ArchNode({ label, active, color, spin, children }: { label: string; active: boolean; color: string; spin?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', position: 'relative',
        boxShadow: active ? `0 0 30px ${color}22` : 'none',
        transition: 'all 1.5s ease',
        animation: spin ? 'ob-spin-node 15s linear infinite' : undefined
      }}>
        {spin && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px dashed ${color}40` }} />}
        {children}
      </div>
      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

function FlowArrow({ color }: { color: string }) {
  return (
    <div style={{ color, fontSize: 22, flexShrink: 0, userSelect: 'none', filter: `drop-shadow(0 0 6px ${color})` }}>
      →
    </div>
  );
}
