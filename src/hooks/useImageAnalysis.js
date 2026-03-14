/**
 * useImageAnalysis.js
 * Custom React hook that orchestrates all 4 analysis modules.
 *
 * Option 3 improvement: Camera bonus
 * If real EXIF camera data is confirmed, bump the overall score by up to +15.
 * A photo confirmed to come from a real camera is very unlikely to be AI-generated.
 *
 * Score floor:
 * If 3 or more modules pass (>= 60), the overall score is floored at 45
 * to avoid falsely labelling clearly real photos as "Fake".
 */

import { useState, useCallback } from 'react';
import { analyzeVisualArtifacts } from '../modules/visualForensics';
import { analyzeMetadata }        from '../modules/metadataAnalysis';
import { analyzePhysics }         from '../modules/physicsReasoning';
import { analyzeContext }         from '../modules/contextualConsistency';
import { calculateOverallScore, generateExplanation } from '../utils/scoreUtils';

export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults]         = useState(null);
  const [error, setError]             = useState(null);
  const [progress, setProgress]       = useState(0);

  const analyze = useCallback(async (file, previewUrl) => {
    if (!file || !previewUrl) return;

    setIsAnalyzing(true);
    setResults(null);
    setError(null);
    setProgress(0);

    try {
      // Load image into canvas for pixel analysis
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve, reject) => {
        img.onload  = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      setProgress(10);
      const visual = analyzeVisualArtifacts(ctx, img.width, img.height);

      setProgress(35);
      const metadata = await analyzeMetadata(file);

      setProgress(60);
      const physics = analyzePhysics(ctx, img.width, img.height);

      setProgress(80);
      const context = analyzeContext(ctx, img.width, img.height);

      setProgress(95);

      // --- Base weighted score ---
      let overallScore = calculateOverallScore({ visual, metadata, physics, context });

      // --- Option 3: Camera bonus ---
      // If EXIF confirms a real camera, this is very strong evidence of authenticity
      if (metadata.rawMetrics?.hasCamera) {
        overallScore = Math.min(100, overallScore + 15);
      }

      // --- Score floor ---
      // If 3+ modules individually pass (score >= 60), don't let the overall
      // drop below 45 — avoids falsely flagging real photos as "Fake"
      const passingModules = [visual, metadata, physics, context]
        .filter(m => m.score >= 60).length;
      if (passingModules >= 3) {
        overallScore = Math.max(overallScore, 48);
      }

      // --- AI software hard override ---
      // If metadata detected known AI software, cap score at 30 regardless
      if (metadata.rawMetrics?.hasAISoftware) {
        overallScore = Math.min(overallScore, 30);
      }

      overallScore = Math.round(overallScore);

      const explanation = generateExplanation({
        overallScore, visual, metadata, physics, context
      });

      setProgress(100);
      setResults({ overallScore, visual, metadata, physics, context, explanation });

    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  return { analyze, isAnalyzing, results, error, progress, reset };
};
