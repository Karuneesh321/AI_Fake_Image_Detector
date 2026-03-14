/**
 * Metadata Analysis Module
 * Uses the `exifr` library to extract and validate real EXIF data from the image file.
 *
 * Real photos contain:
 *  - Camera make/model
 *  - GPS coordinates (optionally)
 *  - DateTimeOriginal (when the photo was actually taken)
 *  - Lens information
 *  - ISO, aperture, shutter speed
 *
 * AI-generated images:
 *  - Typically have NO EXIF data at all
 *  - Or only have basic software metadata (e.g. "GIMP", "Stable Diffusion")
 *  - No camera hardware info
 */

export const analyzeMetadata = async (file) => {
  // Dynamically import exifr only when needed (code splitting)
  let exif = null;
  try {
    const exifr = await import('exifr');
    exif = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      ifd0: true,
      pick: ['Make', 'Model', 'DateTimeOriginal', 'LensModel', 'Software',
             'ExposureTime', 'ISO', 'FNumber', 'GPSLatitude', 'GPSLongitude']
    });
  } catch {
    // exifr not installed or parse failed — treat as no metadata
    exif = null;
  }

  if (!exif) {
    return {
      score: 20,
      details: {
        exifData: 'Missing — no metadata found',
        cameraModel: 'No camera signature found',
        editingSoftware: 'Unknown — suspicious absence of data',
        timestamp: 'No timestamp present',
      },
      rawMetrics: { hasExif: false, hasCamera: false, hasSoftware: false, hasTimestamp: false }
    };
  }

  const hasCamera   = !!(exif.Make || exif.Model);
  const hasSoftware = !!(exif.Software);
  const hasTimestamp= !!(exif.DateTimeOriginal);
  const hasGPS      = !!(exif.GPSLatitude);
  const hasExposure = !!(exif.ExposureTime || exif.ISO || exif.FNumber);

  // AI editing software red flags
  const aiSoftwareKeywords = ['stable diffusion', 'midjourney', 'dall-e', 'adobe firefly',
                               'runway', 'neural', 'ai', 'generated'];
  const softwareName = (exif.Software || '').toLowerCase();
  const hasAISoftware = aiSoftwareKeywords.some(kw => softwareName.includes(kw));

  // Score: start at 30, add points for real camera signals
  let score = 30;
  if (hasCamera)    score += 25;
  if (hasTimestamp) score += 20;
  if (hasExposure)  score += 15;
  if (hasGPS)       score += 10;
  if (hasAISoftware) score -= 40; // strong penalty for AI software

  score = Math.min(100, Math.max(0, score));

  return {
    score,
    details: {
      exifData: hasCamera ? 'Present and consistent' : 'Missing or suspicious',
      cameraModel: exif.Model ? `${exif.Make || ''} ${exif.Model}`.trim() : 'No camera signature found',
      editingSoftware: hasAISoftware
        ? `AI editing detected: ${exif.Software}`
        : hasSoftware ? `${exif.Software} (no AI flags)` : 'No AI editing detected',
      timestamp: hasTimestamp
        ? `Found: ${new Date(exif.DateTimeOriginal).toLocaleDateString()}`
        : 'Timestamp anomalies detected',
    },
    rawMetrics: { hasCamera, hasSoftware, hasTimestamp, hasGPS, hasExposure, hasAISoftware }
  };
};
