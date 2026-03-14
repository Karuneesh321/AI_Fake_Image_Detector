/**
 * AnalysisProgress.jsx
 * Shows a step-by-step progress indicator while analysis runs.
 * Progress value (0-100) drives which steps appear active.
 */

const STEPS = [
  { at: 10,  label: 'Loading image pixels...'        },
  { at: 35,  label: 'Running visual forensics...'    },
  { at: 60,  label: 'Parsing EXIF metadata...'       },
  { at: 80,  label: 'Physics reasoning engine...'    },
  { at: 95,  label: 'Contextual consistency check...' },
  { at: 100, label: 'Generating report...'           },
];

const AnalysisProgress = ({ progress }) => {
  return (
    <div className="loading">
      <div className="spinner" role="status" aria-label="Analyzing" />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '6px' }}>
          <span>Analysis progress</span>
          <span>{progress}%</span>
        </div>
        <div style={{ background: '#f0f0f0', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              borderRadius: '6px',
              transition: 'width 0.4s ease-out',
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: 'left', maxWidth: '280px', margin: '0 auto' }}>
        {STEPS.map((step) => {
          const done    = progress >= step.at;
          const active  = progress >= step.at - 25 && progress < step.at;
          return (
            <div
              key={step.at}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '4px 0', fontSize: '13px',
                color: done ? '#28a745' : active ? '#667eea' : '#bbb',
                fontWeight: done || active ? '500' : '400',
              }}
            >
              <span style={{ fontSize: '14px' }}>
                {done ? '✅' : active ? '⏳' : '○'}
              </span>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisProgress;
