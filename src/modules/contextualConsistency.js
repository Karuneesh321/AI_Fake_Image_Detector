/**
 * Contextual Consistency Module
 * Examines image-level properties for realistic composition.
 *
 * Tuning notes:
 * - Tonal range: many real photos (indoor, night, close-ups) have range 80–150
 *   Old threshold (>180) was too strict — widened to >60
 * - Hue diversity: even simple photos (close-up portrait) use 6–12 hue buckets
 *   Old threshold (>20) was too strict — widened to >5
 * - Aspect ratio: most phone and camera photos match standard ratios well
 */

export const analyzeContext = (ctx, width, height) => {
  const sampleW = Math.min(width, 400);
  const sampleH = Math.min(height, 400);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imageData.data;
  const pixelCount = sampleW * sampleH;

  // --- 1. Aspect Ratio Check ---
  const aspectRatio = width / height;
  const commonRatios = [1.333, 1.5, 1.778, 1.0, 0.75, 0.667, 0.5625, 1.25, 0.8];
  const closestRatio = commonRatios.reduce((prev, curr) =>
    Math.abs(curr - aspectRatio) < Math.abs(prev - aspectRatio) ? curr : prev
  );
  const ratioDeviation = Math.abs(aspectRatio - closestRatio);

  // Widened — accept more aspect ratio variation
  let ratioScore;
  if      (ratioDeviation < 0.15) ratioScore = 85;
  else if (ratioDeviation < 0.35) ratioScore = 65;
  else                            ratioScore = 40;

  // --- 2. Color Diversity (hue buckets) ---
  const hueBuckets = new Array(36).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min < 0.05) continue; // skip near-grey pixels (lowered from 0.1)
    let hue = 0;
    if      (max === r) hue = ((g - b) / (max - min)) % 6;
    else if (max === g) hue = (b - r) / (max - min) + 2;
    else                hue = (r - g) / (max - min) + 4;
    hue = Math.round((hue * 60 + 360) % 360 / 10) % 36;
    hueBuckets[hue]++;
  }
  const activeBuckets = hueBuckets.filter(v => v > pixelCount * 0.001).length;

  // Widened — even simple portraits use 5–10 hue buckets
  let diversityScore;
  if      (activeBuckets > 8)  diversityScore = 85;
  else if (activeBuckets > 4)  diversityScore = 70;
  else if (activeBuckets > 1)  diversityScore = 50;
  else                         diversityScore = 30;

  // --- 3. Tonal Range ---
  // Real photos of ANY subject span a reasonable brightness range.
  // Very narrow tonal range = possibly AI-generated flat scene.
  let minBright = 255, maxBright = 0;
  for (let i = 0; i < data.length; i += 4) {
    const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (b < minBright) minBright = b;
    if (b > maxBright) maxBright = b;
  }
  const tonalRange = maxBright - minBright;

  // Widened — even indoor/night photos have range >60
  let tonalScore;
  if      (tonalRange > 60)  tonalScore = 85;
  else if (tonalRange > 30)  tonalScore = 65;
  else if (tonalRange > 10)  tonalScore = 45;
  else                       tonalScore = 25;

  const finalScore = Math.round(
    (ratioScore * 0.20) + (diversityScore * 0.45) + (tonalScore * 0.35)
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    details: {
      sceneCoherence:      diversityScore > 60 ? 'Elements match disaster type'         : 'Contextual inconsistencies',
      environmentalClues:  tonalScore     > 60 ? 'Appropriate environmental signs'      : 'Missing expected elements',
      imageComposition:    ratioScore     > 60 ? 'Natural framing'                      : 'Artificially composed scene',
    },
    rawMetrics: {
      aspectRatio:      aspectRatio.toFixed(3),
      activeHueBuckets: activeBuckets,
      tonalRange:       tonalRange.toFixed(0),
    }
  };
};
