// fieldAnalysis.js - Helper functions for agricultural image analysis

/**
 * Color thresholds and constants for agricultural analysis
 */
export const ANALYSIS_CONSTANTS = {
  // Color thresholds
  VEGETATION_GREEN_MIN: 100,
  VEGETATION_RATIO_THRESHOLD: 1.1,
  BARE_SOIL_RED_MIN: 80,
  BARE_SOIL_RED_MAX: 200,
  WATER_BLUE_THRESHOLD: 120,
  DISEASE_YELLOW_THRESHOLD: 150,

  // Analysis parameters
  SAMPLE_RATE: 10, // Analyze every 10th pixel for performance
  NDVI_NORMALIZATION: 255,
  HEALTH_THRESHOLDS: {
    GOOD: 0.6,
    FAIR: 0.3,
    POOR: 0,
  },

  // Zone analysis
  GRID_SIZE: 8, // Divide image into 8x8 grid for zone analysis
};

/**
 * Extract pixel data from canvas and prepare for analysis
 * @param {HTMLCanvasElement} canvas - Canvas containing the image
 * @returns {Object} Processed pixel data and metadata
 */
export function extractPixelData(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const totalPixels = data.length / 4;
  const sampledPixels = Math.floor(
    totalPixels / ANALYSIS_CONSTANTS.SAMPLE_RATE
  );

  return {
    data,
    totalPixels,
    sampledPixels,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Calculate NDVI (Normalized Difference Vegetation Index) approximation
 * Uses visible light spectrum: (Green - Red) / (Green + Red)
 * @param {number} red - Red channel value (0-255)
 * @param {number} green - Green channel value (0-255)
 * @returns {number} NDVI value (-1 to 1, normalized to 0-1)
 */
export function calculateNDVI(red, green) {
  if (green + red === 0) return 0;
  const ndvi = (green - red) / (green + red);
  // Normalize from [-1, 1] to [0, 1]
  return Math.max(0, (ndvi + 1) / 2);
}

/**
 * Detect vegetation pixels based on color characteristics
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @returns {boolean} True if pixel represents vegetation
 */
export function isVegetationPixel(r, g, b) {
  return (
    g > r * ANALYSIS_CONSTANTS.VEGETATION_RATIO_THRESHOLD &&
    g > b &&
    g > ANALYSIS_CONSTANTS.VEGETATION_GREEN_MIN
  );
}

/**
 * Detect bare soil pixels based on color characteristics
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @returns {boolean} True if pixel represents bare soil
 */
export function isBareEarthPixel(r, g, b) {
  return (
    r > g &&
    r > b &&
    r >= ANALYSIS_CONSTANTS.BARE_SOIL_RED_MIN &&
    r <= ANALYSIS_CONSTANTS.BARE_SOIL_RED_MAX &&
    Math.abs(r - g) > 20 // Ensure it's not grayish
  );
}

/**
 * Detect water/moisture areas
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @returns {boolean} True if pixel represents water/moisture
 */
export function isWaterPixel(r, g, b) {
  return (
    b > r &&
    b > g &&
    b > ANALYSIS_CONSTANTS.WATER_BLUE_THRESHOLD &&
    r + g + b < 400 // Generally darker
  );
}

/**
 * Detect potential disease/stress indicators (yellowing, browning)
 * @param {number} r - Red value
 * @param {number} g - Green value
 * @param {number} b - Blue value
 * @returns {boolean} True if pixel shows signs of stress/disease
 */
export function isDiseasePixel(r, g, b) {
  // Yellow stress indicators
  const isYellowing =
    r > ANALYSIS_CONSTANTS.DISEASE_YELLOW_THRESHOLD &&
    g > ANALYSIS_CONSTANTS.DISEASE_YELLOW_THRESHOLD &&
    b < 100 &&
    Math.abs(r - g) < 30;

  // Brown/dead vegetation
  const isBrowning =
    r > 100 && r < 180 && g > 60 && g < 120 && b < 80 && r > g && g > b;

  return isYellowing || isBrowning;
}

/**
 * Analyze color distribution and calculate averages
 * @param {Uint8ClampedArray} data - Image pixel data
 * @param {number} sampleRate - Rate at which to sample pixels
 * @returns {Object} Color analysis results
 */
export function analyzeColorDistribution(
  data,
  sampleRate = ANALYSIS_CONSTANTS.SAMPLE_RATE
) {
  let redSum = 0,
    greenSum = 0,
    blueSum = 0;
  let brightnessSum = 0,
    saturationSum = 0;
  let vegetationCount = 0,
    bareEarthCount = 0,
    waterCount = 0,
    diseaseCount = 0;
  let sampledCount = 0;

  const step = sampleRate * 4; // 4 bytes per pixel (RGBA)

  for (let i = 0; i < data.length; i += step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    redSum += r;
    greenSum += g;
    blueSum += b;

    const brightness = (r + g + b) / 3;
    brightnessSum += brightness;

    // Calculate saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    saturationSum += saturation;

    // Classify pixel types
    if (isVegetationPixel(r, g, b)) vegetationCount++;
    if (isBareEarthPixel(r, g, b)) bareEarthCount++;
    if (isWaterPixel(r, g, b)) waterCount++;
    if (isDiseasePixel(r, g, b)) diseaseCount++;

    sampledCount++;
  }

  return {
    averages: {
      red: redSum / sampledCount,
      green: greenSum / sampledCount,
      blue: blueSum / sampledCount,
      brightness: brightnessSum / sampledCount,
      saturation: saturationSum / sampledCount,
    },
    counts: {
      vegetation: vegetationCount,
      bareEarth: bareEarthCount,
      water: waterCount,
      disease: diseaseCount,
      total: sampledCount,
    },
    percentages: {
      vegetation: (vegetationCount / sampledCount) * 100,
      bareEarth: (bareEarthCount / sampledCount) * 100,
      water: (waterCount / sampledCount) * 100,
      disease: (diseaseCount / sampledCount) * 100,
    },
  };
}

/**
 * Calculate comprehensive field metrics
 * @param {Object} colorAnalysis - Results from analyzeColorDistribution
 * @returns {Object} Calculated field metrics
 */
export function calculateFieldMetrics(colorAnalysis) {
  const { averages, percentages } = colorAnalysis;

  // NDVI calculation
  const ndvi = calculateNDVI(averages.red, averages.green);

  // Water stress indicator (higher values = more stress)
  const waterStress = Math.min(
    1,
    (averages.red / 255) *
      (averages.brightness / 255) *
      (1 - percentages.water / 100)
  );

  // Soil health (based on bare earth percentage and color diversity)
  const soilHealth = Math.min(
    1,
    (percentages.bareEarth / 100) *
      averages.saturation *
      (1 - percentages.disease / 100)
  );

  // Crop density (vegetation coverage adjusted for quality)
  const cropDensity = Math.min(
    1,
    (percentages.vegetation / 50) * (1 - percentages.disease / 100)
  );

  // Overall health index
  const healthIndex = (ndvi + cropDensity + (1 - waterStress) + soilHealth) / 4;

  // Disease pressure
  const diseasePressure = percentages.disease / 100;

  return {
    ndvi: Math.round(ndvi * 100) / 100,
    waterStress: Math.round(waterStress * 100) / 100,
    soilHealth: Math.round(soilHealth * 100) / 100,
    cropDensity: Math.round(cropDensity * 100) / 100,
    healthIndex: Math.round(healthIndex * 100) / 100,
    diseasePressure: Math.round(diseasePressure * 100) / 100,
    vegetationCoverage: Math.round(percentages.vegetation),
    waterContent: Math.round(percentages.water * 10) / 10,
  };
}

/**
 * Analyze field zones by dividing image into grid
 * @param {Uint8ClampedArray} data - Image pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} gridSize - Size of analysis grid (e.g., 8 for 8x8)
 * @returns {Array} Array of zone analysis results
 */
export function analyzeFieldZones(
  data,
  width,
  height,
  gridSize = ANALYSIS_CONSTANTS.GRID_SIZE
) {
  const zones = [];
  const zoneWidth = Math.floor(width / gridSize);
  const zoneHeight = Math.floor(height / gridSize);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const startX = col * zoneWidth;
      const startY = row * zoneHeight;
      const endX = Math.min((col + 1) * zoneWidth, width);
      const endY = Math.min((row + 1) * zoneHeight, height);

      let zoneVegetation = 0;
      let zoneDisease = 0;
      let zonePixels = 0;
      let redSum = 0,
        greenSum = 0,
        blueSum = 0;

      for (let y = startY; y < endY; y += 2) {
        // Sample every other row for performance
        for (let x = startX; x < endX; x += 2) {
          // Sample every other column
          const pixelIndex = (y * width + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];

          redSum += r;
          greenSum += g;
          blueSum += b;

          if (isVegetationPixel(r, g, b)) zoneVegetation++;
          if (isDiseasePixel(r, g, b)) zoneDisease++;

          zonePixels++;
        }
      }

      const avgRed = redSum / zonePixels;
      const avgGreen = greenSum / zonePixels;
      const zoneNDVI = calculateNDVI(avgRed, avgGreen);
      const vegetationPercent = (zoneVegetation / zonePixels) * 100;
      const diseasePercent = (zoneDisease / zonePixels) * 100;

      zones.push({
        row,
        col,
        bounds: { startX, startY, endX, endY },
        ndvi: Math.round(zoneNDVI * 100) / 100,
        vegetationPercent: Math.round(vegetationPercent),
        diseasePercent: Math.round(diseasePercent * 10) / 10,
        healthScore:
          Math.round(zoneNDVI * (1 - diseasePercent / 100) * 100) / 100,
      });
    }
  }

  return zones;
}

