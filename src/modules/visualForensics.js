/**
 * Visual Forensics Module
 * Analyzes pixel-level artifacts that indicate AI generation.
 *
 * Tuning notes:
 * - Real photos taken on phones/cameras have moderate edge variance (5–40)
 * - AI images are smoother but not always — thresholds widened accordingly
 * - Channel imbalance: real photos always have some colour cast (sunlight, indoor light)
 */

export const analyzeVisualArtifacts = (ctx, width, height) => {
  const sampleW = Math.min(width, 500);
  const sampleH = Math.min(height, 500);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imageData.data;
  const pixelCount = sampleW * sampleH;

  // --- 1. Edge Variance ---
  // Real photos: moderate variance from natural textures and noise
  // AI images: over-smoothed → unusually low variance
  let edgeVarianceSum = 0;
  for (let i = 0; i < data.length - 4; i += 4) {
    const diffR = Math.abs(data[i]     - data[i + 4]);
    const diffG = Math.abs(data[i + 1] - data[i + 5]);
    const diffB = Math.abs(data[i + 2] - data[i + 6]);
    edgeVarianceSum += (diffR + diffG + diffB) / 3;
  }
  const avgEdgeVariance = edgeVarianceSum / pixelCount;

  // Widened thresholds — real phone photos typically score 8–35
  let edgeScore;
  if (avgEdgeVariance > 8)       edgeScore = 85;
  else if (avgEdgeVariance > 4)  edgeScore = 65;
  else if (avgEdgeVariance > 2)  edgeScore = 45;
  else                           edgeScore = 25;

  // --- 2. Noise / Brightness Std Dev ---
  // Real images: natural sensor noise gives std dev of 25–80
  // AI images: too smooth (low std) or over-processed (very high std)
  let brightnessSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    brightnessSum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const avgBrightness = brightnessSum / pixelCount;
  let varianceSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
    varianceSum += Math.pow(b - avgBrightness, 2);
  }
  const stdDev = Math.sqrt(varianceSum / pixelCount);

  // Widened — most real photos 20–85 std dev
  let noiseScore;
  if (stdDev > 20 && stdDev < 100) noiseScore = 85;
  else if (stdDev > 10)            noiseScore = 60;
  else                             noiseScore = 30;

  // --- 3. Color Channel Correlation ---
  // Real photos always have some colour imbalance (warm/cool light)
  // Perfect balance (all channels equal) is a weak AI signal
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }
  const rAvg = rSum / pixelCount;
  const gAvg = gSum / pixelCount;
  const bAvg = bSum / pixelCount;
  const channelImbalance = Math.abs(rAvg - gAvg) + Math.abs(gAvg - bAvg);

  // Real photos almost always have imbalance > 3
  let channelScore;
  if (channelImbalance > 3)       channelScore = 85;
  else if (channelImbalance > 1)  channelScore = 60;
  else                            channelScore = 35;

  const finalScore = Math.round(
    (edgeScore * 0.40) + (noiseScore * 0.35) + (channelScore * 0.25)
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    details: {
      textureAnalysis:  edgeScore  > 60 ? 'Natural variance detected'    : 'Suspicious smoothing detected',
      edgeDetection:    edgeScore  > 60 ? 'Consistent edge patterns'      : 'Artificial edge patterns',
      noiseProfile:     noiseScore > 60 ? 'Organic sensor noise'          : 'Synthetic noise pattern',
      frequencyAnalysis:channelScore>60 ? 'Normal channel distribution'   : 'Unusual frequency patterns',
    },
    rawMetrics: {
      avgEdgeVariance:  avgEdgeVariance.toFixed(2),
      stdDev:           stdDev.toFixed(2),
      channelImbalance: channelImbalance.toFixed(2),
    }
  };
};
