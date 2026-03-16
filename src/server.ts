import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import exif from "exif-reader";
import { exec } from "child_process";
import { runJudgePanel } from "./agents/judgePanel.js";

dotenv.config();

export function log(message: string, source = "VASTAV") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
const PORT = process.env.PORT || 3100;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Multer — save uploads to /tmp
const upload = multer({
  dest: "/tmp/vastav-uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ─────────────────────────────────────────────────────
// GET /AGENT.png — Serve the logo
// ─────────────────────────────────────────────────────
app.get("/AGENT.png", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "AGENT.png"));
});

// ─────────────────────────────────────────────────────
// Static SFX files
// ─────────────────────────────────────────────────────
app.use("/sfx", express.static(path.join(process.cwd(), "SFX")));

// ─────────────────────────────────────────────────────
// GET / — Full Frontend Dashboard (V2 Hackathon Edition)
// ─────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>VASTAV Agent | AI Deepfake Detection System</title>
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            bg: '#050A14', bg2: '#0B1624', bg3: '#0f1f36',
            cyan: '#00F5FF', blue: '#2BD9FF', green: '#00FFA3', red: '#FF3B5C', purple: '#7B61FF',
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Space Grotesk', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          animation: {
            'spin-slow': 'spin 8s linear infinite',
            'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
            'cyber-scan': 'cyberScan 2s linear infinite',
            'grad-shift': 'gradShift 3s ease infinite',
          },
          keyframes: {
            pulseGlow: { '0%, 100%': { opacity: 0.5 }, '50%': { opacity: 1, filter: 'drop-shadow(0 0 10px #00F5FF)' } },
            cyberScan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
            gradShift: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } }
          }
        }
      }
    }
  </script>
  
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
  
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-is@18/umd/react-is.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/prop-types@15/prop-types.min.js" crossorigin></script>
  <script src="https://unpkg.com/framer-motion@10.12.16/dist/framer-motion.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>

  <style>
    body { background: #050A14; color: #E2E8F0; overflow-x: hidden; }
    
    /* Animated Grid Background */
    .bg-grid {
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(0,245,255,0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,245,255,0.03) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 20%, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 20%, transparent 80%);
    }

    /* Floating Particles */
    .particles { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
    .particle {
      position: absolute; border-radius: 50%;
      background: #00F5FF; box-shadow: 0 0 10px #00F5FF;
      animation: float-up var(--duration) linear infinite;
      opacity: var(--opacity);
    }
    @keyframes float-up {
      0% { transform: translateY(100vh) scale(0); opacity: 0; }
      10% { opacity: var(--opacity); transform: translateY(90vh) scale(1); }
      90% { opacity: var(--opacity); transform: translateY(10vh) scale(1); }
      100% { transform: translateY(-10vh) scale(0); opacity: 0; }
    }

    /* Glass Panels */
    .glass-panel {
      background: rgba(11, 22, 36, 0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
      transition: all 0.3s ease;
    }
    .glass-panel:hover { border-color: rgba(0, 245, 255, 0.3); box-shadow: 0 8px 40px rgba(0, 245, 255, 0.1); }

    /* Matrix Terminal Scrollbar */
    .terminal-scroll::-webkit-scrollbar { width: 4px; }
    .terminal-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    .terminal-scroll::-webkit-scrollbar-thumb { background: #00F5FF; border-radius: 4px; }
    
    .gradient-text { background: linear-gradient(135deg, #00F5FF, #2BD9FF, #00FFA3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .text-glow { text-shadow: 0 0 20px rgba(0, 245, 255, 0.5); }
    
    #root-app { position: relative; z-index: 10; min-height: 100vh; display: flex; flex-direction: column; }
    
    /* Scanning bar animation for live judge cards */
    @keyframes scanBar {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(150%); }
      100% { transform: translateX(350%); }
    }
    
    /* Terminal scanline effect */
    @keyframes scan {
      0% { transform: translateY(0); }
      100% { transform: translateY(100%); }
    }
    
    /* Log slide in animation */
    @keyframes slideIn {
      from { 
        opacity: 0; 
        transform: translateX(-10px);
      }
      to { 
        opacity: 1; 
        transform: translateX(0);
      }
    }
  
    /* Onboarding animations */
    @keyframes ob-fadein { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes ob-pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
    @keyframes ob-spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    .ob-step { animation: ob-fadein 0.8s ease forwards; }
    .ob-line { animation: ob-fadein 0.3s ease forwards; }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="particles" id="particles"></div>
  
  <div id="root-app"></div>

  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" data-type="module">
    const { useState, useEffect, useRef } = React;
    const { motion, AnimatePresence } = window.Motion;
    const { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } = window.Recharts;

    const judgeNames = [
      { short: 'J1', name: 'Forensic & Biometric', icon: '🔬', desc: 'Edge signatures & biometric analysis' },
      { short: 'J2', name: 'AI Artifacts & Neural', icon: '🧬', desc: 'GAN/Diffusion detection & EXIF audit' },
      { short: 'J3', name: 'Contextual & Semantic', icon: '🧠', desc: 'Semantic logic & cultural consistency' },
      { short: 'J4', name: 'Physics & Lighting', icon: '⚡', desc: '3D light vectors & gravity analysis' },
      { short: 'J5', name: 'Chief Justice', icon: '👑', desc: 'Aggregating all signals' },
      { short: 'J6', name: 'SynthID Specialist', icon: '🛡️', desc: 'Google SynthID watermark detection' },
    ];
    const JUDGE_PHASES = ['INITIALIZING', 'SCANNING', 'DELIBERATING', 'COMPLETE'];

    function Typewriter({ text, speed = 30, className = "" }) {
      const [displayed, setDisplayed] = useState('');
      useEffect(() => {
        let i = 0;
        setDisplayed('');
        const timer = setInterval(() => {
          if (i < text.length) { setDisplayed(prev => prev + text.charAt(i)); i++; } 
          else clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
      }, [text, speed]);
      return <span className={className}>{displayed}<span className="animate-pulse">_</span></span>;
    }

    const BOOT_LINES = [
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
      '> SFX Audio Pipeline .................... [ACTIVE]',
      '> EXIF Metadata Extractor ............... [READY]',
      '> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '> ALL SYSTEMS OPERATIONAL. AWAITING OPERATOR.',
    ];

    // ====== ONBOARDING COMPONENT ======
    const BOOT_MSGS = [
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
      '> ALL SYSTEMS OPERATIONAL. AWAITING OPERATOR.'
    ];
    const OB_LABELS = ['Forensic','Neural','Context','Physics','Chief','SynthID'];

    function OnboardingScreen({ onEnter }) {
      const [step, setStep] = React.useState(0);
      const [bootLines, setBootLines] = React.useState([]);
      const [activeNodes, setActiveNodes] = React.useState(0);
      const [dataFlow, setDataFlow] = React.useState(0);

      const skip = React.useCallback(() => {
        setStep(s => s < 3 ? 3 : s);
      }, []);

      React.useEffect(() => {
        const h = () => skip();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
      }, [skip]);

      React.useEffect(() => {
        if (step !== 0) return;
        const t = setTimeout(() => setStep(1), 5000);
        return () => clearTimeout(t);
      }, [step]);

      React.useEffect(() => {
        if (step !== 1) return;
        setBootLines([]);
        setActiveNodes(0);
        let idx = 0;
        let cancelled = false;
        const tick = () => {
          if (cancelled) return;
          if (idx < BOOT_MSGS.length) {
            const msg = BOOT_MSGS[idx];
            if (msg) {
              setBootLines(prev => [...prev, msg]);
              if (idx >= 3 && idx <= 8) setActiveNodes(idx - 2);
            }
            idx++;
            setTimeout(tick, 340);
          } else {
            setTimeout(() => { if (!cancelled) setStep(2); }, 1800);
          }
        };
        setTimeout(tick, 300);
        return () => { cancelled = true; };
      }, [step]);

      React.useEffect(() => {
        if (step !== 2) return;
        const ft = setInterval(() => setDataFlow(p => (p + 1) % 4), 1200);
        // Step 2 does NOT auto-advance — user clicks Continue
        return () => { clearInterval(ft); };
      }, [step]);

      const S = { position:'relative', zIndex:1 };

      return React.createElement('div', {
        style: { position:'fixed',inset:0,zIndex:9999,overflow:'hidden',fontFamily:'Inter,sans-serif',background:'#050505',color:'#F5F5F7',cursor: step < 3 ? 'pointer' : 'default' },
        onClick: step < 3 ? skip : null
      },
        // Background glow
        React.createElement('div', { style:{ position:'absolute',inset:0,pointerEvents:'none',background:'radial-gradient(ellipse at 50% 40%, rgba(0,229,255,0.05) 0%, transparent 55%)' } }),

        // Skip hint
        step < 3 && React.createElement('div', {
          style:{ position:'absolute',bottom:'2rem',right:'2rem',fontSize:10,color:'rgba(255,255,255,0.2)',textTransform:'uppercase',letterSpacing:'0.3em',zIndex:10,userSelect:'none' }
        }, 'Press any key to skip →'),

        // STEP 0: Philosophy
        step === 0 && React.createElement('div', {
          style:{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 2rem',animation:'ob-fadein 2s ease forwards' }
        },
          React.createElement('div', { style:{ width:8,height:8,borderRadius:'50%',background:'#00E5FF',boxShadow:'0 0 24px #00E5FF',margin:'0 auto 5rem',animation:'ob-pulse 2.5s ease-in-out infinite' } }),
          React.createElement('h1', { style:{ fontSize:'clamp(1.8rem,4.5vw,4rem)',fontWeight:300,lineHeight:1.35,color:'rgba(255,255,255,0.88)',letterSpacing:'-0.025em',marginBottom:'1.25rem' } }, 'Truth is rarely singular.'),
          React.createElement('p', { style:{ fontSize:'clamp(1.5rem,4vw,3.5rem)',fontWeight:300,color:'#fff',letterSpacing:'-0.025em',textShadow:'0 0 80px rgba(0,229,255,0.25)' } }, 'It emerges from consensus.')
        ),

        // STEP 1: Boot Sequence
        step === 1 && React.createElement('div', {
          style:{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 1.5rem',animation:'ob-fadein 0.8s ease forwards' }
        },
          // Neural center dot
          React.createElement('div', { style:{ position:'relative',marginBottom:'3.5rem' } },
            React.createElement('div', { style:{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:80,height:80,borderRadius:'50%',background:'rgba(0,229,255,0.07)',filter:'blur(20px)',animation:'ob-pulse 2s infinite' } }),
            React.createElement('div', { style:{ width:10,height:10,borderRadius:'50%',background:'#00E5FF',boxShadow:'0 0 30px #00E5FF',position:'relative',zIndex:1 } })
          ),
          // 6 nodes
          React.createElement('div', { style:{ display:'flex',gap:'1.75rem',marginBottom:'3.5rem',alignItems:'flex-start' } },
            OB_LABELS.map((label, i) =>
              React.createElement('div', { key:i, style:{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 } },
                React.createElement('div', { style:{ width:12,height:12,borderRadius:'50%',background: activeNodes > i ? '#00E5FF' : 'rgba(255,255,255,0.1)',boxShadow: activeNodes > i ? '0 0 20px #00E5FF' : 'none',transform: activeNodes > i ? 'scale(1)' : 'scale(0.5)',transition:'all 0.6s ease' } }),
                React.createElement('span', { style:{ fontSize:8,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.06em',whiteSpace:'nowrap' } }, label)
              )
            )
          ),
          // Boot messages
          React.createElement('div', { style:{ width:'100%',maxWidth:640,display:'flex',flexDirection:'column',gap:9 } },
            bootLines.filter(Boolean).map((line, i) => {
              const isOnline = line.includes('[ONLINE]') || line.includes('OPERATIONAL');
              const isOk = line.includes('[OK]');
              return React.createElement('div', { key:i, style:{ fontSize:12,fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.04em',color: isOnline ? '#00E5FF' : isOk ? 'rgba(0,255,163,0.7)' : 'rgba(255,255,255,0.45)',textShadow: isOnline ? '0 0 20px rgba(0,229,255,0.5)' : 'none',fontWeight: isOnline ? 500 : 400,animation:'ob-fadein 0.4s ease forwards' } }, line);
            })
          )
        ),

        // STEP 2: Architecture Diagram
        step === 2 && React.createElement('div', {
          style:{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 1.5rem',animation:'ob-fadein 1s ease forwards' }
        },
          React.createElement('p', { style:{ fontSize:9,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.4em',marginBottom:'4rem' } }, 'System Architecture'),
          React.createElement('div', { style:{ display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap',justifyContent:'center',maxWidth:900 } },
            // Evidence
            React.createElement('div', { style:{ display:'flex',flexDirection:'column',alignItems:'center',gap:12 } },
              React.createElement('div', { style:{ width:64,height:64,borderRadius:'50%',border: dataFlow===0 ? '1px solid rgba(0,229,255,0.6)' : '1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',boxShadow: dataFlow===0 ? '0 0 30px rgba(0,229,255,0.2)' : 'none',transition:'all 1.5s ease' } },
                React.createElement('div', { style:{ width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,0.5)',animation:'ob-pulse 2s infinite' } })
              ),
              React.createElement('span', { style:{ fontSize:8,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.12em',whiteSpace:'nowrap' } }, 'Evidence Input')
            ),
            React.createElement('div', { style:{ color:'rgba(0,229,255,0.5)',fontSize:22,filter:'drop-shadow(0 0 6px rgba(0,229,255,0.4))' } }, '→'),
            // Judges
            React.createElement('div', { style:{ display:'flex',flexDirection:'column',gap:7 } },
              React.createElement('span', { style:{ fontSize:8,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.1em',textAlign:'center',marginBottom:8 } }, 'AI Analysis Layer'),
              OB_LABELS.map((label, i) =>
                React.createElement('div', { key:i, style:{ display:'flex',alignItems:'center',gap:10 } },
                  React.createElement('div', { style:{ width:30,height:24,borderRadius:7,border:'1px solid rgba(0,229,255,0.2)',background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center' } },
                    React.createElement('div', { style:{ width:6,height:6,borderRadius:'50%',background:'#00E5FF',boxShadow:'0 0 8px #00E5FF',animation:'ob-pulse 2s infinite',animationDelay:(i*0.15)+'s' } })
                  ),
                  React.createElement('span', { style:{ fontSize:9,color:'rgba(255,255,255,0.35)' } }, label)
                )
              )
            ),
            React.createElement('div', { style:{ color:'rgba(123,97,255,0.6)',fontSize:22,filter:'drop-shadow(0 0 6px rgba(123,97,255,0.4))' } }, '→'),
            // Consensus
            React.createElement('div', { style:{ display:'flex',flexDirection:'column',alignItems:'center',gap:12 } },
              React.createElement('div', { style:{ width:68,height:68,borderRadius:'50%',border: dataFlow===2 ? '1px solid rgba(123,97,255,0.6)' : '1px solid rgba(123,97,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',position:'relative',boxShadow: dataFlow===2 ? '0 0 30px rgba(123,97,255,0.25)' : 'none',transition:'all 1.5s ease' } },
                React.createElement('div', { style:{ position:'absolute',inset:0,borderRadius:'50%',border:'1px dashed rgba(123,97,255,0.3)',animation:'ob-spin-slow 15s linear infinite' } }),
                React.createElement('div', { style:{ width:10,height:10,borderRadius:'50%',background:'#7B61FF',boxShadow:'0 0 20px #7B61FF',zIndex:1 } })
              ),
              React.createElement('span', { style:{ fontSize:8,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.12em',whiteSpace:'nowrap' } }, 'Consensus Engine')
            ),
            React.createElement('div', { style:{ color:'rgba(255,255,255,0.3)',fontSize:22 } }, '→'),
            // Verdict
            React.createElement('div', { style:{ display:'flex',flexDirection:'column',alignItems:'center',gap:12 } },
              React.createElement('div', { style:{ width:64,height:64,borderRadius:'50%',border: dataFlow===3 ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',boxShadow: dataFlow===3 ? '0 0 30px rgba(255,255,255,0.15)' : 'none',transition:'all 1.5s ease' } },
                React.createElement('div', { style:{ width:3,height:28,background:'rgba(255,255,255,0.75)',borderRadius:2 } })
              ),
              React.createElement('span', { style:{ fontSize:8,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.12em' } }, 'Final Verdict')
            )
          ),
          React.createElement('p', { style:{ marginTop:'3.5rem',fontSize:15,color:'rgba(255,255,255,0.4)',fontWeight:300,letterSpacing:'0.02em',animation:'ob-fadein 1s ease 1s both' } }, 'Multiple intelligences. One verified truth.'),
          React.createElement('button', {
            onClick: (e) => { e.stopPropagation(); setStep(3); },
            style:{ marginTop:'2.5rem',padding:'0.75rem 2.5rem',borderRadius:40,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.7)',fontSize:11,letterSpacing:'0.2em',textTransform:'uppercase',cursor:'pointer',fontFamily:'Inter,sans-serif',backdropFilter:'blur(10px)',transition:'all 0.4s ease',animation:'ob-fadein 1s ease 1.5s both' },
            onMouseOver:(e)=>{ e.currentTarget.style.borderColor='rgba(0,229,255,0.5)'; e.currentTarget.style.color='#00E5FF'; e.currentTarget.style.boxShadow='0 0 20px rgba(0,229,255,0.15)'; },
            onMouseOut:(e)=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow='none'; }
          }, 'Continue →')
        ),

        // STEP 3: Auth
        step === 3 && React.createElement('div', {
          style:{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 2rem',animation:'ob-fadein 1.2s ease forwards' }
        },
          // Rotating aura
          React.createElement('div', { style:{ position:'absolute',top:'50%',left:'50%',width:500,height:500,borderRadius:'50%',background:'conic-gradient(from 0deg, rgba(0,229,255,0.05), rgba(123,97,255,0.05), rgba(0,229,255,0.05))',filter:'blur(60px)',animation:'ob-spin-aura 30s linear infinite',pointerEvents:'none',zIndex:0 } }),

          React.createElement('div', { style:{ position:'relative',zIndex:1,width:'100%',maxWidth:400,display:'flex',flexDirection:'column',alignItems:'center' } },
            // Logo  
            React.createElement('div', { style:{ position:'relative',marginBottom:'3rem' } },
              React.createElement('div', { style:{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:80,height:80,borderRadius:'50%',background:'rgba(0,229,255,0.15)',filter:'blur(25px)',animation:'ob-pulse 4s ease infinite' } }),
              React.createElement('img', { src:'/AGENT.png',alt:'VASTAV',style:{ width:72,height:72,position:'relative',zIndex:1,filter:'drop-shadow(0 0 20px rgba(0,229,255,0.4))' },onError:(e)=>{ e.target.style.display='none'; } })
            ),
            React.createElement('h2', { style:{ fontSize:10,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.55em',marginBottom:'2.5rem',fontWeight:300 } }, 'Operator Access Required'),
            // Panel
            React.createElement('div', { style:{ width:'100%',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',padding:'2.25rem',borderRadius:24,backdropFilter:'blur(40px)',boxShadow:'0 20px_80px rgba(0,0,0,0.6)',boxSizing:'border-box' } },
              React.createElement('div', { style:{ display:'flex',flexDirection:'column',gap:'0.875rem',marginBottom:'2rem' } },
                React.createElement('input', { type:'text',disabled:true,value:'VASTAV-0X-ADMIN',style:{ width:'100%',boxSizing:'border-box',background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.07)',padding:'0.9rem 1.25rem',fontSize:13,color:'rgba(255,255,255,0.55)',borderRadius:12,outline:'none',fontFamily:'Inter,sans-serif',letterSpacing:'0.05em' } }),
                React.createElement('input', { type:'password',disabled:true,value:'••••••••••••',style:{ width:'100%',boxSizing:'border-box',background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.07)',padding:'0.9rem 1.25rem',fontSize:13,color:'rgba(255,255,255,0.55)',borderRadius:12,outline:'none',fontFamily:'Inter,sans-serif',letterSpacing:'0.25em' } })
              ),
              React.createElement('button', { onClick:onEnter,style:{ width:'100%',padding:'1.1rem',borderRadius:12,background:'#fff',color:'#000',fontSize:12,fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',border:'none',cursor:'pointer',transition:'all 0.3s ease',fontFamily:'Inter,sans-serif',boxShadow:'0 8px 30px rgba(255,255,255,0.1)' },onMouseOver:(e)=>{ e.currentTarget.style.transform='scale(1.02)'; },onMouseOut:(e)=>{ e.currentTarget.style.transform='scale(1)'; } }, 'Access System')
            ),
            // Credits
            React.createElement('div', { style:{ marginTop:'3rem',textAlign:'center',animation:'ob-fadein 1s ease 0.5s both' } },
              React.createElement('p', { style:{ fontSize:8,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:'0.4em',marginBottom:'0.6rem',fontWeight:300 } }, 'Engineered By'),
              React.createElement('p', { style:{ fontSize:14,color:'rgba(255,255,255,0.85)',letterSpacing:'0.25em',textTransform:'uppercase',fontWeight:300,textShadow:'0 0 30px rgba(255,255,255,0.15)' } }, 'NAVNEET SINGH'),
              React.createElement('p', { style:{ fontSize:8,color:'rgba(0,229,255,0.5)',letterSpacing:'0.3em',textTransform:'uppercase',marginTop:'0.6rem',fontWeight:300,animation:'ob-glow 3s ease-in-out infinite' } }, 'Ekoahamdutivnasti Technologies')
            )
          )
        )
      );
    }
    
function App() {
      const [showOnboarding, setShowOnboarding] = useState(true);
      const [file, setFile] = useState(null);
      const [preview, setPreview] = useState(null);
      const [status, setStatus] = useState('IDLE'); // IDLE, SCANNING, RESULT
      const [logs, setLogs] = useState([]);
      const [result, setResult] = useState(null);
      const [investigatorName, setInvestigatorName] = useState("");
      const [judgeStates, setJudgeStates] = useState(judgeNames.map(() => ({ phase: 0, dots: 0 })));
      const logBoxRef = useRef(null);
      const judgeTimersRef = useRef([]);

      // SFX Audio
      const scanAudio = useRef(null);
      const endAudio = useRef(null);
      const notfakeAudio = useRef(null);
      const wrongAudio = useRef(null);
      useEffect(() => {
        scanAudio.current = new Audio('/sfx/SCAN.mp3');
        endAudio.current = new Audio('/sfx/END.mp3');
        notfakeAudio.current = new Audio('/sfx/notfake.mp3');
        wrongAudio.current = new Audio('/sfx/wrong.mp3');
        scanAudio.current.volume = 0.4;
        endAudio.current.volume = 0.7;
        notfakeAudio.current.volume = 0.8;
        wrongAudio.current.volume = 0.8;
      }, []);
      const playScan = () => {
        if (scanAudio.current) {
          scanAudio.current.currentTime = 0;
          scanAudio.current.play().catch(() => {});
        }
      };
      const playEnd = () => {
        if (endAudio.current) {
          endAudio.current.currentTime = 0;
          endAudio.current.play().catch(() => {});
        }
      };
      const playVerdict = (isReal) => {
        if (isReal && notfakeAudio.current) {
          notfakeAudio.current.currentTime = 0;
          notfakeAudio.current.play().catch(() => {});
        } else if (!isReal && wrongAudio.current) {
          wrongAudio.current.currentTime = 0;
          wrongAudio.current.play().catch(() => {});
        }
      };

      // Create particles on mount
      useEffect(() => {
        const pContainer = document.getElementById('particles');
        for(let i=0; i<30; i++) {
          const p = document.createElement('div');
          p.className = 'particle';
          p.style.left = Math.random() * 100 + 'vw';
          p.style.width = Math.random() * 3 + 1 + 'px';
          p.style.height = p.style.width;
          p.style.setProperty('--duration', (Math.random() * 15 + 10) + 's');
          p.style.setProperty('--opacity', Math.random() * 0.5 + 0.1);
          p.style.animationDelay = (Math.random() * 10) + 's';
          pContainer.appendChild(p);
        }
      }, []);

      useEffect(() => { if(logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight; }, [logs]);

      const onDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer?.files[0] || e.target.files[0];
        if(f) {
          setFile(f);
          setPreview(URL.createObjectURL(f));
          setStatus('IDLE');
          setResult(null);
          setLogs([]);
        }
      };

      const addLog = (msg) => setLogs(p => [...p, { time: new Date().toLocaleTimeString(), msg }]);

      // Animate each judge through phases with staggered delays
      const startJudgeAnimations = () => {
        setJudgeStates(judgeNames.map(() => ({ phase: 0, dots: 0 })));
        judgeTimersRef.current.forEach(t => clearInterval(t));
        judgeTimersRef.current = [];

        judgeNames.forEach((_, idx) => {
          const startDelay = idx * 600;
          let currentPhase = 0;
          const phaseTimer = setInterval(() => {
            currentPhase = Math.min(currentPhase + 1, 2);
            setJudgeStates(prev => prev.map((s, i) => i === idx ? { ...s, phase: currentPhase } : s));
            playScan(); // 🔊 Play scan SFX on each phase transition
            if (currentPhase >= 2) clearInterval(phaseTimer);
          }, 1800);

          const dotsTimer = setInterval(() => {
            setJudgeStates(prev => prev.map((s, i) => i === idx ? { ...s, dots: (s.dots + 1) % 4 } : s));
          }, 500);

          judgeTimersRef.current.push(phaseTimer, dotsTimer);

          setTimeout(() => {
            setJudgeStates(prev => prev.map((s, i) => i === idx ? { ...s, phase: 0 } : s));
          }, startDelay);
        });
      };

      const stopJudgeAnimations = (verdict) => {
        judgeTimersRef.current.forEach(t => clearInterval(t));
        judgeTimersRef.current = [];
        setJudgeStates(judgeNames.map(() => ({ phase: 3, dots: 0 })));
        playEnd(); // 🔊 Play end SFX when judges complete
        // Play verdict-specific SFX after a short delay
        setTimeout(() => playVerdict(verdict === 'REAL'), 800);
      };

      const speakVerdict = (res) => {
        if (!window.speechSynthesis) return;
        const c = res.consensus;
        const judgeCount = res.judges.filter(j => j.verdict === c.finalVerdict).length;
        const text = 'Analysis complete. ' + judgeCount + ' out of 6 judges detected this as ' + c.finalVerdict + '. Confidence: ' + c.adjustedConfidence + ' percent.';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      };

      const runAnalysis = async () => {
        if(!file) return;
        setStatus('SCANNING');
        addLog("[SYS] Initializing VASTAV Agent Core System...");
        addLog("[NET] Connecting to ensemble models...");
        startJudgeAnimations();

        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/analyze", { method: "POST", body: fd });
          const data = await res.json();
          if(!res.ok) throw new Error(data.error);
          
          // Display all the real-time logs from the backend
          if (data.logs && Array.isArray(data.logs)) {
            data.logs.forEach(logMsg => {
              addLog(logMsg);
            });
          }
          
          addLog("[SYS] All 6 Judges deliberated. Consensus reached.");
          stopJudgeAnimations(data.result.consensus.finalVerdict);
          speakVerdict(data.result); // 🔊 Speak the verdict
          setTimeout(() => {
            setResult(data.result);
            setStatus('RESULT');
          }, 1200);
        } catch (err) {
          stopJudgeAnimations();
          addLog("[ERR] " + err.message);
          if (err.message && (err.message.includes("quota") || err.message.includes("429"))) {
            addLog("[SYS] ERROR: Google Gemini API Free Tier Quota Exceeded. Please wait a few minutes or use a paid account.");
          }
          setStatus('IDLE');
        }
      };

      const downloadPDF = async () => {
        addLog("[SYS] Assembling encrypted PDF report...");
        try {
          const c = result.consensus;
          const judgeText = result.judges.map((j, i) => 
            \`== \${judgeNames[i].name} ==\\nVerdict: \${j.verdict} | Confidence: \${j.confidence}%\\nReasoning: \${j.reasoning}\\n\` +
            (j.keyFindings||[]).map(f=> '• '+f).join('\\n')
          ).join('\\n\\n');

          const reportNumber = 'RPT-X91A-' + Math.random().toString(36).substr(2, 6).toUpperCase() + '-' + Date.now().toString().slice(-4);
          const body = {
            caseId: reportNumber,
            investigator: investigatorName || "Internal System",
            results: judgeText,
            confidence: c.adjustedConfidence + '%',
            isReal: c.finalVerdict === 'REAL'
          };

          const res = await fetch("/generate-pdf", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (!res.ok) {
            const errData = await res.json().catch(()=>({}));
            throw new Error(errData.error || \`Server returned \${res.status}\`);
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = \`VASTAV-Report-\${Date.now()}.pdf\`; a.click();
          addLog("[SYS] PDF downloaded successfully.");
        } catch (err) { 
          console.error(err); 
          addLog(\`[ERR] PDF Generation Failed: \${err.message}\`); 
        }
      };

      // Radar chart data mapper
      const radarData = result ? result.judges.map((j, i) => ({
        subject: judgeNames[i].short,
        A: j.confidence,
        fullMark: 100,
      })) : [];

      return (
        <>
          <AnimatePresence>
            {showOnboarding && <OnboardingScreen key="onboarding" onEnter={() => setShowOnboarding(false)} />}
          </AnimatePresence>
          <div className="flex flex-col min-h-screen">
          {/* NAVBAR */}
          <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b-0 border-t-0 border-x-0">
            <div className="flex items-center gap-4">
              <img src="/AGENT.png" alt="VASTAV Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]"/>
              <div>
                <h1 className="font-display font-bold text-lg tracking-wider text-white">VASTAV Agent</h1>
                <p className="text-[10px] uppercase tracking-widest text-cyan font-mono">Deepfake Detection System</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-4 text-sm font-mono text-slate-400">
                <a href="#" className="hover:text-cyan transition-colors">Documentation</a>
                <a href="#" className="hover:text-cyan transition-colors">API</a>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green/30 bg-green/10">
                <div className="w-2 h-2 rounded-full bg-green animate-pulse"></div>
                <span className="text-xs font-mono text-green uppercase tracking-wide">Agent Online</span>
              </div>
            </div>
          </nav>

          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-12 flex flex-col items-center">
            
            {/* HERO */}
            {status === 'IDLE' && (
              <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="text-center mb-12 w-full max-w-3xl">
                <div className="inline-block px-4 py-1.5 rounded-full border border-cyan/30 bg-cyan/10 text-cyan font-mono text-xs mb-6">
                  ⚡ v1.0.0 | Google Gemini 2.5 Flash Powered
                </div>
                <h2 className="font-display font-bold text-5xl md:text-6xl mb-6 tracking-tight leading-tight glow-text">
                  <span className="text-white">AI-Powered</span><br/>
                  <span className="gradient-text text-glow">Deepfake Detection</span>
                </h2>
                <p className="text-slate-400 font-sans text-lg mb-8 leading-relaxed">
                  Multi-Judge AI Ensemble analyzing forensic signals, contextual inconsistencies, and synthetic fingerprints in real-time.
                </p>
                <p className="text-xs font-mono text-slate-500 mb-8">Created by Navneet Singh</p>
              </motion.div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
              
              {/* LEFT COLUMN: Upload & Preview */}
              <div className={\`\${status === 'RESULT' ? 'lg:col-span-4' : 'lg:col-span-8 lg:col-start-3'} flex flex-col gap-6 transition-all duration-500\`}>
                
                {status !== 'RESULT' && (
                  <motion.div layoutId="uploadbox" className="glass-panel rounded-2xl p-1 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(0,245,255,0.2)] transition-shadow duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <label className="relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-cyan/30 group-hover:border-cyan/70 rounded-xl cursor-pointer transition-colors"
                           onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
                      
                      {!preview ? (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i data-lucide="scan-line" className="w-8 h-8 text-cyan"></i>
                          </div>
                          <h3 className="font-display font-semibold text-lg text-white mb-2">Initialize Scan Sequence</h3>
                          <p className="text-sm font-mono text-slate-400 text-center">Drag & drop media or click to browse<br/><span className="text-cyan text-xs mt-2 block">JPG, PNG, WEBP, MP4, WEBM (Max 50MB)</span></p>
                        </>
                      ) : (
                        <div className="w-full">
                          {file?.type.startsWith("video/") ? (
                            <video src={preview} controls className="w-full max-h-[300px] object-contain rounded-lg border border-cyan/20 mb-4 shadow-[0_0_30px_rgba(0,245,255,0.1)]"/>
                          ) : (
                            <img src={preview} className="w-full max-h-[300px] object-contain rounded-lg border border-cyan/20 mb-4 shadow-[0_0_30px_rgba(0,245,255,0.1)]"/>
                          )}
                          <p className="text-xs font-mono text-cyan text-center">Media loaded into memory. Ready for analysis.</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*,video/mp4,video/webm" onChange={onDrop} />
                    </label>
                  </motion.div>
                )}

                {status === 'RESULT' && preview && (
                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="glass-panel rounded-2xl p-4 flex flex-col items-center">
                    <img src={preview} className="w-full rounded-xl border border-white/10 mb-4"/>
                    <button onClick={()=>setStatus('IDLE')} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 font-mono text-sm text-slate-300 transition-colors">
                      [ SCAN ANOTHER ITEM ]
                    </button>
                  </motion.div>
                )}

                {/* TERMINAL / ACTION BUTTON */}
                {(file || status !== 'IDLE') && status !== 'RESULT' && (
                  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="flex flex-col gap-4">
                    {status === 'IDLE' ? (
                      <button onClick={runAnalysis} className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan via-blue to-cyan bg-[length:200%_100%] hover:bg-right text-bg font-display font-bold text-lg tracking-widest uppercase transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,245,255,0.6)] active:scale-95">
                        ⚡ INITIATE SCAN SEQUENCE
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* Enhanced Live System Log */}
                        <div className="relative h-[120px] bg-gradient-to-br from-black via-black to-cyan/5 rounded-xl border border-cyan/30 p-4 font-mono text-xs overflow-hidden shadow-[0_0_30px_rgba(0,245,255,0.1)]">
                          {/* Scanline effect */}
                          <div className="absolute inset-0 pointer-events-none opacity-10">
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,245,255,0.03)_50%)] bg-[length:100%_4px] animate-[scan_8s_linear_infinite]"></div>
                          </div>
                          
                          {/* Header */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan/20 relative z-10">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="w-2 h-2 bg-cyan rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-cyan rounded-full animate-ping"></div>
                              </div>
                              <span className="text-[10px] tracking-[0.2em] uppercase text-cyan font-bold">VASTAV_KERNEL</span>
                              <span className="text-[8px] text-cyan/40">v1.0.0</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></div>
                              <span className="text-[8px] text-green/70 uppercase tracking-wider">LIVE</span>
                            </div>
                          </div>
                          
                          {/* Log content */}
                          <div ref={logBoxRef} className="flex-1 overflow-y-auto terminal-scroll flex flex-col gap-1 relative z-10 max-h-[70px]">
                            {logs.map((L, i) => {
                              const isError = L.msg.startsWith('[ERR]');
                              const isSystem = L.msg.startsWith('[SYS]');
                              const isNetwork = L.msg.startsWith('[NET]');
                              const isJudge = L.msg.startsWith('[JUDGE]');
                              
                              return (
                                <div 
                                  key={i} 
                                  className={\`text-[10px] leading-relaxed transition-all duration-300 \${i === logs.length - 1 ? 'opacity-100' : 'opacity-60'}\`}
                                  style={{ 
                                    animation: i === logs.length - 1 ? 'slideIn 0.3s ease-out' : 'none'
                                  }}
                                >
                                  <span className="text-slate-600 mr-2">[{L.time}]</span>
                                  <span className={\`\${
                                    isError ? 'text-red font-bold' : 
                                    isSystem ? 'text-cyan' : 
                                    isNetwork ? 'text-blue' :
                                    isJudge ? 'text-purple' :
                                    'text-green'
                                  }\`}>
                                    {isError && '⚠ '}
                                    {isSystem && '⚙ '}
                                    {isNetwork && '🌐 '}
                                    {isJudge && '⚖ '}
                                    {L.msg}
                                  </span>
                                </div>
                              );
                            })}
                            {logs.length === 0 && (
                              <div className="text-[10px] text-slate-500 italic flex items-center gap-2">
                                <div className="w-1 h-1 bg-slate-500 rounded-full animate-pulse"></div>
                                Awaiting analysis initialization...
                              </div>
                            )}
                          </div>
                          
                          {/* Bottom glow */}
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-cyan/5 to-transparent pointer-events-none"></div>
                        </div>

                        {/* LIVE JUDGE DECISION PANEL */}
                        <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1 mt-4">
                          <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse"></div>
                          Live Tribunal — 6 Judges Active
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {judgeNames.map((jn, idx) => {
                            const js = judgeStates[idx];
                            const phaseLabel = JUDGE_PHASES[js.phase];
                            const dots = '.'.repeat(js.dots);
                            const phaseColor = js.phase === 0 ? 'text-slate-500 border-slate-700' : js.phase === 1 ? 'text-cyan border-cyan/40' : js.phase === 2 ? 'text-yellow-400 border-yellow-400/40' : 'text-green border-green/40';
                            const bgColor = js.phase === 0 ? 'bg-black/30' : js.phase === 1 ? 'bg-cyan/5' : js.phase === 2 ? 'bg-yellow-400/5' : 'bg-green/5';
                            const glowClass = js.phase === 1 ? 'shadow-[0_0_15px_rgba(0,245,255,0.15)]' : js.phase === 2 ? 'shadow-[0_0_15px_rgba(250,204,21,0.15)]' : '';
                            return (
                              <motion.div
                                key={idx}
                                initial={{opacity:0, scale:0.9}}
                                animate={{opacity:1, scale:1}}
                                transition={{delay: idx * 0.1}}
                                className={\`rounded-xl border p-3 flex flex-col gap-1.5 transition-all duration-300 \${bgColor} \${phaseColor} \${glowClass}\`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-base leading-none">{jn.icon}</span>
                                  <span className={\`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border \${phaseColor} \${bgColor}\`}>{phaseLabel}{js.phase < 3 ? dots : ''}</span>
                                </div>
                                <div className="font-mono text-[10px] text-slate-300 font-semibold leading-tight">{jn.short} / {jn.name}</div>
                                <div className="text-[9px] text-slate-500 leading-tight">{jn.desc}</div>
                                {/* Pulsing activity bar */}
                                {js.phase > 0 && js.phase < 3 && (
                                  <div className="h-0.5 w-full bg-black/50 rounded-full overflow-hidden mt-1">
                                    <div
                                      className={\`h-full rounded-full \${js.phase === 1 ? 'bg-cyan' : 'bg-yellow-400'}\`}
                                      style={{animation: 'scanBar 1.5s ease-in-out infinite', width: '40%'}}
                                    />
                                  </div>
                                )}
                                {js.phase === 3 && (
                                  <div className="h-0.5 w-full bg-green/30 rounded-full mt-1"></div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* RIGHT COLUMN: Results Dashboard */}
              {status === 'RESULT' && result && (
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* MAIN VERDICT CARD */}
                  <motion.div initial={{opacity:0, x:50}} animate={{opacity:1, x:0}} className="glass-panel rounded-2xl p-8 relative overflow-hidden">
                    {/* Background glow based on verdict */}
                    <div className={\`absolute inset-0 opacity-20 bg-gradient-to-t \${result.consensus.finalVerdict==='REAL' ? 'from-green' : 'from-red'} to-transparent\`}></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex-1">
                        <div className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-2">Final Ensemble Verdict</div>
                        <h2 className={\`font-display font-bold text-5xl tracking-tight mb-2 drop-shadow-[0_0_20px_currentColor] \${result.consensus.finalVerdict==='REAL' ? 'text-green' : 'text-red'}\`}>
                          {result.consensus.finalVerdict==='REAL' ? 'AUTHENTIC' : 'DEEPFAKE'}
                        </h2>
                        <div className="font-mono text-lg text-white mb-6">
                          Confidence: <span className="text-cyan">{result.consensus.adjustedConfidence}%</span>
                        </div>
                        <div className="flex gap-4">
                          <div className="px-4 py-2 rounded-lg bg-green/10 border border-green/30 text-green font-mono text-sm text-center">
                            <span className="block text-xl font-bold">{result.consensus.realCount}</span> Real Votes
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-red/10 border border-red/30 text-red font-mono text-sm text-center">
                            <span className="block text-xl font-bold">{result.consensus.fakeCount}</span> Fake Votes
                          </div>
                        </div>
                        {result.consensus.synthIdDetected && (
                          <div className="mt-4 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-300 font-mono text-xs inline-flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                            <i data-lucide="shield-alert" className="w-4 h-4"></i>
                            SYNTHID WATERMARK DETECTED BY GOOGLE AI
                          </div>
                        )}
                      </div>
                      
                      {/* Radar Chart */}
                      <div className={"w-[200px] h-[200px] md:w-[250px] md:h-[250px] bg-black/40 rounded-full border flex items-center justify-center p-2 relative transition-all duration-500 " + (result.consensus.finalVerdict === 'REAL' ? 'border-green/50 shadow-[0_0_40px_rgba(0,255,163,0.3)]' : 'border-red/50 shadow-[0_0_40px_rgba(255,59,92,0.3)]')}>
                        <div className={"absolute inset-0 rounded-full border border-dashed animate-[spin_10s_linear_infinite] " + (result.consensus.finalVerdict === 'REAL' ? 'border-green/50' : 'border-red/50')}></div>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{fill:'rgba(255,255,255,0.5)', fontSize:10, fontFamily:'JetBrains Mono'}} />
                            <Radar name="Confidence" dataKey="A" stroke={result.consensus.finalVerdict==='REAL' ? '#00FFA3' : '#FF3B5C'} fill={result.consensus.finalVerdict==='REAL' ? '#00FFA3' : '#FF3B5C'} fillOpacity={0.3} isAnimationActive={true} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-2 relative z-10 w-full">
                      <label className="text-xs font-mono text-cyan ml-1">Investigating Officer (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Special Agent Smith, Cyber Div" 
                        value={investigatorName}
                        onChange={(e) => setInvestigatorName(e.target.value)}
                        className="w-full bg-black/50 border border-cyan/30 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-cyan transition-colors focus:shadow-[0_0_15px_rgba(0,245,255,0.2)]"
                      />
                      <button onClick={downloadPDF} className="w-full py-4 rounded-xl border border-cyan/40 bg-cyan/10 hover:bg-cyan/20 hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] hover:-translate-y-1 text-cyan cursor-pointer font-display font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 mt-2">
                        <i data-lucide="download" className="w-5 h-5 animate-bounce"></i> DOWNLOAD VASTAV OFFICIAL INTELLIGENCE REPORT
                      </button>
                    </div>
                  </motion.div>

                  {/* 6 JUDGE GRID */}
                  <div className="font-display font-semibold text-lg text-white mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan rounded-full"></div> Individual Judge Telemetry
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.judges.map((j, i) => {
                      const isReal = j.verdict === 'REAL';
                      const isNoVote = j.verdict === 'NO_VOTE';
                      const colorClass = isNoVote ? 'text-slate-400 border-slate-500/30 bg-slate-500/5' : isReal ? 'text-green border-green/30 bg-green/5' : 'text-red border-red/30 bg-red/5';
                      const barClass = isNoVote ? 'bg-slate-500 shadow-[0_0_10px_#64748b]' : isReal ? 'bg-green shadow-[0_0_10px_#00FFA3]' : 'bg-red shadow-[0_0_10px_#FF3B5C]';
                      
                      return (
                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.1}} key={i} className={\`glass-panel rounded-xl p-4 hover:-translate-y-1 transition-transform border border-white/5\`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-mono text-xs text-cyan mb-1">{judgeNames[i].short}</div>
                              <div className="font-display text-sm font-semibold text-white">{judgeNames[i].name}</div>
                            </div>
                            <div className={\`px-2 py-1 rounded-md text-[10px] font-mono font-bold border \${colorClass}\`}>
                              {j.verdict}
                            </div>
                          </div>
                          
                          {/* Animated Conf Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-1">
                              <span>Confidence</span>
                              <span className="text-white">{j.confidence}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                              <motion.div initial={{width:0}} animate={{width: \`\${j.confidence}%\`}} transition={{duration:1, delay:0.5}} className={\`h-full rounded-full \${barClass}\`}></motion.div>
                            </div>
                          </div>
                          
                          <div className="bg-black/40 rounded-lg p-2 border border-white/5 font-mono text-[10px] text-slate-300 leading-relaxed h-[80px] overflow-y-auto terminal-scroll">
                            {j.reasoning}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
          
          <footer className="py-6 border-t border-white/10 text-center font-mono text-[10px] text-slate-500">
            VASTAV AGENT DEEPFAKE DETECTION SYSTEM // PORT {${PORT}} // CREATED BY NAVNEET SINGH
          </footer>
        </div>
        </>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root-app'));
    root.render(<App />);
    
    // Initialize icons after render
    setTimeout(() => { lucide.createIcons(); }, 100);
  </script>
</body>
</html>`);
});

// ─────────────────────────────────────────────────────
// GET /health — Health check
// ─────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>VASTAV — Deepfake Detection Agent</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    :root{
      --cyan:#00F5FF;--cyan-dim:rgba(0,245,255,0.15);--cyan-border:rgba(0,245,255,0.25);
      --purple:#8b5cf6;--purple-dim:rgba(139,92,246,0.15);
      --bg:#050d1a;--bg2:#0a1628;--bg3:#0f1f36;
      --text:#e2e8f0;--text-dim:#94a3b8;
      --real:#10b981;--fake:#ef4444;
      --radius:12px;
    }
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;}
    body::before{
      content:'';position:fixed;inset:0;
      background:radial-gradient(ellipse at 20% 20%,rgba(0,245,255,0.06) 0%,transparent 50%),
                radial-gradient(ellipse at 80% 80%,rgba(139,92,246,0.08) 0%,transparent 50%),
                linear-gradient(rgba(0,245,255,0.03) 1px,transparent 1px),
                linear-gradient(90deg,rgba(0,245,255,0.03) 1px,transparent 1px);
      background-size:100%,100%,28px 28px,28px 28px;
      pointer-events:none;z-index:0;
    }

    /* ═══ HEADER ═══ */
    header{
      position:relative;z-index:10;
      padding:20px 40px;
      display:flex;align-items:center;gap:16px;
      background:rgba(5,13,26,0.85);
      backdrop-filter:blur(20px);
      border-bottom:1px solid var(--cyan-border);
      box-shadow:0 4px 40px rgba(0,245,255,0.05);
    }
    .logo-badge{
      width:44px;height:44px;border-radius:10px;
      background:linear-gradient(135deg,#00F5FF22,#8b5cf622);
      border:1px solid var(--cyan-border);
      display:flex;align-items:center;justify-content:center;
      font-family:'Orbitron',monospace;font-size:14px;font-weight:900;
      color:var(--cyan);
    }
    .header-title{font-family:'Orbitron',monospace;font-size:18px;font-weight:800;
      background:linear-gradient(135deg,#00F5FF,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
    .header-sub{font-size:11px;color:var(--text-dim);font-family:'Rajdhani',sans-serif;letter-spacing:2px;text-transform:uppercase;}
    .status-pill{
      margin-left:auto;display:flex;align-items:center;gap:8px;
      background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);
      color:#34d399;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:600;
    }
    .status-dot{width:7px;height:7px;border-radius:50%;background:#10b981;animation:pulse-dot 1.5s ease-in-out infinite;}
    @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}

    /* ═══ MAIN LAYOUT ═══ */
    main{
      position:relative;z-index:1;
      max-width:960px;margin:0 auto;padding:60px 24px;
    }

    /* ═══ HERO SECTION ═══ */
    .hero{text-align:center;margin-bottom:60px;}
    .hero-eyebrow{
      display:inline-flex;align-items:center;gap:8px;
      font-family:'Rajdhani';font-size:12px;letter-spacing:3px;text-transform:uppercase;
      color:var(--cyan);background:var(--cyan-dim);border:1px solid var(--cyan-border);
      border-radius:999px;padding:6px 18px;margin-bottom:24px;
    }
    .hero h1{
      font-family:'Orbitron',monospace;font-size:clamp(28px,5vw,48px);font-weight:900;line-height:1.2;
      background:linear-gradient(135deg,#FFFFFF 0%,#00F5FF 60%,#8b5cf6 100%);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
      margin-bottom:16px;
    }
    .hero p{font-size:15px;color:var(--text-dim);line-height:1.7;max-width:560px;margin:0 auto 32px;}
    .judges-row{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}
    .judge-chip{
      font-size:11px;padding:4px 12px;border-radius:999px;
      background:rgba(0,245,255,0.07);border:1px solid rgba(0,245,255,0.2);
      color:var(--cyan);font-family:'Rajdhani';font-weight:600;letter-spacing:.5px;
    }

    /* ═══ UPLOAD ZONE ═══ */
    .upload-card{
      background:rgba(10,22,40,0.8);border:2px dashed var(--cyan-border);
      border-radius:20px;padding:60px 40px;text-align:center;
      cursor:pointer;transition:all .3s ease;
      backdrop-filter:blur(20px);margin-bottom:32px;
      position:relative;overflow:hidden;
    }
    .upload-card::before{
      content:'';position:absolute;inset:0;
      background:radial-gradient(circle at 50% 0%,rgba(0,245,255,0.06),transparent 60%);
      pointer-events:none;
    }
    .upload-card:hover,.upload-card.drag-over{
      border-color:var(--cyan);
      box-shadow:0 0 40px rgba(0,245,255,0.15),inset 0 0 40px rgba(0,245,255,0.05);
    }
    .upload-icon{
      width:64px;height:64px;margin:0 auto 20px;
      background:var(--cyan-dim);border:1px solid var(--cyan-border);
      border-radius:16px;display:flex;align-items:center;justify-content:center;
    }
    .upload-icon svg{width:28px;height:28px;stroke:var(--cyan);}
    .upload-title{font-family:'Orbitron';font-size:16px;font-weight:600;color:var(--text);margin-bottom:8px;}
    .upload-sub{font-size:13px;color:var(--text-dim);}
    .upload-sub span{color:var(--cyan);}
    #file-input{display:none;}
    .preview-wrap{margin-top:24px;display:none;}
    .preview-wrap img{max-height:220px;border-radius:12px;border:1px solid var(--cyan-border);box-shadow:0 0 30px rgba(0,245,255,0.1);}

    /* ═══ ANALYZE BUTTON ═══ */
    .btn-analyze{
      width:100%;padding:18px;border:none;border-radius:14px;cursor:pointer;
      font-family:'Orbitron';font-size:15px;font-weight:700;letter-spacing:2px;
      background:linear-gradient(135deg,#00F5FF,#0099cc,#8b5cf6);
      background-size:200% 200%;animation:grad-shift 3s ease infinite;
      color:#000;box-shadow:0 0 30px rgba(0,245,255,0.3);
      transition:transform .2s,box-shadow .2s;margin-bottom:40px;
    }
    .btn-analyze:hover{transform:translateY(-2px);box-shadow:0 0 50px rgba(0,245,255,0.45);}
    .btn-analyze:disabled{opacity:.5;cursor:not-allowed;transform:none;animation:none;background:#1a2a3a;color:#64748b;}
    @keyframes grad-shift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}

    /* ═══ SCANNING ANIMATION ═══ */
    #scan-section{display:none;margin-bottom:40px;}
    .scan-card{
      background:rgba(10,22,40,0.9);border:1px solid var(--cyan-border);
      border-radius:20px;padding:40px;text-align:center;
      backdrop-filter:blur(20px);
      box-shadow:0 0 50px rgba(0,245,255,0.08);
    }
    .scan-ring{
      width:80px;height:80px;margin:0 auto 24px;position:relative;
      border-radius:50%;border:2px solid transparent;
      background:linear-gradient(#050d1a,#050d1a) padding-box,
                linear-gradient(135deg,var(--cyan),transparent,var(--purple)) border-box;
      animation:spin 1.5s linear infinite;
    }
    .scan-ring::after{
      content:'⚡';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
      font-size:24px;animation:spin-reverse 1.5s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes spin-reverse{to{transform:rotate(-360deg);}}
    .scan-title{font-family:'Orbitron';font-size:16px;color:var(--cyan);margin-bottom:8px;}
    .scan-sub{color:var(--text-dim);font-size:13px;margin-bottom:20px;}
    .progress-track{background:rgba(0,245,255,0.08);border-radius:999px;height:4px;overflow:hidden;}
    .progress-bar{height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple));border-radius:999px;width:0%;transition:width .5s;}
    .judge-status{margin-top:16px;font-size:12px;color:var(--text-dim);font-family:'Rajdhani';}

    /* ═══ RESULTS SECTION ═══ */
    #results-section{display:none;}
    .section-label{
      font-family:'Orbitron';font-size:11px;letter-spacing:3px;text-transform:uppercase;
      color:var(--cyan);margin-bottom:20px;display:flex;align-items:center;gap:8px;
    }
    .section-label::after{content:'';flex:1;height:1px;background:var(--cyan-border);}

    /* Judge cards */
    .judges-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:32px;}
    .judge-card{
      background:rgba(10,22,40,0.85);border:1px solid rgba(0,245,255,0.12);
      border-radius:16px;padding:20px;
      backdrop-filter:blur(16px);
      transition:border-color .3s,box-shadow .3s;
      opacity:0;transform:translateY(20px);
      animation:card-in .5s ease forwards;
    }
    @keyframes card-in{to{opacity:1;transform:translateY(0);}}
    .judge-card:hover{border-color:var(--cyan-border);box-shadow:0 0 30px rgba(0,245,255,0.08);}
    .judge-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}
    .judge-name{font-family:'Orbitron';font-size:12px;font-weight:700;color:var(--cyan);}
    .judge-specialty{font-size:11px;color:var(--text-dim);margin-top:3px;font-family:'Rajdhani';}
    .verdict-badge{
      font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;font-family:'Orbitron';
      white-space:nowrap;
    }
    .verdict-real{background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.4);}
    .verdict-fake{background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.4);}
    .confidence-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
    .conf-label{font-size:11px;color:var(--text-dim);min-width:80px;}
    .conf-bar-outer{flex:1;background:rgba(255,255,255,0.06);border-radius:999px;height:5px;overflow:hidden;}
    .conf-bar{height:100%;border-radius:999px;transition:width 1s ease;}
    .conf-real{background:linear-gradient(90deg,#10b981,#34d399);}
    .conf-fake{background:linear-gradient(90deg,#ef4444,#f87171);}
    .conf-num{font-size:11px;font-family:'Orbitron';font-weight:700;}
    .judge-findings{font-size:12px;color:var(--text-dim);line-height:1.6;}
    .judge-findings li{margin-bottom:4px;list-style:none;padding-left:12px;position:relative;}
    .judge-findings li::before{content:'▸';position:absolute;left:0;color:var(--cyan);font-size:10px;top:2px;}
    .synthid-tag{
      display:inline-flex;align-items:center;gap:5px;
      background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.4);
      color:#a78bfa;border-radius:999px;padding:4px 10px;font-size:10px;font-weight:600;
      margin-top:10px;font-family:'Orbitron';
    }

    /* ═══ CONSENSUS SECTION ═══ */
    .consensus-card{
      background:rgba(10,22,40,0.95);
      border-radius:20px;padding:32px;margin-bottom:32px;
      position:relative;overflow:hidden;
      backdrop-filter:blur(20px);
    }
    .consensus-card::before{
      content:'';position:absolute;inset:-1px;
      background:linear-gradient(135deg,var(--cyan),#8b5cf6,var(--cyan));
      border-radius:20px;z-index:-1;
      animation:border-shimmer 3s linear infinite;
    }
    @keyframes border-shimmer{0%{filter:hue-rotate(0deg);}100%{filter:hue-rotate(360deg);}}
    .consensus-inner{background:rgba(5,13,26,0.95);border-radius:18px;padding:28px;}
    .verdict-large{
      font-family:'Orbitron';font-size:clamp(32px,6vw,56px);font-weight:900;text-align:center;
      letter-spacing:6px;margin-bottom:8px;
    }
    .verdict-real-text{
      background:linear-gradient(135deg,#10b981,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      text-shadow:none;filter:drop-shadow(0 0 20px rgba(16,185,129,0.5));
    }
    .verdict-fake-text{
      background:linear-gradient(135deg,#ef4444,#f87171);-webkit-background-clip:text;-webkit-text-fill-color:transparent;
      filter:drop-shadow(0 0 20px rgba(239,68,68,0.5));
    }
    .verdict-confidence{text-align:center;font-size:14px;color:var(--text-dim);margin-bottom:24px;}
    .verdict-confidence span{color:var(--cyan);font-family:'Orbitron';font-weight:700;font-size:18px;}
    .vote-row{display:flex;justify-content:center;gap:24px;margin-bottom:20px;}
    .vote-box{text-align:center;padding:16px 24px;border-radius:12px;}
    .vote-real{background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);}
    .vote-fake{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);}
    .vote-num{font-family:'Orbitron';font-size:28px;font-weight:900;}
    .vote-real .vote-num{color:#34d399;}
    .vote-fake .vote-num{color:#f87171;}
    .vote-label{font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;}
    .synthid-banner{
      background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.4);
      border-radius:10px;padding:12px 20px;text-align:center;
      font-family:'Orbitron';font-size:12px;color:#a78bfa;
      display:none;margin-bottom:16px;
    }

    /* ═══ PDF BUTTON ═══ */
    .btn-pdf{
      width:100%;padding:16px;border-radius:14px;cursor:pointer;border:none;
      font-family:'Orbitron';font-size:14px;font-weight:700;letter-spacing:2px;
      background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.4);
      color:#a78bfa;transition:all .3s;
    }
    .btn-pdf:hover{background:rgba(139,92,246,0.25);box-shadow:0 0 30px rgba(139,92,246,0.3);}
    .btn-pdf:disabled{opacity:.4;cursor:not-allowed;}

    /* ═══ TOAST ═══ */
    #toast{
      position:fixed;bottom:30px;right:30px;z-index:1000;
      background:rgba(10,22,40,0.95);border:1px solid var(--cyan-border);
      backdrop-filter:blur(20px);border-radius:12px;padding:14px 20px;
      font-size:13px;color:var(--text);
      transform:translateY(80px);opacity:0;transition:all .4s ease;
      display:flex;align-items:center;gap:10px;
    }
    #toast.show{transform:translateY(0);opacity:1;}
    #toast.error{border-color:rgba(239,68,68,0.5);}

    /* ═══ FOOTER ═══ */
    footer{
      position:relative;z-index:1;
      text-align:center;padding:28px;
      border-top:1px solid var(--cyan-border);
      font-size:12px;color:var(--text-dim);font-family:'Rajdhani';letter-spacing:1px;
    }
  </style>
</head>
<body>

<!-- HEADER -->
<header>
  <div class="logo-badge">V</div>
  <div>
    <div class="header-title">VASTAV</div>
    <div class="header-sub">Deepfake Detection Agent — 6-Judge AI Panel</div>
  </div>
  <div class="status-pill"><span class="status-dot"></span> Agent Online</div>
</header>

<!-- MAIN -->
<main>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-eyebrow">🛡️ VASTAV LIVE AGENT v1.0.0</div>
    <h1>AI-Powered Deepfake<br/>Detection System</h1>
    <p>Upload any image and watch our 6-judge ensemble — powered by Google Gemini 2.0 Flash — analyze it for deepfakes, AI artifacts, and SynthID watermarks in real time.</p>
    <div class="judges-row">
      <span class="judge-chip">J1 · Forensic</span>
      <span class="judge-chip">J2 · AI Artifacts</span>
      <span class="judge-chip">J3 · Contextual</span>
      <span class="judge-chip">J4 · Physics</span>
      <span class="judge-chip">J5 · Chief Justice</span>
      <span class="judge-chip">J6 · SynthID</span>
    </div>
  </div>

  <!-- UPLOAD ZONE -->
  <div class="upload-card" id="upload-zone">
    <div class="upload-icon">
      <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
      </svg>
    </div>
    <div class="upload-title">Drop image here or click to browse</div>
    <div class="upload-sub">Supports <span>JPEG, PNG, WEBP, GIF</span> — Max 50MB</div>
    <div class="preview-wrap" id="preview-wrap">
      <img id="preview-img" src="" alt="Preview"/>
    </div>
    <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp,image/gif"/>
  </div>

  <!-- ANALYZE BUTTON -->
  <button class="btn-analyze" id="btn-analyze" disabled>
    ⚡ ANALYZE IMAGE
  </button>

  <!-- SCANNING SECTION -->
  <div id="scan-section">
    <div class="scan-card">
      <div class="scan-ring"></div>
      <div class="scan-title">SCANNING IN PROGRESS</div>
      <div class="scan-sub" id="scan-phase">Initializing 6-Judge Panel...</div>
      <div class="progress-track"><div class="progress-bar" id="progress-bar"></div></div>
      <div class="judge-status" id="judge-status"></div>
    </div>
  </div>

  <!-- RESULTS SECTION -->
  <div id="results-section">

    <!-- 6 JUDGE CARDS -->
    <div class="section-label">Judge Panel Verdicts</div>
    <div class="judges-grid" id="judges-grid"></div>

    <!-- CONSENSUS -->
    <div class="section-label">Final Verdict</div>
    <div class="consensus-card" id="consensus-card">
      <div class="consensus-inner">
        <div class="synthid-banner" id="synthid-banner">🛡️ SYNTHID WATERMARK DETECTED — Google AI-Generated Content Marker Present</div>
        <div class="verdict-large" id="verdict-text"></div>
        <div class="verdict-confidence" id="verdict-confidence"></div>
        <div class="vote-row" id="vote-row"></div>
        <button class="btn-pdf" id="btn-pdf" disabled>
          📄 DOWNLOAD PDF REPORT
        </button>
      </div>
    </div>

  </div>

</main>

<!-- FOOTER -->
<footer>VASTAV AI · 6-Judge Ensemble · Powered by Google Gemini 2.0 Flash · Port ${PORT}</footer>

<!-- TOAST -->
<div id="toast"></div>

<script>
  let selectedFile = null;
  let lastResult = null;
  let lastImageBase64 = null;
  let lastMimeType = null;

  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const previewWrap = document.getElementById('preview-wrap');
  const previewImg = document.getElementById('preview-img');
  const btnAnalyze = document.getElementById('btn-analyze');
  const scanSection = document.getElementById('scan-section');
  const resultsSection = document.getElementById('results-section');
  const judgesGrid = document.getElementById('judges-grid');
  const verdictText = document.getElementById('verdict-text');
  const verdictConf = document.getElementById('verdict-confidence');
  const voteRow = document.getElementById('vote-row');
  const btnPdf = document.getElementById('btn-pdf');
  const progressBar = document.getElementById('progress-bar');
  const scanPhase = document.getElementById('scan-phase');
  const judgeStatus = document.getElementById('judge-status');
  const synthidBanner = document.getElementById('synthid-banner');

  function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = (isError ? '❌ ' : '✅ ') + msg;
    t.className = 'show' + (isError ? ' error' : '');
    setTimeout(() => t.className = '', 3500);
  }

  // Upload zone interactions
  uploadZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  function handleFile(file) {
    if (!file) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
      previewImg.src = ev.target.result;
      previewWrap.style.display = 'block';
      lastImageBase64 = ev.target.result.split(',')[1];
      lastMimeType = file.type;
    };
    reader.readAsDataURL(file);
    btnAnalyze.disabled = false;
    // Reset results
    resultsSection.style.display = 'none';
  }

  // Analyze
  btnAnalyze.addEventListener('click', async () => {
    if (!selectedFile) return;
    btnAnalyze.disabled = true;
    scanSection.style.display = 'block';
    resultsSection.style.display = 'none';

    const phases = [
      { msg: 'Running Judges 1 & 2 — Forensic & AI Artifacts...', progress: 20 },
      { msg: 'Running Judges 3 & 4 — Contextual & Physics...', progress: 45 },
      { msg: 'Running Judge 5 — Chief Justice deliberating...', progress: 70 },
      { msg: 'Running Judge 6 — SynthID Watermark Scan...', progress: 88 },
      { msg: 'Building consensus & final verdict...', progress: 96 },
    ];
    let pi = 0;
    const phaseTimer = setInterval(() => {
      if (pi < phases.length) {
        scanPhase.textContent = phases[pi].msg;
        progressBar.style.width = phases[pi].progress + '%';
        pi++;
      }
    }, 3500);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const resp = await fetch('/analyze', { method: 'POST', body: formData });
      const data = await resp.json();
      clearInterval(phaseTimer);

      if (!resp.ok) throw new Error(data.error || 'Analysis failed');
      lastResult = data.result;
      progressBar.style.width = '100%';
      scanPhase.textContent = 'Analysis complete!';
      setTimeout(() => {
        scanSection.style.display = 'none';
        displayResults(data.result);
      }, 800);
    } catch (err) {
      clearInterval(phaseTimer);
      scanSection.style.display = 'none';
      btnAnalyze.disabled = false;
      showToast(err.message || 'Analysis failed', true);
    }
  });

  const judgeNames = [
    { short: 'J1', name: 'Forensic & Biometric' },
    { short: 'J2', name: 'AI Artifacts & Neural' },
    { short: 'J3', name: 'Contextual & Semantic' },
    { short: 'J4', name: 'Physics & Lighting' },
    { short: 'J5', name: 'Chief Justice' },
    { short: 'J6', name: 'SynthID Specialist' },
  ];

  function displayResults(result) {
    resultsSection.style.display = 'block';
    judgesGrid.innerHTML = '';

    result.judges.forEach((j, i) => {
      const conf = j.confidence;
      const isReal = j.verdict === 'REAL';
      const card = document.createElement('div');
      card.className = 'judge-card';
      card.style.animationDelay = (i * 120) + 'ms';
      card.innerHTML = \`
        <div class="judge-header">
          <div>
            <div class="judge-name">\${judgeNames[i].short} · \${judgeNames[i].name}</div>
            <div class="judge-specialty">\${j.specialty || j.judge}</div>
          </div>
          <span class="verdict-badge \${isReal ? 'verdict-real' : 'verdict-fake'}">\${isReal ? 'REAL' : 'FAKE'}</span>
        </div>
        <div class="confidence-row">
          <span class="conf-label">Confidence</span>
          <div class="conf-bar-outer">
            <div class="conf-bar \${isReal ? 'conf-real' : 'conf-fake'}" style="width:\${conf}%"></div>
          </div>
          <span class="conf-num \${isReal ? '' : 'verdict-fake'}">\${conf}%</span>
        </div>
        <ul class="judge-findings">
          \${(j.keyFindings || []).slice(0,3).map(f => \`<li>\${f}</li>\`).join('')}
        </ul>
        \${j.synthIdDetected ? '<div class="synthid-tag">🛡️ SynthID Detected</div>' : ''}
      \`;
      judgesGrid.appendChild(card);
    });

    // Consensus
    const c = result.consensus;
    const isReal = c.finalVerdict === 'REAL';
    verdictText.className = 'verdict-large ' + (isReal ? 'verdict-real-text' : 'verdict-fake-text');
    verdictText.textContent = isReal ? '✓ AUTHENTIC' : '⚠ DEEPFAKE';
    verdictConf.innerHTML = 'Final Confidence: <span>' + c.adjustedConfidence + '%</span>';
    voteRow.innerHTML = \`
      <div class="vote-box vote-real"><div class="vote-num">\${c.realCount}</div><div class="vote-label">Real Votes</div></div>
      <div class="vote-box vote-fake"><div class="vote-num">\${c.fakeCount}</div><div class="vote-label">Fake Votes</div></div>
    \`;
    if (c.synthIdDetected) synthidBanner.style.display = 'block';
    btnPdf.disabled = false;
    btnAnalyze.disabled = false;
    window.scrollTo({ top: document.getElementById('results-section').offsetTop - 30, behavior: 'smooth' });
  }

  // PDF Download
  btnPdf.addEventListener('click', async () => {
    btnPdf.disabled = true;
    btnPdf.textContent = '⏳ Generating PDF...';
    try {
      const c = lastResult.consensus;
      const judgeText = lastResult.judges.map((j, i) => {
        return '== ' + judgeNames[i].name + ' ==\\n' +
               'Verdict: ' + j.verdict + ' | Confidence: ' + j.confidence + '%\\n' +
               'Reasoning: ' + j.reasoning + '\\n' +
               (j.keyFindings || []).map(f => '• ' + f).join('\\n');
      }).join('\\n\\n');

      const body = {
        caseId: 'VDC-' + Date.now(),
        results: judgeText,
        imageBase64: lastImageBase64,
        mimeType: lastMimeType,
        confidence: c.adjustedConfidence + '%',
        isReal: c.finalVerdict === 'REAL',
        metadata: {}
      };

      const resp = await fetch('/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('PDF generation failed');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'VASTAV-Report-' + Date.now() + '.pdf';
      a.click(); URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      showToast(err.message || 'PDF failed', true);
    } finally {
      btnPdf.disabled = false;
      btnPdf.textContent = '📄 DOWNLOAD PDF REPORT';
    }
  });
</script>
</body>
</html>`);
});

// ─────────────────────────────────────────────────────
// GET /health — Health check
// ─────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "VASTAV Live Agent", version: "1.0.0" });
});

// ─────────────────────────────────────────────────────
// POST /analyze — analyze uploaded image or video file
// ─────────────────────────────────────────────────────
app.post("/analyze", upload.single("file"), async (req, res) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GOOGLE_API_KEY not configured" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;
  const isVideo = mimeType.startsWith("video/");
  
  // Store progress messages for this request
  const progressMessages: string[] = [];
  const onProgress = (msg: string) => {
    progressMessages.push(msg);
  };

  try {
    log(`Incoming File: ${req.file.originalname} (${(req.file.size/1024/1024).toFixed(2)} MB, type: ${mimeType})`, "UPLOAD");
    const fileBuffer = fs.readFileSync(filePath);

    let panelResult;

    if (isVideo) {
      log(`Starting VIDEO multi-judge panel analysis`, "SYSTEM");
      onProgress("[SYS] Processing video file...");
      const { extractFramesFromVideo } = await import("./utils/videoProcessor.js");
      const frames = await extractFramesFromVideo(fileBuffer);
      
      if (!frames || frames.length === 0) {
        throw new Error("FFmpeg failed to extract visual frames from the video.");
      }
      
      log(`Successfully extracted ${frames.length} frames. Feeding frame 1 to Judges.`, "VIDEO");
      onProgress(`[SYS] Extracted ${frames.length} frames from video`);
      panelResult = await runJudgePanel(apiKey, frames[Math.floor(frames.length/2)], "image/jpeg", undefined, onProgress);
      
    } else {
      log(`Starting IMAGE multi-judge panel analysis`, "SYSTEM");
      
      let metadataText = "No EXIF metadata found. This is common for files saved from web, screenshots, or generated by AI (Midjourney/DALL-E).";
      try {
        const exifData = exif(fileBuffer) as any;
        if (exifData) {
          metadataText = "EXIF Metadata Found:\n";
          if (exifData.Image) {
            metadataText += `- Make: ${exifData.Image.Make || "Unknown"}\n`;
            metadataText += `- Model: ${exifData.Image.Model || "Unknown"}\n`;
            metadataText += `- Software: ${exifData.Image.Software || "Unknown"}\n`;
            metadataText += `- ModifyDate: ${exifData.Image.ModifyDate || "Unknown"}\n`;
          }
          if (exifData.exif) {
            metadataText += `- DateTimeOriginal: ${exifData.exif.DateTimeOriginal || "Unknown"}\n`;
            metadataText += `- ColorSpace: ${exifData.exif.ColorSpace || "Unknown"}\n`;
          }
          log("Successfully parsed image EXIF metadata", "SYSTEM");
          onProgress("[SYS] EXIF metadata extracted successfully");
        }
      } catch (err: any) {
        log(`No EXIF metadata or failed to parse: ${err.message}`, "SYSTEM");
        onProgress("[SYS] No EXIF metadata found (common for AI-generated images)");
      }

      const imageBase64 = fileBuffer.toString("base64");
      panelResult = await runJudgePanel(apiKey, imageBase64, mimeType, metadataText, onProgress);
    }

    log(`Consensus: ${panelResult.consensus.summary}`, "JUDGE");

    res.json({
      success: true,
      file: req.file.originalname,
      result: panelResult,
      logs: progressMessages, // Include all progress messages
    });
  } catch (err: any) {
    log(`Analysis error: ${err.message}`, "ERROR");
    if (err.message.includes("429") || err.message.includes("quota")) {
      return res.status(429).json({ error: "Google Gemini API Quota Exceeded. Please try again later." });
    }
    res.status(500).json({ error: err.message || "Analysis failed" });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
});

// ─────────────────────────────────────────────────────
// POST /analyze-base64 — analyze base64 image
// ─────────────────────────────────────────────────────
app.post("/analyze-base64", async (req, res) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GOOGLE_API_KEY not configured" });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "imageBase64 and mimeType are required" });
  }

  try {
    log("Starting multi-judge panel analysis (base64 input)...", "SYSTEM");
    const panelResult = await runJudgePanel(apiKey, imageBase64, mimeType);
    log(`Consensus: ${panelResult.consensus.summary}`, "JUDGE");
    res.json({ success: true, result: panelResult });
  } catch (err: any) {
    log(`Analysis error: ${err.message}`, "ERROR");
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

// ─────────────────────────────────────────────────────
// POST /generate-pdf — Generate PDF from HTML (Puppeteer)
// ─────────────────────────────────────────────────────
app.post("/generate-pdf", async (req, res) => {
  try {
    const { caseId, investigator, results, imageBase64, mimeType, confidence, isReal, metadata = {} } = req.body;

    // Build the Raw Judge Telemetry HTML
    const formattedResults = (results || "No analysis data available.")
      .split("==").filter(Boolean)
      .map((block: string) => {
        const lines = block.trim().split("\n");
        const title = lines[0]?.trim() || "UNKNOWN JUDGE";
        const content = lines.slice(1).join("<br/>");
        return `
          <div class="mb-4 p-4 rounded-lg bg-[#0A1628] border border-[#00F5FF]/20 shadow-[0_0_15px_rgba(0,245,255,0.05)]">
            <h3 class="text-[#00F5FF] font-bold font-mono text-sm uppercase tracking-widest mb-2 border-b border-[#00F5FF]/10 pb-2">${title}</h3>
            <div class="text-[#94A3B8] font-mono text-xs leading-relaxed">${content}</div>
          </div>
        `;
      }).join("");

    const imageHtml = imageBase64 
      ? `<div class="mt-8 flex justify-center"><img src="data:${mimeType};base64,${imageBase64}" class="max-w-full max-h-[400px] border-2 border-[#00F5FF]/30 rounded-xl shadow-[0_0_30px_rgba(0,245,255,0.2)] object-contain" /></div>` 
      : ``;

    const htmlContent = `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #050A14; color: #E2E8F0; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .page-break { page-break-before: always; }
        
        /* Grid Background Pattern */
        .bg-grid {
          position: fixed; inset: 0; z-index: -1; pointer-events: none;
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(0,245,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,245,255,0.05) 1px, transparent 1px);
        }
      </style>
    </head>
    <body class="p-10 relative">
      <div class="bg-grid"></div>

      <!-- HEADER -->
      <div class="flex justify-between items-center border-b-2 border-[#00F5FF]/40 pb-6 mb-10">
        <div>
          <h1 class="text-4xl font-display font-bold text-[#00F5FF] tracking-wider drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">VASTAV AGENT</h1>
          <p class="text-xs font-mono text-[#94A3B8] tracking-widest uppercase mt-1">Deepfake Detection System &bull; Official Telemetry</p>
        </div>
        <div class="text-right font-mono text-[10px] text-[#64748B]">
          <div class="text-[#00F5FF] mb-1">DATE: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          <div>REPORT NO: ${caseId || "N/A"}</div>
          <div>INVESTIGATOR: ${investigator || "Internal System"}</div>
          <div>ENGINE: Google Gemini 2.5 Flash Lite Core</div>
        </div>
      </div>

      <!-- PAGE 1: VERDICT & IMAGE -->
      <div class="mb-12">
        <h2 class="text-center font-mono text-sm tracking-[0.3em] text-[#64748B] mb-2 uppercase">Final Ensemble Verdict</h2>
        <div class="max-w-3xl mx-auto rounded-2xl p-8 border-2 ${isReal ? 'border-[#00FFA3]/50 bg-[#00FFA3]/5 shadow-[0_0_50px_rgba(0,255,163,0.15)]' : 'border-[#FF3B5C]/50 bg-[#FF3B5C]/5 shadow-[0_0_50px_rgba(255,59,92,0.15)]'} text-center backdrop-blur-sm relative overflow-hidden">
          
          <h3 class="font-display font-bold text-6xl tracking-tight mb-4 ${isReal ? 'text-[#00FFA3] drop-shadow-[0_0_20px_rgba(0,255,163,0.5)]' : 'text-[#FF3B5C] drop-shadow-[0_0_20px_rgba(255,59,92,0.5)]'}">
            ${isReal ? "✓ AUTHENTIC MEDIA" : "⚠ SYNTHETIC/DEEPFAKE"}
          </h3>
          
          <div class="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-black/50 border border-white/10 font-mono text-lg text-white">
            Confidence Score: <span class="text-[#00F5FF] font-bold text-2xl">${confidence}</span>
          </div>

          ${metadata.synthId ? `
            <div class="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-300 font-mono text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              ⚠ SYNTHID WATERMARK DETECTED BY GOOGLE AI
            </div>
          ` : ''}
        </div>

        ${imageHtml}
      </div>

      <div class="page-break"></div>

      <!-- PAGE 2: METADATA & TELEMETRY -->
      <div class="grid grid-cols-2 gap-8 mb-10">
        <!-- Technical Metadata -->
        <div>
          <h2 class="text-xl font-display font-bold text-[#00F5FF] mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse"></span> SYSTEM METADATA
          </h2>
          <div class="space-y-3">
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Report Signature</span><span class="text-white">${caseId || "N/A"}</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Reporting Officer</span><span class="text-[#00F5FF] break-all max-w-[50%] text-right">${investigator || "Internal System"}</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">File Format (MIME)</span><span class="text-white">${mimeType || "image/jpeg"}</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Ensemble Size</span><span class="text-white">6 Neural Judges</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Generated By</span><span class="text-white">VASTAV Agent v1.0.0</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Creator</span><span class="text-[#00F5FF]">Navneet Singh</span>
            </div>
          </div>
        </div>

        <!-- GAN Metrics -->
        <div>
          <h2 class="text-xl font-display font-bold text-[#00F5FF] mb-4 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse"></span> GAN DETECTION METRICS
          </h2>
          <div class="space-y-3">
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">JPEG Artifact Base</span><span class="text-white">${metadata.jpegArtifacts || "Analyzed"}</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Noise Pattern Coherence</span><span class="text-white">${metadata.noisePatterns || "Analyzed"}</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Color Channel Delta</span><span class="text-white">${metadata.colorCoherence || "Analyzed"}</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">Edge Det. Integrity</span><span class="text-white">${metadata.edgeDetection || "Analyzed"}</span>
            </div>
            <div class="flex justify-between p-3 rounded bg-[#0A1628] border border-white/5 font-mono text-xs">
              <span class="text-[#64748B]">SynthID Match</span><span class="text-[#FF3B5C] font-bold">${metadata.synthId || "None Found"}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RAW JUDGE DATA -->
      <div>
        <h2 class="text-xl font-display font-bold text-[#00F5FF] mb-6 flex items-center gap-2 border-b border-[#00F5FF]/20 pb-2">
          <span class="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse"></span> RAW JUDGE TELEMETRY
        </h2>
        <div class="space-y-2">
          ${formattedResults}
        </div>
      </div>

    </body>
    </html>
    `;

    // Launch Puppeteer and generate PDF
    log("Spinning up headless browser to generate HTML PDF...", "SYSTEM");
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' }
    });

    await browser.close();
    log("PDF Agent generated HTML report successfully.", "SYSTEM");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=VASTAV-Analysis-${caseId}.pdf`);
    res.send(pdfBuffer);

  } catch (error: any) {
    log(`PDF generation error: ${error.message}`, "ERROR");
    res.status(500).json({ error: "Failed to generate HTML PDF report" });
  }
});

// ─────────────────────────────────────────────────────
// Auto-clear port before starting server
// ─────────────────────────────────────────────────────

function clearPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, (error) => {
      if (error) {
        console.log(`⚠️  Port ${port} was already free`);
      } else {
        console.log(`✅ Cleared port ${port}`);
      }
      resolve();
    });
  });
}

// Clear port before starting
clearPort(Number(PORT)).then(() => {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\n╔═══════════════════════════════════════════════════╗`);
    console.log(`║       VASTAV AGENT — Server Running               ║`);
    console.log(`║       Port: ${PORT}                               ║`);
    console.log(`║       Endpoints:                                  ║`);
    console.log(`║         GET  /          (Frontend Dashboard)      ║`);
    console.log(`║         GET  /health                              ║`);
    console.log(`║         POST /analyze        (multipart/form-data)║`);
    console.log(`║         POST /analyze-base64 (JSON body)          ║`);
    console.log(`║         POST /generate-pdf   (PDF Report)         ║`);
    console.log(`╚═══════════════════════════════════════════════════╝\n`);
  });
});
