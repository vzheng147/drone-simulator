// cropAnalysisUtils.ts
// Utility functions for analyzing crop field images – fully migrated to TypeScript
/* eslint-disable @typescript-eslint/no-explicit-any */

// ────────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ────────────────────────────────────────────────────────────────────────────────
export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
  id?: string;
  label?: string;
  position?: { row: number; col: number };
}

export interface AnalysisMetrics {
  pseudoNDVI: number;
  vegetationCoverage: number;
  healthRatio: number;
  stressRatio: number;
  waterStressIndex: number;
  nitrogenLevel: number;
  avgColors: {
    red: number;
    green: number;
    blue: number;
  };
  pixelCounts: {
    total: number;
    vegetation: number;
    healthy: number;
    stressed: number;
    waterStressed: number;
    nitrogenDeficit: number;
  };
}

export interface ZoneWithMetrics extends Zone {
  metrics: AnalysisMetrics;
}

export interface Recommendation {
  type: "critical" | "warning" | "info" | "action";
  category: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  actions: string[];
  zones?: string[]; // optional list of zone ids for zone‑specific recs
}

export interface FieldStatus {
  level: "good" | "warning" | "critical";
  needsAttention: boolean;
  issues: string[];
  summary: string;
}

export interface AnalyzeOptions {
  gridSize?: number;
  includeZones?: boolean;
}

export interface AnalysisResult {
  timestamp: string;
  overall: AnalysisMetrics;
  zones: ZoneWithMetrics[];
  bestZone: ZoneWithMetrics | null;
  worstZone: ZoneWithMetrics | null;
  recommendations: Recommendation[];
  status: FieldStatus;
  imageInfo: {
    width: number;
    height: number;
    totalPixels: number;
  };
  imageUrl?: string; // added in processImageFile
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    lastModified: Date;
  };
}

export interface Thresholds {
  good: number;
  warning: number;
}

export interface Trend {
  status: "good" | "warning" | "critical";
  direction: "up" | "down" | "stable";
}

// ────────────────────────────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────────
export const calculateVegetationIndices = (
  imageData: ImageData,
  width: number,
  height: number,
  zone: Zone | null = null
): AnalysisMetrics => {
  const { data } = imageData;
  let startX = 0,
    startY = 0,
    endX = width,
    endY = height;

  if (zone) {
    startX = Math.floor(zone.x * width);
    startY = Math.floor(zone.y * height);
    endX = Math.floor((zone.x + zone.width) * width);
    endY = Math.floor((zone.y + zone.height) * height);
  }

  // running sums / counters
  let totalPixels = 0;
  let vegetationPixels = 0;
  let totalRed = 0;
  let totalGreen = 0;
  let totalBlue = 0;
  let healthyPixels = 0;
  let stressedPixels = 0;
  let waterStressPixels = 0;
  let nitrogenDeficitPixels = 0;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      totalPixels++;
      totalRed += r;
      totalGreen += g;
      totalBlue += b;

      const isVegetation = g > r && g > b && g > 50;
      if (isVegetation) {
        vegetationPixels++;

        const greenRatio = g / (r + g + b + 1);
        const vigor = (g - r) / (g + r + 1);
        const yellowness = (r + g) / (2 * b + 1);
        const paleness = (r + b) / (2 * g + 1);

        if (yellowness > 1.5 && greenRatio < 0.4) waterStressPixels++;
        if (paleness > 0.8 && g < 120) nitrogenDeficitPixels++;

        if (greenRatio > 0.4 && vigor > 0.2) healthyPixels++;
        else stressedPixels++;
      }
    }
  }

  const avgRed = totalRed / totalPixels;
  const avgGreen = totalGreen / totalPixels;
  const avgBlue = totalBlue / totalPixels;

  const pseudoNDVI = (avgGreen - avgRed) / (avgGreen + avgRed + 1);
  const vegetationCoverage = (vegetationPixels / totalPixels) * 100;
  const healthRatio =
    vegetationPixels > 0 ? (healthyPixels / vegetationPixels) * 100 : 0;
  const stressRatio =
    vegetationPixels > 0 ? (stressedPixels / vegetationPixels) * 100 : 0;
  const waterStressIndex =
    vegetationPixels > 0 ? waterStressPixels / vegetationPixels : 0;
  const nitrogenIndex =
    vegetationPixels > 0 ? 1 - nitrogenDeficitPixels / vegetationPixels : 1;

  return {
    pseudoNDVI: Number(pseudoNDVI.toFixed(3)),
    vegetationCoverage: Number(vegetationCoverage.toFixed(1)),
    healthRatio: Number(healthRatio.toFixed(1)),
    stressRatio: Number(stressRatio.toFixed(1)),
    waterStressIndex: Number(waterStressIndex.toFixed(3)),
    nitrogenLevel: Number(nitrogenIndex.toFixed(3)),
    avgColors: {
      red: Math.round(avgRed),
      green: Math.round(avgGreen),
      blue: Math.round(avgBlue),
    },
    pixelCounts: {
      total: totalPixels,
      vegetation: vegetationPixels,
      healthy: healthyPixels,
      stressed: stressedPixels,
      waterStressed: waterStressPixels,
      nitrogenDeficit: nitrogenDeficitPixels,
    },
  };
};

