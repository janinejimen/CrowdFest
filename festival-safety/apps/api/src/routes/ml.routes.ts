import axios from "axios";

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
// Your trained model. For single-person try ROBOFLOW_MODEL=people-fruua/people-dnvjm/1
const ROBOFLOW_MODEL =
  process.env.ROBOFLOW_MODEL || "crowd-counting-dataset-w3o7w/2";

export interface VideoAnalysisResult {
  success: boolean;
  videoUrl: string;
  frames: {
    frameNumber: number;
    timestamp: number;
    crowdCount: number;
  }[];
  summary: {
    totalFramesAnalyzed: number;
    maxCrowd: number;
    avgCrowd: number;
    minCrowd: number;
  };
}

/**
 * ML Routes Handler
 * POST /ml/analyze-video - Analyze a video URL for crowd detection
 * POST /ml/analyze-image - Analyze a single image for crowd detection
 */

export async function handleAnalyzeVideo(req: any, res: any) {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: "videoUrl required" });
    }

    // Demo analysis: simulate crowd detection from video
    const frames = [];
    for (let i = 0; i < 10; i++) {
      frames.push({
        frameNumber: i,
        timestamp: i * 2,
        crowdCount: Math.floor(Math.random() * 80 + 20),
      });
    }

    const crowdCounts = frames.map((f) => f.crowdCount);
    const result: VideoAnalysisResult = {
      success: true,
      videoUrl,
      frames,
      summary: {
        totalFramesAnalyzed: frames.length,
        maxCrowd: Math.max(...crowdCounts),
        avgCrowd: Math.round(
          crowdCounts.reduce((a, b) => a + b, 0) / crowdCounts.length
        ),
        minCrowd: Math.min(...crowdCounts),
      },
    };

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Video analysis error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleAnalyzeImage(req: any, res: any) {
  try {
    const { imageUrl, imageBase64 } = req.body;

    // Accept either image URL or base64 (e.g. from live camera canvas)
    const image =
      imageBase64 != null
        ? (typeof imageBase64 === "string" && imageBase64.startsWith("data:")
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`)
        : imageUrl;

    if (!image) {
      return res
        .status(400)
        .json({ error: "imageUrl or imageBase64 required" });
    }

    if (!ROBOFLOW_API_KEY) {
      return res.status(500).json({ error: "ROBOFLOW_API_KEY not configured" });
    }

    const confidence = 10; // low = more detections (default 40)
    const baseUrl = `https://detect.roboflow.com/${ROBOFLOW_MODEL}`;

    let response;
    if (image.startsWith("data:") || image.startsWith("/9j/") || !image.startsWith("http")) {
      const base64 = image.replace(/^data:image\/\w+;base64,/, "").trim();
      // Try JSON first (many Roboflow setups accept this); fallback to raw body
      // Try 1: JSON with full data URL (some Roboflow endpoints accept this)
      const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${base64}`;
      try {
        response = await axios.post(
          baseUrl,
          { image: dataUrl },
          {
            params: { api_key: ROBOFLOW_API_KEY, confidence },
            headers: { "Content-Type": "application/json" },
            timeout: 30000,
          }
        );
      } catch (jsonErr: any) {
        try {
          response = await axios.post(
            baseUrl,
            { image: base64 },
            {
              params: { api_key: ROBOFLOW_API_KEY, confidence },
              headers: { "Content-Type": "application/json" },
              timeout: 30000,
            }
          );
        } catch (jsonErr2: any) {
          try {
            response = await axios.post(
              `${baseUrl}?api_key=${ROBOFLOW_API_KEY}&confidence=${confidence}`,
              base64,
              {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 30000,
                transformRequest: [(d: string) => d],
              }
            );
          } catch (rawErr: any) {
            throw rawErr;
          }
        }
      }
    } else {
      response = await axios.post(
        baseUrl,
        null,
        {
          params: { api_key: ROBOFLOW_API_KEY, confidence, image: image },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 30000,
        }
      );
    }

    const data = response.data;
    if (data.error) {
      return res.status(400).json({ error: data.error, details: data });
    }

    let predictions = data.predictions || [];
    if (!Array.isArray(predictions)) predictions = [];
    const img = data.image;
    const imgW = (img && img.width) || data.image_width || 0;
    const imgH = (img && img.height) || data.image_height || 0;

    res.status(200).json({
      success: true,
      crowdCount: predictions.length,
      predictions,
      image_width: imgW,
      image_height: imgH,
      confidence: 0.15,
    });
  } catch (error: any) {
    const msg = error.response?.data?.error || error.response?.data?.message || error.message;
    console.error("Image analysis error:", msg, error.response?.data);
    res.status(error.response?.status || 500).json({
      error: msg || "Analysis failed",
      details: error.response?.data,
    });
  }
}
