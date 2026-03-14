/**
 * ResultsPanel.jsx
 * Displays the full analysis result:
 * - Overall authenticity score (large number)
 * - Verdict banner
 * - 4 ModuleCards (one per analysis module)
 * - Detailed explanation
 * - Export JSON button (useful for demo / NVIDIA interview)
 */

import ModuleCard from './ModuleCard';
import { getVerdict } from '../utils/scoreUtils';

const MODULES = [
  { key: 'visual',   icon: '🔬', title: 'Visual Forensics Analysis'  },
  { key: 'metadata', icon: '📋', title: 'Metadata Analysis'          },
  { key: 'physics',  icon: '⚛️',  title: 'Physics Reasoning Engine'  },
  { key: 'context',  icon: '🌍', title: 'Contextual Consistency'     },
];

const ResultsPanel = ({ results }) => {
  const { overallScore, explanation } = results;
  const verdict = getVerdict(overallScore);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Overall Score */}
      <div className="score-display">
        <div
          className="score-value"
          role="status"
          aria-label={`Authenticity score: ${overallScore} out of 100`}
        >
          {overallScore}
        </div>
        <div className="score-label">Authenticity Score</div>

        {/* Module score summary row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          {MODULES.map(m => (
            <div key={m.key} style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
              <div style={{
                fontWeight: '600', fontSize: '18px',
                color: results[m.key].score >= 70 ? '#28a745'
                     : results[m.key].score >= 40 ? '#ffc107' : '#dc3545'
              }}>
                {results[m.key].score}
              </div>
              <div>{m.icon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Verdict Banner */}
      <div
        className={`verdict ${verdict.level}`}
        role="alert"
        aria-live="polite"
      >
        {verdict.label}
      </div>

      {/* 4 Module Cards */}
      <div className="analysis-modules">
        {MODULES.map(m => (
          <ModuleCard
            key={m.key}
            icon={m.icon}
            title={m.title}
            moduleResult={results[m.key]}
          />
        ))}
      </div>

      {/* Explanation */}
      <div className="explanation-box">
        <div className="explanation-title">📝 Detailed Explanation</div>
        <div className="explanation-text">{explanation}</div>
      </div>

      {/* Export button */}
      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <button
          onClick={handleExport}
          style={{
            background: 'none', border: '1px solid #667eea', color: '#667eea',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
            cursor: 'pointer',
          }}
          title="Download full analysis as JSON"
        >
          ⬇️ Export Analysis JSON
        </button>
      </div>
    </div>
  );
};

export default ResultsPanel;
