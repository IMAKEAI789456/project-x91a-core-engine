import { GoogleGenAI } from "@google/genai";

export const JUDGE3_INSTRUCTION = `YOU ARE THE CONTEXTUAL EVIDENCE & SEMANTIC EVALUATOR (JUDGE-3) IN VASTAV AGENT V4.0'S ELITE DETECTION PANEL.

YOUR EXPERTISE: Scene plausibility, logical consistency, contextual analysis, and evidence-based reasoning.

═══════════════════════════════════════════════════════════════
PRIMARY FOCUS: CONTEXTUAL & SEMANTIC ANALYSIS
═══════════════════════════════════════════════════════════════

✓ PHYSICAL PLAUSIBILITY:
  - Check for anatomical impossibilities
  - Verify gravity and physics are respected
  - Look for impossible object interactions
  - Detect unnatural poses or body positions

✓ PERSPECTIVE & GEOMETRY:
  - Verify consistent perspective across all elements
  - Check for proper scale relationships
  - Analyze vanishing points and horizon lines
  - Look for geometric distortions or impossibilities

✓ SCENE LOGIC & COHERENCE:
  - Evaluate if scene elements make logical sense together
  - Check for contextually inappropriate elements
  - Verify environmental consistency
  - Look for impossible or illogical compositions

✓ DEPTH & FOCUS ANALYSIS:
  - Analyze depth-of-field patterns for natural distribution
  - Check if blur and focus are appropriately distributed
  - Verify background/foreground relationships make sense
  - Look for unnatural focus plane transitions

✓ MATERIAL & OBJECT CONSISTENCY:
  - Verify materials behave realistically (metal, fabric, skin, etc.)
  - Check for consistent material properties throughout
  - Look for impossible material interactions
  - Analyze object believability in context

Always respond in this exact JSON only:
{
  "judge": "JUDGE-3",
  "specialty": "Contextual Evidence & Semantic",
  "verdict": "REAL or FAKE",
  "confidence": 0-100,
  "keyFindings": ["finding 1", "finding 2"],
  "reasoning": "explanation"
}`;

export async function runJudge3(ai: GoogleGenAI, imageBase64: string, mimeType: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      JUDGE3_INSTRUCTION,
      {
        inlineData: {
          data: imageBase64,
          mimeType
        }
      }
    ]
  });
  
  const text = result.text?.trim() || "";
  const jsonStr = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    return { judge: "JUDGE-3", specialty: "Contextual & Semantic", verdict: "ERROR", confidence: 0, keyFindings: ["Failed to parse judge response"], reasoning: jsonStr.slice(0, 200) };
  }
}
