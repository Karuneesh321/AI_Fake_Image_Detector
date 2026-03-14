/**
 * useImageAnalysis.js
 * Custom React hook that orchestrates all 4 analysis modules.
 * Separating this from the UI keeps App.jsx clean and this logic unit-testable.
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

      // Run modules sequentially with progress updates
      setProgress(10);
      const visual = analyzeVisualArtifacts(ctx, img.width, img.height);

      setProgress(35);
      const metadata = await analyzeMetadata(file);

      setProgress(60);
      const physics = analyzePhysics(ctx, img.width, img.height);

      setProgress(80);
      const context = analyzeContext(ctx, img.width, img.height);

      setProgress(95);
      const overallScore = calculateOverallScore({ visual, metadata, physics, context });
      const explanation  = generateExplanation({ overallScore, visual, metadata, physics, context });

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
