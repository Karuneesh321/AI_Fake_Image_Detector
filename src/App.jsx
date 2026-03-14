/**
 * App.jsx — Orchestration only.
 * All analysis logic lives in src/modules/.
 * All UI components live in src/components/.
 * State management for analysis lives in src/hooks/useImageAnalysis.js.
 */

import { useState } from 'react';
import './App.css';
import UploadZone       from './components/UploadZone';
import ResultsPanel     from './components/ResultsPanel';
import AnalysisProgress from './components/AnalysisProgress';
import { useImageAnalysis } from './hooks/useImageAnalysis';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);

  const { analyze, isAnalyzing, results, error, progress, reset } = useImageAnalysis();

  const handleFileSelect = (file) => {
    reset();
    setCurrentFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    analyze(currentFile, previewUrl);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🛡️ AI Disaster Image Authentication System</h1>
        <p>Multi-Modal Generative AI Forensics for Emergency Image Verification</p>
      </header>

      <main className="main-content">
        <UploadZone
          onFileSelect={handleFileSelect}
          previewUrl={previewUrl}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />

        <section className="results-section" aria-label="Analysis results">
          {!previewUrl && !isAnalyzing && !results && (
            <div style={{ textAlign: 'center', color: '#999', padding: '100px 20px' }}>
              Upload an image to begin analysis...
            </div>
          )}

          {isAnalyzing && <AnalysisProgress progress={progress} />}

          {error && (
            <div style={{ color: '#dc3545', padding: '20px', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          )}

          {results && !isAnalyzing && <ResultsPanel results={results} />}
        </section>
      </main>
    </div>
  );
}

export default App;
