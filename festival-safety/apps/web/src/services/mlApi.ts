/**
 * ML API Client
 * Helper functions to call ML analysis endpoints
 */

export interface MLAnalysisResponse {
  success: boolean;
  crowdCount: number;
  predictions: any[];
  confidence: number;
}

export interface VideoAnalysisResponse {
  frameCount: number;
  detections: Array<{
    frame: number;
    timestamp: number;
    crowdCount: number;
    detections: any[];
  }>;
  summary: {
    maxCrowd: number;
    avgCrowd: number;
    minCrowd: number;
  };
}

const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:1573";

/**
 * Analyze a video URL for crowd detection
 * Uses Firebase Cloud Function
 */
export async function analyzeVideoWithML(videoUrl: string) {
  try {
    // Call Firebase function directly
    const response = await fetch("/.netlify/functions/analyzeVideoDemo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Analysis failed");
    }

    return (await response.json()) as VideoAnalysisResponse;
  } catch (error) {
    console.error("ML API Error:", error);
    throw error;
  }
}

/**
 * Analyze a single image for crowd detection (by URL)
 */
export async function analyzeImageWithML(imageUrl: string) {
  try {
    const response = await fetch(`${API_BASE}/api/ml/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Analysis failed");
    }

    return (await response.json()) as MLAnalysisResponse;
  } catch (error) {
    console.error("ML API Error:", error);
    throw error;
  }
}

/** Bounding box from Roboflow (pixel coords). Supports xyxy array or x_min/y_min/x_max/y_max or center x,y,width,height */
export interface DetectionBox {
  x_min?: number;
  y_min?: number;
  x_max?: number;
  y_max?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  /** Roboflow format: [x_min, y_min, x_max, y_max] */
  xyxy?: [number, number, number, number];
  [key: string]: unknown;
}

export interface LiveFrameAnalysisResponse {
  success: boolean;
  crowdCount: number;
  predictions: DetectionBox[];
  confidence: number;
  image_width?: number;
  image_height?: number;
}

/**
 * Analyze a single frame (base64) for live camera crowd detection.
 * Uses Roboflow model; returns count and bounding boxes for drawing.
 */
export async function analyzeFrameWithML(imageBase64: string): Promise<LiveFrameAnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/ml/analyze-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Analysis failed");
    }

    const data = await response.json();
    return {
      success: data.success,
      crowdCount: data.crowdCount ?? (data.predictions?.length ?? 0),
      predictions: data.predictions ?? [],
      confidence: data.confidence ?? 0.15,
      image_width: data.image_width,
      image_height: data.image_height,
    };
  } catch (error) {
    console.error("ML frame analysis error:", error);
    throw error;
  }
}

/**
 * Get ML analysis status/health check
 */
export async function checkMLStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/ml/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Demo function: Get mock crowd detection data
 * Useful for testing without actual ML processing
 */
export function getMockDetectionData(videoUrl: string) {
  return {
    frameCount: 5,
    detections: [
      { frame: 0, timestamp: 0, crowdCount: 23, detections: [] },
      { frame: 1, timestamp: 2, crowdCount: 28, detections: [] },
      { frame: 2, timestamp: 4, crowdCount: 35, detections: [] },
      { frame: 3, timestamp: 6, crowdCount: 32, detections: [] },
      { frame: 4, timestamp: 8, crowdCount: 41, detections: [] },
    ],
    summary: {
      maxCrowd: 41,
      avgCrowd: 32,
      minCrowd: 23,
    },
  };
}
