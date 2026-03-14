# 🛡️ AI Disaster Image Authentication System

> Multi-modal AI forensics pipeline to detect fake or AI-generated disaster images.

**Live Demo:** [karuneesh321.github.io/AI_Fake_Image_Detector](https://karuneesh321.github.io/AI_Fake_Image_Detector/)

[![CI — Test & Deploy](https://github.com/Karuneesh321/AI_Fake_Image_Detector/actions/workflows/deploy.yml/badge.svg)](https://github.com/Karuneesh321/AI_Fake_Image_Detector/actions)

---

## What it does

Disaster images shared on social media are frequently fake or AI-generated, causing public panic and misdirected emergency response. This tool analyses any uploaded image through **4 independent forensic modules** and produces an **Authenticity Score (0–100)**.

---

## Architecture — 4 Analysis Modules

| Module | Technique | Signal |
|---|---|---|
| 🔬 Visual Forensics | Edge variance, noise std-dev, channel correlation | AI images are over-smoothed |
| 📋 Metadata Analysis | Real EXIF parsing via `exifr` | AI images lack camera signatures |
| ⚛️ Physics Reasoning | Lighting gradient, colour temperature, highlight clipping | AI images violate physics |
| 🌍 Contextual Consistency | Aspect ratio, hue diversity, tonal range | AI images have unnatural composition |

**Weighted score:** Visual (35%) + Metadata (25%) + Physics (25%) + Context (15%)

---

## Project Structure

```
src/
├── modules/
│   ├── visualForensics.js        # Pixel-level artifact detection
│   ├── metadataAnalysis.js       # Real EXIF parsing (exifr)
│   ├── physicsReasoning.js       # Lighting & colour physics
│   └── contextualConsistency.js  # Composition & tonal analysis
├── components/
│   ├── UploadZone.jsx            # Drag-and-drop file input
│   ├── ModuleCard.jsx            # Per-module result card with progress bar
│   ├── ResultsPanel.jsx          # Full results view + JSON export
│   └── AnalysisProgress.jsx      # Step-by-step progress indicator
├── hooks/
│   └── useImageAnalysis.js       # Orchestration hook (all modules)
├── utils/
│   └── scoreUtils.js             # Score calculation & verdict logic
├── tests/
│   └── analysisModules.test.js   # Unit tests (Vitest)
└── App.jsx                       # Entry point — orchestration only
```

---

## Tech Stack

- **React 19** + **Vite** — frontend framework
- **exifr** — browser-native EXIF metadata extraction
- **Vitest** — unit testing framework
- **GitHub Actions** — CI/CD: runs tests then auto-deploys to GitHub Pages
- **Tailwind CSS** — styling

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/Karuneesh321/AI_Fake_Image_Detector.git
cd AI_Fake_Image_Detector

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev

# 4. Run tests
npm test

# 5. Build for production
npm run build
```

---

## CI/CD Pipeline

Every push to `main`:
1. GitHub Actions installs dependencies
2. Runs all unit tests — **deploy is blocked if tests fail**
3. Builds the production bundle
4. Deploys to GitHub Pages automatically

---

## How Scoring Works

```
Score ≥ 70  →  ✅ LIKELY AUTHENTIC
Score 40–69 →  ⚠️  SUSPICIOUS — needs verification
Score < 40  →  ❌ LIKELY FAKE / AI-GENERATED
```

Each module returns a 0–100 confidence score with detailed sub-checks and raw metrics (viewable via "Show raw metrics" in each module card).

---

## Author

**Karunesh Pandey** — B.Tech CS & Business Systems, Jain University (CGPA: 8.86)

- 🏆 SIH Top 10 Finalist (300+ teams)
- 📄 Indian Patent Filed — AI Healthcare (App No: 202541017633)
- 🔗 [LinkedIn](https://linkedin.com) | [GitHub](https://github.com/Karuneesh321)
