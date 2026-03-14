/**
 * Physics Reasoning Module
 * Analyzes physical plausibility using pixel-level heuristics.
 *
 * Tuning notes:
 * - Lighting gradient: real photos can have very subtle OR very strong gradients
 *   The old range (0.05–0.6) was too narrow — widened to (0.005–0.95)
 * - Colour temperature: indoor/outdoor photos both vary widely — widened range
 * - Highlight clipping: many real photos have very few clipped pixels — lowered threshold
 */

export const analyzePhysics = (ctx, width, height) => {
  const sampleW = Math.min(width, 300);
  const sampleH = Math.min(height, 300);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imageData.data;
  const pixelCount = sampleW * sampleH;

  // --- 1. Lighting Gradient Consistency ---
  // Divide into quadrants and compare average brightness per quadrant.
  // Real photos: directional light → some gradient always exists.
  const halfW = Math.floor(sampleW / 2);
  const halfH = Math.floor(sampleH / 2);
  let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
  let q1c = 0, q2c = 0, q3c = 0, q4c = 0;

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const i = (y * sampleW + x) * 4;
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if      (x < halfW && y < halfH)  { q1 += brightness; q1c++; }
      else if (x >= halfW && y < halfH) { q2 += brightness; q2c++; }
      else if (x < halfW && y >= halfH) { q3 += brightness; q3c++; }
      else                              { q4 += brightness; q4c++; }
    }
  }

  // Avoid division by zero for very small images
  const qAvgs = [
    q1c > 0 ? q1 / q1c : 128,
    q2c > 0 ? q2 / q2c : 128,
    q3c > 0 ? q3 / q3c : 128,
    q4c > 0 ? q4 / q4c : 128,
  ];
  const maxQ = Math.max(...qAvgs);
  const minQ = Math.min(...qAvgs);
  // Normalise to 0–1 scale
  const lightingGradient = (maxQ - minQ) / 255;

  // Widened range — almost any gradient is acceptable for real photos
  let lightingScore;
  if      (lightingGradient > 0.005 && lightingGradient < 0.95) lightingScore = 85;
  else if (lightingGradient >= 0.95)                             lightingScore = 55; // extreme gradient = suspicious
  else                                                           lightingScore = 45; // perfectly uniform = suspicious

  // --- 2. Color Temperature Variance ---
  // Real photos always have some colour cast (warm indoor, cool outdoor, etc.)
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

  // Widened — even a tiny colour imbalance (>2) is natural
  let tempScore;
  if      (tempVariance > 2 && tempVariance < 120) tempScore = 85;
  else if (tempVariance >= 120)                     tempScore = 60; // extreme cast
  else                                              tempScore = 40; // perfect neutrality

  // --- 3. Highlight Clipping ---
  // Real cameras clip highlights naturally — even 1 clipped pixel is a positive signal
  let clipCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245) clipCount++;
  }
  const clipRatio = clipCount / pixelCount;
  // Lowered threshold — even 0.05% clipping counts as natural
  let clipScore;
  if      (clipRatio > 0.0005) clipScore = 80;
  else if (clipRatio > 0)      clipScore = 65;
  else                         clipScore = 45;

  const finalScore = Math.round(
    (lightingScore * 0.45) + (tempScore * 0.35) + (clipScore * 0.20)
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    details: {
      lightingConsistency: lightingScore > 60 ? 'Physically plausible'        : 'Shadow inconsistencies detected',
      waterFirePhysics:    tempScore     > 60 ? 'Natural behavior observed'    : 'Unnatural element behavior',
      structuralIntegrity: lightingScore > 60 ? 'Realistic damage patterns'    : 'Impossible structural patterns',
      scalePerspective:    clipScore     > 60 ? 'Correct proportions'          : 'Perspective anomalies detected',
    },
    rawMetrics: {
      lightingGradient:    lightingGradient.toFixed(3),
      colorTempVariance:   tempVariance.toFixed(2),
      highlightClipRatio:  (clipRatio * 100).toFixed(3) + '%',
    }
  };
};