export const generateZoneAnalysis = (
  imageData: ImageData,
  width: number,
  height: number,
  gridSize = 3
): ZoneWithMetrics[] => {
  const zones: ZoneWithMetrics[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const zone: Zone = {
        id: `zone_${row}_${col}`,
        x: col / gridSize,
        y: row / gridSize,
        width: 1 / gridSize,
        height: 1 / gridSize,
        label: `Zone ${row + 1}-${col + 1}`,
        position: { row, col },
      };

      const zoneMetrics = calculateVegetationIndices(
        imageData,
        width,
        height,
        zone
      );
      zones.push({ ...zone, metrics: zoneMetrics });
    }
  }

  return zones;
};

export const determineFieldStatus = (metrics: AnalysisMetrics): FieldStatus => {
  const issues: string[] = [];
  let overallHealth: FieldStatus["level"] = "good";

  if (metrics.pseudoNDVI < 0.3) {
    issues.push("Low vegetation vigor");
    overallHealth = "critical";
  } else if (metrics.pseudoNDVI < 0.5) {
    issues.push("Moderate vegetation concerns");
    overallHealth = overallHealth === "good" ? "warning" : overallHealth;
  }

  if (metrics.waterStressIndex > 0.3) {
    issues.push("High water stress");
    overallHealth = "critical";
  } else if (metrics.waterStressIndex > 0.15) {
    issues.push("Water stress detected");
    overallHealth = overallHealth === "good" ? "warning" : overallHealth;
  }

  if (metrics.nitrogenLevel < 0.6) {
    issues.push("Nitrogen deficiency");
    overallHealth = overallHealth === "good" ? "warning" : overallHealth;
  }

  if (metrics.vegetationCoverage < 60) {
    issues.push("Low coverage");
    overallHealth = overallHealth === "good" ? "warning" : overallHealth;
  }

  return {
    level: overallHealth,
    needsAttention: overallHealth !== "good",
    issues,
    summary: issues.length ? issues.join(", ") : "Field appears healthy",
  };
};

export const generateRecommendations = (
  overall: AnalysisMetrics,
  zones: ZoneWithMetrics[] = []
): Recommendation[] => {
  const recs: Recommendation[] = [];

  // NDVI/Vegetation Health
  if (overall.pseudoNDVI < 0.3) {
    recs.push({
      type: "critical",
      category: "Vegetation Health",
      title: "Low Vegetation Vigor",
      message:
        "NDVI below optimal range. Consider immediate nutrient application or irrigation.",
      priority: "high",
      actions: ["Soil test", "Nutrient application", "Irrigation check"],
    });
  } else if (overall.pseudoNDVI < 0.5) {
    recs.push({
      type: "warning",
      category: "Vegetation Health",
      title: "Moderate Vegetation Vigor",
      message:
        "NDVI could be improved. Monitor closely and consider management interventions.",
      priority: "medium",
      actions: ["Monitor weekly", "Consider fertilization"],
    });
  }

  // Water Stress
  if (overall.waterStressIndex > 0.3) {
    recs.push({
      type: "critical",
      category: "Water Management",
      title: "High Water Stress Detected",
      message:
        "Significant water stress indicators present. Immediate irrigation recommended.",
      priority: "high",
      actions: [
        "Increase irrigation",
        "Check irrigation system",
        "Soil moisture test",
      ],
    });
  } else if (overall.waterStressIndex > 0.15) {
    recs.push({
      type: "warning",
      category: "Water Management",
      title: "Moderate Water Stress",
      message:
        "Some water stress detected. Monitor soil moisture and adjust irrigation.",
      priority: "medium",
      actions: ["Soil moisture monitoring", "Irrigation schedule review"],
    });
  }

  // Nitrogen Levels
  if (overall.nitrogenLevel < 0.6) {
    recs.push({
      type: "warning",
      category: "Nutrient Management",
      title: "Low Nitrogen Levels",
      message:
        "Nitrogen deficiency indicators detected. Consider nitrogen application.",
      priority: "medium",
      actions: [
        "Nitrogen fertilizer application",
        "Soil test",
        "Leaf tissue analysis",
      ],
    });
  }

  // Coverage Issues
  if (overall.vegetationCoverage < 60) {
    recs.push({
      type: "info",
      category: "Field Management",
      title: "Low Vegetation Coverage",
      message:
        "Consider replanting or investigating germination issues in sparse areas.",
      priority: "low",
      actions: ["Stand count", "Replanting evaluation", "Seed quality check"],
    });
  }

  // Zone‑specific recommendations
  if (zones.length) {
    const problemZones = zones.filter(
      (z) =>
        z.metrics.pseudoNDVI < 0.4 ||
        z.metrics.waterStressIndex > 0.2 ||
        z.metrics.nitrogenLevel < 0.7
    );

    if (problemZones.length) {
      recs.push({
        type: "action",
        category: "Precision Management",
        title: "Zone‑Specific Issues",
        message: `${
          problemZones.length
        } zones require targeted management. Focus on: ${problemZones
          .map((z) => z.label)
          .join(", ")}`,
        priority: "medium",
        actions: [
          "Variable rate application",
          "Targeted scouting",
          "Zone‑specific treatments",
        ],
        zones: problemZones.map((z) => z.id as string),
      });
    }
  }

  return recs;
};

