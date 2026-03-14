/**
 * ModuleCard.jsx
 * Renders a single analysis module result with:
 * - Title + PASS/WARNING/FAIL badge
 * - Animated score progress bar
 * - Detail list of sub-checks
 * - Raw metrics in a collapsible section (for technical reviewers)
 */

import { useState } from 'react';
import { getBadge } from '../utils/scoreUtils';

const ModuleCard = ({ icon, title, moduleResult }) => {
  const [showRaw, setShowRaw] = useState(false);
  const { score, details, rawMetrics } = moduleResult;
  const badge = getBadge(score);

  // Progress bar color based on score
  const barColor = score >= 70 ? '#28a745' : score >= 40 ? '#ffc107' : '#dc3545';

  return (
    <div className="module">
      <div className="module-header">
        <div className="module-title">{icon} {title}</div>
        <span className={`module-badge ${badge.className}`}>{badge.text}</span>
      </div>

      {/* Score progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
          <span>Confidence</span>
          <span style={{ fontWeight: '600', color: barColor }}>{score}/100</span>
        </div>
        <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${score}%`,
              height: '100%',
              background: barColor,
              borderRadius: '4px',
              transition: 'width 0.8s ease-out',
            }}
          />
        </div>
      </div>

      {/* Detail checks */}
      <div className="module-content">
        <ul className="detail-list">
          {Object.entries(details).map(([key, value]) => (
            <li key={key}>
              <strong>{formatKey(key)}:</strong> {value}
            </li>
          ))}
        </ul>
      </div>

      {/* Raw metrics toggle — useful for technical interviewers */}
      {rawMetrics && (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{
              background: 'none', border: 'none', color: '#667eea',
              fontSize: '12px', cursor: 'pointer', padding: '0',
            }}
          >
            {showRaw ? '▲ Hide' : '▼ Show'} raw metrics
          </button>
          {showRaw && (
            <div style={{
              marginTop: '8px', background: '#f8f9fa', borderRadius: '6px',
              padding: '10px', fontSize: '12px', fontFamily: 'monospace', color: '#555',
            }}>
              {Object.entries(rawMetrics).map(([k, v]) => (
                <div key={k}><strong>{k}:</strong> {String(v)}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// camelCase → "Camel Case"
const formatKey = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

export default ModuleCard;
