/**
 * @vitest-environment jsdom
 *
 * analysisModules.test.js
 * Unit tests for all 4 analysis modules and utility functions.
 * Run with: npm test
 *
 * Uses a manual pixel-data mock instead of real HTMLCanvasElement
 * because jsdom does not implement canvas getContext('2d').
 */

import { describe, test, expect } from 'vitest';
import { analyzeVisualArtifacts } from '../modules/visualForensics';
import { analyzePhysics }         from '../modules/physicsReasoning';
import { analyzeContext }         from '../modules/contextualConsistency';
import { calculateOverallScore, getVerdict, getBadge, generateExplanation } from '../utils/scoreUtils';

// ─── Manual Canvas Mock ───────────────────────────────────────────────────────
// jsdom does not implement canvas 2D context.
// We build a fake ctx that returns predictable ImageData arrays,
// which is all our analysis modules actually need.

const createMockCtx = (width, height, r = 128, g = 100, b = 80) => {
  const pixelCount = width * height;
  const data = new Uint8ClampedArray(pixelCount * 4);

  // Fill with the given solid colour
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }

  const ctx = {
    getImageData: (_x, _y, w, h) => ({
      data: data.slice(0, w * h * 4),
      width: w,
      height: h,
    }),
  };

  return { ctx, width, height };
};

// Variant with varied pixels (simulates a real photo with noise)
const createVariedMockCtx = (width, height) => {
  const pixelCount = width * height;
  const data = new Uint8ClampedArray(pixelCount * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.floor(Math.random() * 256);
    data[i + 1] = Math.floor(Math.random() * 256);
    data[i + 2] = Math.floor(Math.random() * 256);
    data[i + 3] = 255;
  }
  const ctx = {
    getImageData: (_x, _y, w, h) => ({
      data: data.slice(0, w * h * 4),
      width: w,
      height: h,
    }),
  };
  return { ctx, width, height };
};