export const analyzeFieldImage = async (
  imageElement: HTMLImageElement,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> => {
  const { gridSize = 3, includeZones = true } = options;

  return new Promise<AnalysisResult>((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      ctx.drawImage(imageElement, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const overallMetrics = calculateVegetationIndices(
        imageData,
        canvas.width,
        canvas.height
      );

      let zones: ZoneWithMetrics[] = [];
      let bestZone: ZoneWithMetrics | null = null;
      let worstZone: ZoneWithMetrics | null = null;

      if (includeZones) {
        zones = generateZoneAnalysis(
          imageData,
          canvas.width,
          canvas.height,
          gridSize
        );
        const sorted = [...zones].sort(
          (a, b) => b.metrics.pseudoNDVI - a.metrics.pseudoNDVI
        );
        bestZone = sorted[0];
        worstZone = sorted[sorted.length - 1];
      }

      const recommendations = generateRecommendations(overallMetrics, zones);
      const status = determineFieldStatus(overallMetrics);

      resolve({
        timestamp: new Date().toISOString(),
        overall: overallMetrics,
        zones,
        bestZone,
        worstZone,
        recommendations,
        status,
        imageInfo: {
          width: canvas.width,
          height: canvas.height,
          totalPixels: canvas.width * canvas.height,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const processImageFile = (
  file: File,
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> => {
  return new Promise<AnalysisResult>((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Invalid file type. Please upload an image."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const analysis = await analyzeFieldImage(img, options);
          resolve({
            ...analysis,
            imageUrl: e.target?.result as string,
            fileInfo: {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: new Date(file.lastModified),
            },
          });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export const exportAnalysisToJSON = (
  analysis: AnalysisResult,
  filename?: string
): void => {
  const exportData = {
    timestamp: analysis.timestamp,
    overall_metrics: analysis.overall,
    field_status: analysis.status,
    zone_analysis: analysis.zones?.map((z) => ({
      zone: z.label,
      position: z.position,
      metrics: z.metrics,
    })),
    recommendations: analysis.recommendations,
    image_info: analysis.imageInfo,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename || `field_analysis_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatMetricValue = (
  value: number,
  type: "ndvi" | "percentage" | "index" | "number" = "number"
): string => {
  switch (type) {
    case "ndvi":
      return value.toFixed(2);
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "index":
      return value.toFixed(3);
    default:
      return value.toFixed(2);
  }
};

export const getTrendIndicator = (
  value: number,
  thresholds: Thresholds,
  higherIsBetter = true
): Trend => {
  const { good, warning } = thresholds;

  let status: Trend["status"];
  let direction: Trend["direction"];

  if (higherIsBetter) {
    if (value >= good) {
      status = "good";
      direction = "stable";
    } else if (value >= warning) {
      status = "warning";
      direction = "down";
    } else {
      status = "critical";
      direction = "down";
    }
  } else {
    if (value <= good) {
      status = "good";
      direction = "stable";
    } else if (value <= warning) {
      status = "warning";
      direction = "up";
    } else {
      status = "critical";
      direction = "up";
    }
  }

  return { status, direction };
};
