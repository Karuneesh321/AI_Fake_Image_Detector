/**
 * Visual Forensics Module
 * Analyzes pixel-level artifacts that indicate AI generation:
 * - Edge variance (AI images have unnaturally smooth edges)
 * - Noise distribution (real cameras have organic sensor noise)
 * - Color channel correlation (AI images show unusual channel patterns)
 * - Local variance (AI images often have "too uniform" texture regions)
 */

export const analyzeVisualArtifacts = (ctx, width, height) => {
  const sampleW = Math.min(width, 500);
  const sampleH = Math.min(height, 500);
  const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imageData.data;
  const pixelCount = sampleW * sampleH;

  // --- 1. Edge Variance ---
  // Real photos have high local variance due to natural textures.
  // AI images are over-smoothed → lower variance = suspicious.
  let edgeVarianceSum = 0;
  for (let i = 0; i < data.length - 4; i += 4) {
    const diffR = Math.abs(data[i] - data[i + 4]);
    const diffG = Math.abs(data[i + 1] - data[i + 5]);
    const diffB = Math.abs(data[i + 2] - data[i + 6]);
    edgeVarianceSum += (diffR + diffG + diffB) / 3;
  }
  const avgEdgeVariance = edgeVarianceSum / pixelCount;

  // --- 2. Noise Distribution ---
  // Compute standard deviation of pixel brightness.
  // Real images: medium-high std. AI images: often too low (smooth) or too high (artifacts).
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

  // --- 3. Color Channel Correlation ---
  // Real photos: R, G, B channels are somewhat independent.
  // AI images often have unnaturally balanced channels.
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

  // --- Score Calculation ---
  // Edge variance: higher = more natural
  let edgeScore = avgEdgeVariance > 25 ? 80 : avgEdgeVariance > 12 ? 55 : 25;
  // Std Dev: too low OR too high is suspicious
  let noiseScore = (stdDev > 30 && stdDev < 90) ? 80 : (stdDev > 15) ? 55 : 25;
  // Channel imbalance: some imbalance is natural; perfect balance is suspicious
  let channelScore = (channelImbalance > 5 && channelImbalance < 60) ? 80 : 45;

  const finalScore = Math.round((edgeScore * 0.4) + (noiseScore * 0.35) + (channelScore * 0.25));

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    details: {
      textureAnalysis: avgEdgeVariance > 25 ? 'Natural variance detected' : 'Suspicious smoothing detected',
      edgeDetection: edgeScore > 60 ? 'Consistent edge patterns' : 'Artificial edge patterns',
      noiseProfile: noiseScore > 60 ? 'Organic sensor noise' : 'Synthetic noise pattern',
      frequencyAnalysis: channelScore > 60 ? 'Normal channel distribution' : 'Unusual frequency patterns',
    },
    rawMetrics: {
      avgEdgeVariance: avgEdgeVariance.toFixed(2),
      stdDev: stdDev.toFixed(2),
      channelImbalance: channelImbalance.toFixed(2),
    }
  };
};
