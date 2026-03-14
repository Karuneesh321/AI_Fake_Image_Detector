/**
 * UploadZone.jsx
 * Handles file upload via click and drag-and-drop.
 * Validates file type and size before passing up to parent.
 */

import { useState } from 'react';

const UploadZone = ({ onFileSelect, previewUrl, onAnalyze, isAnalyzing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError]   = useState(null);

  const handleFile = (file) => {
    setFileError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10MB.');
      return;
    }
    onFileSelect(file);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = ()  => setIsDragging(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };
  const handleInput = (e) => handleFile(e.target.files[0]);

  return (
    <div className="upload-section">
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Upload Disaster Image</h2>

      <div
        className={`drop-zone ${isDragging ? 'active' : ''}`}
        onClick={() => document.getElementById('fileInput').click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload image"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('fileInput').click()}
      >
        <div className="upload-icon">📸</div>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p style={{ fontSize: '14px', color: '#999' }}>JPEG, PNG (Max 10MB)</p>
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInput}
        />
      </div>

      {fileError && (
        <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '8px' }}>{fileError}</p>
      )}

      {previewUrl && (
        <div className="preview-container">
          <img src={previewUrl} className="preview-image" alt="Preview of uploaded image" />
          <button
            className="analyze-btn"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            aria-label="Start image analysis"
          >
            {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Image'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