/**
 * Generate AI recommendations based on analysis results
 * @param {Object} metrics - Field metrics from calculateFieldMetrics
 * @param {Array} zones - Zone analysis from analyzeFieldZones
 * @returns {Array} Array of recommendation objects
 */
export function generateRecommendations(metrics, zones = []) {
  const recommendations = [];
  const { GOOD, FAIR } = ANALYSIS_CONSTANTS.HEALTH_THRESHOLDS;

  // NDVI-based recommendations
  if (metrics.ndvi < FAIR) {
    recommendations.push({
      type: "critical",
      category: "vegetation",
      message:
        "Critically low vegetation index detected. Immediate soil testing and fertilization recommended.",
      priority: 1,
    });
  } else if (metrics.ndvi < GOOD) {
    recommendations.push({
      type: "warning",
      category: "vegetation",
      message:
        "Below-optimal vegetation health. Consider nitrogen application and irrigation review.",
      priority: 2,
    });
  }

  // Water stress recommendations
  if (metrics.waterStress > 0.7) {
    recommendations.push({
      type: "critical",
      category: "irrigation",
      message:
        "High water stress detected. Increase irrigation frequency and check system efficiency.",
      priority: 1,
    });
  } else if (metrics.waterStress > 0.4) {
    recommendations.push({
      type: "warning",
      category: "irrigation",
      message:
        "Moderate water stress. Monitor soil moisture and adjust irrigation schedule.",
      priority: 2,
    });
  }

  // Disease pressure recommendations
  if (metrics.diseasePressure > 0.1) {
    recommendations.push({
      type: "warning",
      category: "disease",
      message:
        "Disease symptoms detected. Consider fungicide application and scout affected areas.",
      priority: 1,
    });
  }

  // Soil health recommendations
  if (metrics.soilHealth < FAIR) {
    recommendations.push({
      type: "info",
      category: "soil",
      message:
        "Soil health indicators suggest organic matter deficiency. Apply compost or cover crops.",
      priority: 3,
    });
  }

  // Crop density recommendations
  if (metrics.cropDensity < FAIR) {
    recommendations.push({
      type: "warning",
      category: "planting",
      message:
        "Low crop density detected. Investigate stand establishment and consider replanting.",
      priority: 2,
    });
  }

  // Zone-specific recommendations
  if (zones.length > 0) {
    const problematicZones = zones.filter(
      (zone) => zone.healthScore < FAIR || zone.diseasePercent > 10
    );

    if (problematicZones.length > 0) {
      recommendations.push({
        type: "info",
        category: "management",
        message: `${problematicZones.length} zones require attention. Consider variable rate application.`,
        priority: 2,
        zones: problematicZones.map(
          (z) => `Row ${z.row + 1}, Col ${z.col + 1}`
        ),
      });
    }
  }

  // Overall health recommendations
  if (metrics.healthIndex > 0.8) {
    recommendations.push({
      type: "success",
      category: "general",
      message:
        "Excellent field conditions. Continue current management practices.",
      priority: 4,
    });
  } else if (recommendations.length === 0) {
    recommendations.push({
      type: "info",
      category: "general",
      message:
        "Field conditions appear stable. Regular monitoring recommended.",
      priority: 3,
    });
  }

  // Sort by priority (lower number = higher priority)
  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * Get status information for a metric value
 * @param {number} value - Metric value (0-1)
 * @param {boolean} isInverse - Whether lower values are better
 * @returns {Object} Status object with color and text
 */
export function getMetricStatus(value, isInverse = false) {
  const { GOOD, FAIR } = ANALYSIS_CONSTANTS.HEALTH_THRESHOLDS;

  let status, color;

  if (isInverse) {
    if (value <= FAIR) {
      status = "good";
      color = "#2e7d32";
    } else if (value <= GOOD) {
      status = "fair";
      color = "#f57c00";
    } else {
      status = "poor";
      color = "#d32f2f";
    }
  } else {
    if (value >= GOOD) {
      status = "good";
      color = "#2e7d32";
    } else if (value >= FAIR) {
      status = "fair";
      color = "#f57c00";
    } else {
      status = "poor";
      color = "#d32f2f";
    }
  }

  return { status, color };
}

/**
 * Main analysis function that processes an image canvas
 * @param {HTMLCanvasElement} canvas - Canvas containing the field image
 * @returns {Object} Complete analysis results
 */
export function analyzeFieldImage(canvas) {
  const pixelData = extractPixelData(canvas);
  const colorAnalysis = analyzeColorDistribution(pixelData.data);
  const metrics = calculateFieldMetrics(colorAnalysis);
  const zones = analyzeFieldZones(
    pixelData.data,
    pixelData.width,
    pixelData.height
  );
  const recommendations = generateRecommendations(metrics, zones);

  return {
    metrics,
    zones,
    recommendations,
    colorAnalysis,
    metadata: {
      imageWidth: pixelData.width,
      imageHeight: pixelData.height,
      analyzedPixels: pixelData.sampledPixels,
      analysisDate: new Date().toISOString(),
    },
  };
}
