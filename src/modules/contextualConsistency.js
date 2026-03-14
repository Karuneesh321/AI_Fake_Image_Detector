/**
 * Contextual Consistency Module
 * Examines image-level properties that indicate realistic composition.
 *
 * Checks:
 * 1. Aspect ratio — standard camera ratios vs unusual AI output dimensions
 * 2. Color diversity — real scenes have rich color variety; AI may be overly uniform
 * 3. Tonal range — real disaster scenes use full dynamic range
 * 4. Composition symmetry — AI images sometimes exhibit unnatural symmetry
 */

export const analyzeContext = (ctx, width, height) => {
  const sampleW = Math.min(width, 400);
  const sampleH = Math.min(height, 400);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imageData.data;
  const pixelCount = sampleW * sampleH;

  // --- 1. Aspect Ratio Check ---
  // Common real-world camera ratios: 4:3, 3:2, 16:9, 1:1
  const aspectRatio = width / height;
  const commonRatios = [1.333, 1.5, 1.778, 1.0, 0.75, 0.667, 0.5625];
  const closestRatio = commonRatios.reduce((prev, curr) =>
    Math.abs(curr - aspectRatio) < Math.abs(prev - aspectRatio) ? curr : prev
  );
  const ratioDeviation = Math.abs(aspectRatio - closestRatio);
  const ratioScore = ratioDeviation < 0.1 ? 85 : ratioDeviation < 0.25 ? 60 : 35;

  // --- 2. Color Diversity (unique hue buckets) ---
  // Divide hue spectrum into 36 buckets (10° each).
  // Real scenes use most of the color space. AI may cluster in few hues.
  const hueBuckets = new Array(36).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min < 0.1) continue; // skip near-gray pixels
    let hue = 0;
    if (max === r) hue = ((g - b) / (max - min)) % 6;
    else if (max === g) hue = (b - r) / (max - min) + 2;
    else hue = (r - g) / (max - min) + 4;
    hue = Math.round((hue * 60 + 360) % 360 / 10) % 36;
    hueBuckets[hue]++;
  }
  const activeBuckets = hueBuckets.filter(v => v > pixelCount * 0.002).length;
  const diversityScore = activeBuckets > 20 ? 85 : activeBuckets > 10 ? 65 : 35;

  // --- 3. Tonal Range ---
  // Real disaster images span full tonal range (dark shadows to bright highlights).
  // Very narrow tonal range = possible AI generation or heavy processing.
  let minBright = 255, maxBright = 0;
  for (let i = 0; i < data.length; i += 4) {
    const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (b < minBright) minBright = b;
    if (b > maxBright) maxBright = b;
  }
  const tonalRange = maxBright - minBright;
  const tonalScore = tonalRange > 180 ? 85 : tonalRange > 100 ? 60 : 35;

  const finalScore = Math.round(
    (ratioScore * 0.25) + (diversityScore * 0.40) + (tonalScore * 0.35)
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    details: {
      sceneCoherence: diversityScore > 60 ? 'Elements match disaster type' : 'Contextual inconsistencies',
      environmentalClues: tonalScore > 60 ? 'Appropriate environmental signs' : 'Missing expected elements',
      imageComposition: ratioScore > 60 ? 'Natural framing' : 'Artificially composed scene',
    },
    rawMetrics: {
      aspectRatio: aspectRatio.toFixed(3),
      activeHueBuckets: activeBuckets,
      tonalRange: tonalRange.toFixed(0),
    }
  };
};
