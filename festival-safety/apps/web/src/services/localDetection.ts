import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

let model: any = null;
let isLoadingModel = false;

/**
 * Load COCO-SSD model (cached after first load)
 */
async function loadModel() {
  if (model) return model;
  if (isLoadingModel) {
    // Wait for the model to finish loading
    while (!model && isLoadingModel) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return model;
  }

  isLoadingModel = true;
  try {
    console.log("📦 Loading COCO-SSD model...");
    model = await cocoSsd.load();
    console.log("✅ COCO-SSD model loaded");
    return model;
  } catch (error) {
    console.error("❌ Failed to load model:", error);
    isLoadingModel = false;
    throw error;
  }
}

/**
 * Analyze a video frame for people and flashlight
 * @param canvas HTML canvas with the frame
 * @returns Detection results
 */
export async function detectFromCanvas(canvas: HTMLCanvasElement) {
  try {
    const startTime = Date.now();

    // Load model
    const modelToUse = await loadModel();

    // **OPTIMIZATION**: Resize canvas to smaller resolution for faster detection
    // Create a smaller canvas for inference (faster processing)
    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = 320; // Reduce from full resolution to 320px width
    smallCanvas.height = 240;
    const ctx = smallCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
    }

    // Convert small canvas to tensor
    const imageTensor = tf.browser.fromPixels(smallCanvas);

    // Run detection
    const predictions = await modelToUse.detect(imageTensor);

    // Count people (filter by confidence > 0.5 for faster, more accurate results)
    const people = predictions.filter(
      (p: any) => p.class === "person" && p.score > 0.5
    );
    const crowdCount = people.length;

    console.log(`✅ Detected ${crowdCount} people in ${Date.now() - startTime}ms`);

    // **OPTIMIZATION**: Check flashlight via sample pixels instead of all pixels
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) {
      console.warn("⚠️ Could not get canvas context for brightness check");
      imageTensor.dispose();
      return {
        crowdCount,
        flashlightDetected: false,
        flashlightIntensity: 0,
        processingTime: Date.now() - startTime,
      };
    }

    // Get image data
    const imageData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // **OPTIMIZATION**: Sample every Nth pixel instead of checking all
    let brightPixels = 0;
    const sampleRate = 4; // Check every 4th pixel (16x faster)
    for (let i = 0; i < data.length; i += sampleRate * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Brightness formula
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;

      if (brightness > 220) {
        brightPixels++;
      }
    }

    const totalPixels = data.length / (sampleRate * 4);
    const brightRatio = totalPixels > 0 ? brightPixels / totalPixels : 0;
    const flashlightDetected = brightRatio > 0.005;
    const flashlightIntensity = Math.min(100, Math.round(brightRatio * 1000));

    console.log(
      `🔦 Flashlight: ${flashlightDetected ? "YES" : "no"} (intensity: ${flashlightIntensity})`
    );

    // Cleanup
    imageTensor.dispose();

    return {
      crowdCount,
      flashlightDetected,
      flashlightIntensity,
      processingTime: Date.now() - startTime,
      predictions: people.map((p: any) => ({
        class: p.class,
        score: p.score,
      })),
    };
  } catch (error: any) {
    console.error("❌ Detection error:", error.message);
    throw error;
  }
}
