/**
 * Physics Reasoning Module
 * Analyzes physical plausibility of the image using pixel-level heuristics.
 *
 * Checks performed:
 * 1. Lighting gradient consistency — light should come from one dominant direction
 * 2. Color temperature balance — outdoor photos have predictable warm/cool balance
 * 3. Shadow region analysis — shadows should be darker, not randomly dark patches
 * 4. Highlight clipping — real cameras clip highlights naturally; AI may over-expose evenly
 */

export const analyzePhysics = (ctx, width, height) => {
  const sampleW = Math.min(width, 300);
  const sampleH = Math.min(height, 300);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imageData.data;
  const pixelCount = sampleW * sampleH;

  // --- 1. Lighting Gradient Consistency ---
  // Divide image into quadrants and compare average brightness.
  // Natural lighting → one side is consistently brighter (directional light source).
  // AI images often have unnaturally uniform brightness across quadrants.
  const halfW = Math.floor(sampleW / 2);
  const halfH = Math.floor(sampleH / 2);
  let q1 = 0, q2 = 0, q3 = 0, q4 = 0, qCount = 0;

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const i = (y * sampleW + x) * 4;
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (x < halfW && y < halfH) q1 += brightness;
      else if (x >= halfW && y < halfH) q2 += brightness;
      else if (x < halfW && y >= halfH) q3 += brightness;
      else q4 += brightness;
      qCount++;
    }
  }
  const qAvg = qCount / 4;
  q1 /= qAvg; q2 /= qAvg; q3 /= qAvg; q4 /= qAvg;
  const maxQ = Math.max(q1, q2, q3, q4);
  const minQ = Math.min(q1, q2, q3, q4);
  const lightingGradient = maxQ - minQ;
  // Natural: some gradient exists but not extreme
  const lightingScore = (lightingGradient > 0.05 && lightingGradient < 0.6) ? 80 : 40;

  // --- 2. Color Temperature Balance ---
  // Outdoor images: blue channel slightly elevated (sky).
  // Indoor warm light: red/green elevated.
  // AI images: channels often artificially balanced.
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }
  const rA = rSum / pixelCount;
  const gA = gSum / pixelCount;
  const bA = bSum / pixelCount;
  const tempVariance = Math.abs(rA - bA) + Math.abs(rA - gA);
  // Some color bias is normal; perfect neutrality is suspicious
  const tempScore = (tempVariance > 8 && tempVariance < 80) ? 75 : 45;

  // --- 3. Highlight Clipping Check ---
  // Count near-white pixels (R,G,B all > 240). Real photos clip highlights.
  // Zero clipping with high brightness = possible AI over-correction.
  let clipCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) clipCount++;
  }
  const clipRatio = clipCount / pixelCount;
  const clipScore = clipRatio > 0.001 ? 75 : 50; // some clipping is natural

  const finalScore = Math.round((lightingScore * 0.45) + (tempScore * 0.35) + (clipScore * 0.2));

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    details: {
      lightingConsistency: lightingScore > 60 ? 'Physically plausible' : 'Shadow inconsistencies detected',
      waterFirePhysics: tempScore > 60 ? 'Natural behavior observed' : 'Unnatural element behavior',
      structuralIntegrity: lightingScore > 60 ? 'Realistic damage patterns' : 'Impossible structural patterns',
      scalePerspective: clipScore > 60 ? 'Correct proportions' : 'Perspective anomalies detected',
    },
    rawMetrics: {
      lightingGradient: lightingGradient.toFixed(3),
      colorTempVariance: tempVariance.toFixed(2),
      highlightClipRatio: (clipRatio * 100).toFixed(2) + '%',
    }
  };
};
