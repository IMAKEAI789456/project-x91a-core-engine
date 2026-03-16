import { GoogleGenAI } from "@google/genai";
import { runJudge1 } from "./judge1_forensic";
import { runJudge2 } from "./judge2_artifacts";
import { runJudge3 } from "./judge3_context";
import { runJudge4 } from "./judge4_physics";
import { runJudge5 } from "./judge5_chief";
import { runJudge6 } from "./judge6_ai_origin";
import { buildConsensus } from "../utils/consensus";

export interface JudgeResult {
  judge: string;
  specialty: string;
  verdict: "REAL" | "FAKE" | "NO_VOTE";
  confidence: number;
  keyFindings: string[];
  reasoning: string;
  synthIdDetected?: boolean;
}

export interface PanelResult {
  judges: JudgeResult[];
  consensus: ReturnType<typeof buildConsensus>;
}

export async function runJudgePanel(
  apiKey: string, 
  imageBase64: string, 
  mimeType: string, 
  metadataText?: string,
  onProgress?: (message: string) => void
): Promise<PanelResult> {
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const noVote = (id: string, spec: string) => ({
    judge: id, specialty: spec, verdict: "NO_VOTE" as const,
    confidence: 0, reasoning: "Neural pathway unreachable. Node abstaining from current consensus framework.", keyFindings: ["Signal interference detected"]
  });

  onProgress?.("[SYS] Initializing 6-Judge AI Panel...");
  onProgress?.("[NET] Establishing secure connection to Gemini 2.0 Flash via ADK...");
  
  console.log("🔍 Running Batch 1 — Judges 1 & 2...");
  onProgress?.("[JUDGE] Activating Judge 1: Forensic & Biometric Analysis...");
  onProgress?.("[JUDGE] Activating Judge 2: AI Artifacts & Neural Patterns...");
  
  const [j1, j2] = await Promise.all([
    runJudge1(ai, imageBase64, mimeType).catch((err) => {
      console.error("❌ Judge 1 Error:", err.message);
      onProgress?.(`[ERR] Judge 1 failed: ${err.message}`);
      return noVote("JUDGE-1", "Forensic Analysis");
    }),
    runJudge2(ai, imageBase64, mimeType, metadataText).catch((err) => {
      console.error("❌ Judge 2 Error:", err.message);
      onProgress?.(`[ERR] Judge 2 failed: ${err.message}`);
      return noVote("JUDGE-2", "Artifacts");
    }),
  ]);
  
  onProgress?.(`[JUDGE] Judge 1 verdict: ${j1.verdict} (${j1.confidence}% confidence)`);
  onProgress?.(`[JUDGE] Judge 2 verdict: ${j2.verdict} (${j2.confidence}% confidence)`);

  console.log("🔬 Running Batch 2 — Judges 3 & 4...");
  onProgress?.("[JUDGE] Activating Judge 3: Contextual & Semantic Analysis...");
  onProgress?.("[JUDGE] Activating Judge 4: Physics & Lighting Simulation...");
  
  const [j3, j4] = await Promise.all([
    runJudge3(ai, imageBase64, mimeType).catch(() => noVote("JUDGE-3", "Context")),
    runJudge4(ai, imageBase64, mimeType).catch(() => noVote("JUDGE-4", "Physics")),
  ]);
  
  onProgress?.(`[JUDGE] Judge 3 verdict: ${j3.verdict} (${j3.confidence}% confidence)`);
  onProgress?.(`[JUDGE] Judge 4 verdict: ${j4.verdict} (${j4.confidence}% confidence)`);

  console.log("⚖️ Running Batch 3 — Judge 5 (Chief Justice)...");
  onProgress?.("[JUDGE] Activating Judge 5: Chief Justice (Meta-Analysis)...");
  
  const j5 = await runJudge5(ai, imageBase64, mimeType).catch(() => noVote("JUDGE-5", "Chief Justice"));
  
  onProgress?.(`[JUDGE] Judge 5 verdict: ${j5.verdict} (${j5.confidence}% confidence)`);

  console.log("🛡️ Running Batch 4 — Judge 6 (SynthID Detector)...");
  onProgress?.("[JUDGE] Activating Judge 6: SynthID Watermark Detection...");
  
  const j6 = await runJudge6(ai, imageBase64, mimeType).catch(() => noVote("JUDGE-6", "SynthID"));
  
  onProgress?.(`[JUDGE] Judge 6 verdict: ${j6.verdict} (${j6.confidence}% confidence)`);
  if (j6.synthIdDetected) {
    onProgress?.("[SYS] ⚠️ ALERT: Google SynthID watermark detected!");
  }

  onProgress?.("[SYS] All judges have deliberated. Building consensus...");
  const judges: JudgeResult[] = [j1, j2, j3, j4, j5, j6];
  const consensus = buildConsensus(judges);
  
  onProgress?.(`[SYS] Consensus reached: ${consensus.finalVerdict} (${consensus.adjustedConfidence}% confidence)`);
  onProgress?.(`[SYS] Vote tally: ${consensus.realCount} REAL, ${consensus.fakeCount} FAKE`);

  return { judges, consensus };
}