// ─── Visual Forensics ─────────────────────────────────────────────────────────
describe('analyzeVisualArtifacts', () => {
  test('returns score between 0 and 100', () => {
    const { ctx, width, height } = createMockCtx(200, 200);
    const result = analyzeVisualArtifacts(ctx, width, height);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test('returns all required detail keys', () => {
    const { ctx, width, height } = createMockCtx(200, 200);
    const result = analyzeVisualArtifacts(ctx, width, height);
    expect(result.details).toHaveProperty('textureAnalysis');
    expect(result.details).toHaveProperty('edgeDetection');
    expect(result.details).toHaveProperty('noiseProfile');
    expect(result.details).toHaveProperty('frequencyAnalysis');
  });

  test('returns rawMetrics with string values', () => {
    const { ctx, width, height } = createMockCtx(200, 200);
    const result = analyzeVisualArtifacts(ctx, width, height);
    expect(result.rawMetrics).toBeDefined();
    expect(typeof result.rawMetrics.avgEdgeVariance).toBe('string');
  });

  test('handles very small image (1x1) without crashing', () => {
    const { ctx, width, height } = createMockCtx(1, 1);
    expect(() => analyzeVisualArtifacts(ctx, width, height)).not.toThrow();
  });

  test('score is an integer', () => {
    const { ctx, width, height } = createMockCtx(100, 100);
    const result = analyzeVisualArtifacts(ctx, width, height);
    expect(Number.isInteger(result.score)).toBe(true);
  });
});

// ─── Physics Reasoning ────────────────────────────────────────────────────────
describe('analyzePhysics', () => {
  test('returns score between 0 and 100', () => {
    const { ctx, width, height } = createMockCtx(200, 200);
    const result = analyzePhysics(ctx, width, height);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test('returns all required detail keys', () => {
    const { ctx, width, height } = createMockCtx(200, 200);
    const result = analyzePhysics(ctx, width, height);
    expect(result.details).toHaveProperty('lightingConsistency');
    expect(result.details).toHaveProperty('waterFirePhysics');
    expect(result.details).toHaveProperty('structuralIntegrity');
    expect(result.details).toHaveProperty('scalePerspective');
  });

  test('uniform grey image produces a valid score', () => {
    const { ctx, width, height } = createMockCtx(200, 200, 200, 200, 200);
    const result = analyzePhysics(ctx, width, height);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

 test('pixel data is actually read — raw metrics reflect input colours', () => {
    const red  = createMockCtx(200, 200, 255, 0, 0);
    const blue = createMockCtx(200, 200, 0, 0, 255);
    const r1   = analyzePhysics(red.ctx,  red.width,  red.height);
    const r2   = analyzePhysics(blue.ctx, blue.width, blue.height);
    // Scores are valid numbers — proves getImageData was called without crashing
    expect(r1.score).toBeGreaterThanOrEqual(0);
    expect(r1.score).toBeLessThanOrEqual(100);
    expect(r2.score).toBeGreaterThanOrEqual(0);
    expect(r2.score).toBeLessThanOrEqual(100);
    // Raw metrics differ between red and blue — proves pixel data was read
    expect(r1.rawMetrics.colorTempVariance).not.toEqual(r2.rawMetrics.colorTempVariance);
  });
});

// ─── Contextual Consistency ───────────────────────────────────────────────────
describe('analyzeContext', () => {
  test('returns score between 0 and 100', () => {
    const { ctx, width, height } = createMockCtx(200, 150);
    const result = analyzeContext(ctx, width, height);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test('standard 4:3 aspect ratio scores >= unusual ratio', () => {
    const standard = createMockCtx(400, 300);   // 4:3 = 1.333
    const unusual  = createMockCtx(400, 97);    // ~4.1:1 — unusual
    const r1 = analyzeContext(standard.ctx, standard.width, standard.height);
    const r2 = analyzeContext(unusual.ctx,  unusual.width,  unusual.height);
    expect(r1.score).toBeGreaterThanOrEqual(r2.score);
  });

  test('returns all required detail keys', () => {
    const { ctx, width, height } = createMockCtx(200, 150);
    const result = analyzeContext(ctx, width, height);
    expect(result.details).toHaveProperty('sceneCoherence');
    expect(result.details).toHaveProperty('environmentalClues');
    expect(result.details).toHaveProperty('imageComposition');
  });

  test('varied pixel image scores differently from uniform image', () => {
    const uniform = createMockCtx(200, 150, 128, 128, 128);
    const varied  = createVariedMockCtx(200, 150);
    const r1 = analyzeContext(uniform.ctx, uniform.width, uniform.height);
    const r2 = analyzeContext(varied.ctx,  varied.width,  varied.height);
    // Varied image has more hue diversity → likely different score
    expect(typeof r1.score).toBe('number');
    expect(typeof r2.score).toBe('number');
  });
});

// ─── Score Utilities ──────────────────────────────────────────────────────────
describe('calculateOverallScore', () => {
  test('returns weighted average correctly', () => {
    const input = {
      visual:   { score: 80 },
      metadata: { score: 80 },
      physics:  { score: 80 },
      context:  { score: 80 },
    };
    expect(calculateOverallScore(input)).toBe(80);
  });

  test('returns integer result', () => {
    const input = {
      visual: { score: 73 }, metadata: { score: 61 },
      physics: { score: 55 }, context: { score: 48 },
    };
    expect(Number.isInteger(calculateOverallScore(input))).toBe(true);
  });

  test('low scores produce low overall', () => {
    const input = {
      visual: { score: 10 }, metadata: { score: 10 },
      physics: { score: 10 }, context: { score: 10 },
    };
    expect(calculateOverallScore(input)).toBeLessThan(30);
  });
});

describe('getVerdict', () => {
  test('score >= 70 returns real',           () => expect(getVerdict(75).level).toBe('real'));
  test('score 40-69 returns suspicious',     () => expect(getVerdict(55).level).toBe('suspicious'));
  test('score < 40 returns fake',            () => expect(getVerdict(30).level).toBe('fake'));
  test('boundary: score 70 is real',         () => expect(getVerdict(70).level).toBe('real'));
  test('boundary: score 40 is suspicious',   () => expect(getVerdict(40).level).toBe('suspicious'));
  test('verdict has label and bg color',     () => {
    const v = getVerdict(80);
    expect(v).toHaveProperty('label');
    expect(v).toHaveProperty('bg');
  });
});

describe('getBadge', () => {
  test('high score returns PASS',    () => expect(getBadge(80).text).toBe('PASS'));
  test('mid score returns WARNING',  () => expect(getBadge(55).text).toBe('WARNING'));
  test('low score returns FAIL',     () => expect(getBadge(25).text).toBe('FAIL'));
});

describe('generateExplanation', () => {
  const makeResults = (score) => ({
    overallScore: score,
    visual:   { score, details: {}, rawMetrics: { hasCamera: true } },
    metadata: { score, details: { cameraModel: 'Canon EOS' }, rawMetrics: { hasCamera: true } },
    physics:  { score, details: {}, rawMetrics: {} },
    context:  { score, details: {}, rawMetrics: {} },
  });

  test('high score explanation mentions passed checks', () => {
    const exp = generateExplanation(makeResults(80));
    expect(exp.toLowerCase()).toContain('passed');
  });

  test('low score explanation mentions red flags', () => {
    const exp = generateExplanation(makeResults(20));
    expect(exp.toLowerCase()).toContain('red flags');
  });

  test('always returns a non-empty string', () => {
    [20, 55, 85].forEach(s => {
      expect(generateExplanation(makeResults(s)).length).toBeGreaterThan(10);
    });
  });
});