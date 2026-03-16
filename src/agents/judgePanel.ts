import { GoogleGenerativeAI } from "@google/generative-ai";
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

export async function runJudgePanel(apiKey: string, imageBase64: string, mimeType: string, metadataText?: string): Promise<PanelResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const noVote = (id: string, spec: string) => ({
    judge: id, specialty: spec, verdict: "NO_VOTE" as const,
    confidence: 0, reasoning: "Neural pathway unreachable. Node abstaining from current consensus framework.", keyFindings: ["Signal interference detected"]
  });

  console.log("🔍 Running Batch 1 — Judges 1 & 2...");
  const [j1, j2] = await Promise.all([
    runJudge1(model, imageBase64, mimeType).catch(() => noVote("JUDGE-1", "Forensic Analysis")),
    runJudge2(model, imageBase64, mimeType, metadataText).catch(() => noVote("JUDGE-2", "Artifacts")),
  ]);

  console.log("🔬 Running Batch 2 — Judges 3 & 4...");
  const [j3, j4] = await Promise.all([
    runJudge3(model, imageBase64, mimeType).catch(() => noVote("JUDGE-3", "Context")),
    runJudge4(model, imageBase64, mimeType).catch(() => noVote("JUDGE-4", "Physics")),
  ]);

  console.log("⚖️ Running Batch 3 — Judge 5 (Chief Justice)...");
  const j5 = await runJudge5(model, imageBase64, mimeType).catch(() => noVote("JUDGE-5", "Chief Justice"));

  console.log("🛡️ Running Batch 4 — Judge 6 (SynthID Detector)...");
  const j6 = await runJudge6(model, imageBase64, mimeType).catch(() => noVote("JUDGE-6", "SynthID"));

  const judges: JudgeResult[] = [j1, j2, j3, j4, j5, j6];
  const consensus = buildConsensus(judges);

  return { judges, consensus };
}
