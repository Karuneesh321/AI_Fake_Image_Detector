/**
 * scoreUtils.js
 * Pure utility functions for score calculation, verdict logic, and explanation generation.
 * Keeping these separate makes them easy to unit-test independently.
 */

// Weighted combination of all 4 module scores
export const calculateOverallScore = ({ visual, metadata, physics, context }) => {
  return Math.round(
    visual.score   * 0.35 +
    metadata.score * 0.25 +
    physics.score  * 0.25 +
    context.score  * 0.15
  );
};

export const getVerdict = (score) => {
  if (score >= 70) return { label: '✅ LIKELY AUTHENTIC',    level: 'real',       color: '#155724', bg: '#d4edda' };
  if (score >= 40) return { label: '⚠️ SUSPICIOUS',          level: 'suspicious', color: '#856404', bg: '#fff3cd' };
  return              { label: '❌ LIKELY FAKE / AI-GENERATED', level: 'fake',   color: '#721c24', bg: '#f8d7da' };
};

export const getBadge = (score) => {
  if (score >= 70) return { text: 'PASS',    className: 'badge-pass'    };
  if (score >= 40) return { text: 'WARNING', className: 'badge-warning' };
  return               { text: 'FAIL',    className: 'badge-fail'    };
};

export const generateExplanation = (results) => {
  const { overallScore, visual, metadata, physics, context } = results;
  const weakModules = [];
  if (visual.score < 60)    weakModules.push('visual forensics');
  if (metadata.score < 60)  weakModules.push('metadata integrity');
  if (physics.score < 60)   weakModules.push('physical consistency');
  if (context.score < 60)   weakModules.push('contextual coherence');

  if (overallScore >= 70) {
    return `The image passed most authenticity checks with a score of ${overallScore}/100. ` +
      `Visual forensics detected natural textures and realistic noise patterns consistent with ` +
      `real photography. ${metadata.rawMetrics?.hasCamera
        ? `Metadata confirms camera: ${metadata.details.cameraModel}.`
        : 'Metadata analysis shows acceptable signals.'} ` +
      `Physical elements appear consistent with real-world physics. ` +
      `Independent verification is still recommended for critical decisions.`;
  }

  if (overallScore >= 40) {
    return `The image shows mixed signals (score: ${overallScore}/100) requiring further investigation. ` +
      (weakModules.length > 0
        ? `Concerns identified in: ${weakModules.join(', ')}. `
        : '') +
      `Manual expert review is strongly recommended before trusting this image.`;
  }

  return `High probability of AI generation or significant manipulation detected (score: ${overallScore}/100). ` +
    `Multiple red flags identified across: ${weakModules.join(', ')}. ` +
    `This image should be treated as UNVERIFIED until proven otherwise through independent sources.`;
};
