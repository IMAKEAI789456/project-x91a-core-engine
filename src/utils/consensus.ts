import { JudgeResult } from "../agents/judgePanel";

export interface ConsensusResult {
  finalVerdict: "REAL" | "FAKE";
  realCount: number;
  fakeCount: number;
  totalJudges: number;
  consensusStrength: number;
  adjustedConfidence: number;
  synthIdDetected: boolean;
  summary: string;
}

export function buildConsensus(judges: JudgeResult[]): ConsensusResult {
  const validJudges = judges.filter((j) => j.verdict === "REAL" || j.verdict === "FAKE");
  const realCount = validJudges.filter((j) => j.verdict === "REAL").length;
  const fakeCount = validJudges.length - realCount;
  const totalValid = validJudges.length;

  // Majority is > 50% for REAL, otherwise FAKE (handles variable valid judge count)
  let finalVerdict: "REAL" | "FAKE" = "FAKE";
  if (totalValid > 0 && realCount > totalValid / 2) {
    finalVerdict = "REAL";
  } else if (totalValid === 0) {
    // If all judges error out, fallback to FAKE to be safe, but low confidence
    finalVerdict = "FAKE"; 
  }

  const consensusStrength = totalValid > 0 ? Math.max(realCount, fakeCount) / totalValid : 0;
  const baseConfidence = Math.round(consensusStrength * 100);
  const adjustedConfidence = totalValid > 0 ? Math.min(baseConfidence + (consensusStrength > 0.8 ? 5 : 0), 99) : 0;

  const synthIdDetected = validJudges.some((j) => j.synthIdDetected === true);

  const summary =
    `📊 CONSENSUS: ${realCount} REAL vs ${fakeCount} FAKE (${judges.length - totalValid} ERRORS) | ` +
    `🎯 STRENGTH: ${Math.round(consensusStrength * 100)}% | ` +
    `✅ FINAL: ${finalVerdict} @ ${adjustedConfidence}% confidence` +
    (synthIdDetected ? " | 🛡️ SYNTHID DETECTED" : "");

  return {
    finalVerdict,
    realCount,
    fakeCount,
    totalJudges: totalValid,
    consensusStrength,
    adjustedConfidence,
    synthIdDetected,
    summary,
  };
}
