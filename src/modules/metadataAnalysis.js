/**
 * Metadata Analysis Module
 * Uses the `exifr` library to extract and validate real EXIF data.
 *
 * Tuning notes:
 * - Many real photos shared online have STRIPPED EXIF (WhatsApp, Twitter, etc.)
 * - Missing EXIF alone should NOT make an image fail — it's a weak signal
 * - AI software keywords are the strongest negative signal
 * - Start score at 55 (neutral) instead of 20 (penalising)
 */

export const analyzeMetadata = async (file) => {
  let exif = null;
  try {
    const exifr = await import('exifr');
    exif = await exifr.parse(file, {
      tiff: true, exif: true, gps: true, ifd0: true,
      pick: ['Make', 'Model', 'DateTimeOriginal', 'LensModel',
             'Software', 'ExposureTime', 'ISO', 'FNumber',
             'GPSLatitude', 'GPSLongitude']
    });
  } catch {
    exif = null;
  }

  // No EXIF at all — neutral score (many real photos lose EXIF on upload)
  if (!exif) {
    return {
      score: 55,
      details: {
        exifData:        'Not present — may have been stripped on upload',
        cameraModel:     'No camera signature (common for shared images)',
        editingSoftware: 'No AI editing detected',
        timestamp:       'No timestamp present',
      },
      rawMetrics: {
        hasExif: false, hasCamera: false,
        hasSoftware: false, hasTimestamp: false,
        hasAISoftware: false,
      }
    };
  }

  const hasCamera    = !!(exif.Make || exif.Model);
  const hasSoftware  = !!(exif.Software);
  const hasTimestamp = !!(exif.DateTimeOriginal);
  const hasGPS       = !!(exif.GPSLatitude);
  const hasExposure  = !!(exif.ExposureTime || exif.ISO || exif.FNumber);

  const aiKeywords = [
    'stable diffusion', 'midjourney', 'dall-e', 'dall·e',
    'adobe firefly', 'runway', 'bing image', 'generated',
    'neural', 'diffusion'
  ];
  const softwareName    = (exif.Software || '').toLowerCase();
  const hasAISoftware   = aiKeywords.some(kw => softwareName.includes(kw));

  // Start neutral at 55, add bonuses for real camera signals
  let score = 55;
  if (hasCamera)      score += 20;  // strongest positive signal
  if (hasTimestamp)   score += 10;
  if (hasExposure)    score += 10;
  if (hasGPS)         score +=  5;
  if (hasAISoftware)  score -= 50;  // strong penalty — near-certain AI

  score = Math.min(100, Math.max(0, score));

  return {
    score,
    details: {
      exifData:        hasCamera   ? 'Present and consistent'                     : 'Present but no camera info',
      cameraModel:     exif.Model  ? `${exif.Make || ''} ${exif.Model}`.trim()    : 'No camera signature found',
      editingSoftware: hasAISoftware
        ? `⚠️ AI software detected: ${exif.Software}`
        : hasSoftware ? `${exif.Software} (no AI flags)` : 'No AI editing detected',
      timestamp: hasTimestamp
        ? `Found: ${new Date(exif.DateTimeOriginal).toLocaleDateString()}`
        : 'No timestamp present',
    },
    rawMetrics: {
      hasCamera, hasSoftware, hasTimestamp,
      hasGPS, hasExposure, hasAISoftware,
    }
  };
};
