import React, { useState, useEffect } from "react";
import { theme } from "../../app/theme";

interface Detection {
  frameNumber: number;
  timestamp: number;
  crowdCount: number;
}

interface MLDemoProps {
  videoUrl?: string;
}

export default function MLDemoComponent({ videoUrl }: MLDemoProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [videoInput, setVideoInput] = useState(videoUrl || "");
  const [summary, setSummary] = useState<any>(null);

  const handleAnalyzeVideo = async () => {
    if (!videoInput.trim()) {
      alert("Please enter a video URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call Firebase function
      const response = await fetch("/.netlify/functions/analyzeVideoDemo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: videoInput }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const result = await response.json();

      setDetections(result.detections || []);
      setSummary(result.summary);
      setCurrentFrame(0);
    } catch (error) {
      console.error("ML analysis error:", error);
      alert("Failed to analyze video. Using demo data...");

      // Mock data for demo
      const mockDetections: Detection[] = [
        { frameNumber: 0, timestamp: 0, crowdCount: 23 },
        { frameNumber: 1, timestamp: 2, crowdCount: 28 },
        { frameNumber: 2, timestamp: 4, crowdCount: 35 },
        { frameNumber: 3, timestamp: 6, crowdCount: 32 },
        { frameNumber: 4, timestamp: 8, crowdCount: 41 },
      ];
      setDetections(mockDetections);
      setSummary({
        maxCrowd: 41,
        avgCrowd: 32,
        minCrowd: 23,
      });
      setCurrentFrame(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (detections.length === 0) {
    return (
      <div style={styles.panel}>
        <div style={styles.panelTitle}>🎥 Live Crowd Detection Demo</div>
        <div style={styles.note}>
          Enter a video URL to analyze crowd density in real-time
        </div>

        <input
          type="url"
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          placeholder="https://example.com/festival-video.mp4"
          style={styles.input}
        />

        <button
          onClick={handleAnalyzeVideo}
          disabled={isAnalyzing}
          style={styles.primaryBtn}
        >
          {isAnalyzing ? "Analyzing..." : "▶ Start Analysis"}
        </button>

        <div style={styles.note} className="mt-4">
          💡 Tip: Use a video showing a crowd scene for best results
        </div>
      </div>
    );
  }

  const currentDetection = detections[currentFrame];
  const progress = ((currentFrame + 1) / detections.length) * 100;

  return (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>🎥 Crowd Detection Results</div>

      {/* Video Preview Area */}
      <div style={styles.videoContainer}>
        <video
          src={videoInput}
          style={styles.video}
          controls
          onTimeUpdate={(e) => {
            const playbackTime = (e.currentTarget.currentTime / e.currentTarget.duration) * (detections.length - 1);
            setCurrentFrame(Math.min(Math.floor(playbackTime), detections.length - 1));
          }}
        />
      </div>
      
      <div style={styles.detectionContainer}>
        <div style={styles.detectionBox}>
          <div style={styles.crowdCountBig}>{currentDetection?.crowdCount || 0}</div>
          <div style={styles.crowdLabel}>People Detected</div>
        </div>

        <div style={styles.detectionInfo}>
          <div style={styles.infoRow}>
            <span>Frame:</span>
            <span style={styles.strong}>{currentDetection?.frameNumber + 1} / {detections.length}</span>
          </div>
          <div style={styles.infoRow}>
            <span>Time:</span>
            <span style={styles.strong}>{currentDetection?.timestamp}s</span>
          </div>
          <div style={styles.infoRow}>
            <span>Max Detected:</span>
            <span style={styles.strong}>{summary?.maxCrowd || 0}</span>
          </div>
          <div style={styles.infoRow}>
            <span>Average:</span>
            <span style={styles.strong}>{summary?.avgCrowd || 0}</span>
          </div>
        </div>
      </div>

      {/* Timeline Controls */}
      <div style={styles.timeline}>
        <div style={styles.progressLabel}>
          Frame Navigation
        </div>

        <input
          type="range"
          min={0}
          max={detections.length - 1}
          value={currentFrame}
          onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
          style={{
            ...styles.slider,
            width: "100%",
          }}
        />

        <div style={styles.progressInfo}>
          {Math.round(progress)}% analyzed
        </div>
      </div>

      {/* Frame List */}
      <div style={styles.frameList}>
        {detections.map((det, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentFrame(idx)}
            style={{
              ...styles.frameItem,
              ...(idx === currentFrame ? styles.frameItemActive : {}),
            }}
          >
            <div style={styles.frameItemCount}>{det.crowdCount}</div>
            <div style={styles.frameItemTime}>{det.timestamp}s</div>
          </div>
        ))}
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          setDetections([]);
          setSummary(null);
          setVideoInput("");
          setCurrentFrame(0);
        }}
        style={styles.secondaryBtn}
      >
        ↻ Analyze Another Video
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
    marginBottom: 14,
  },

  panelTitle: {
    fontWeight: 900,
    color: theme.text,
    marginBottom: 10,
    fontSize: 14,
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 800,
    outline: "none",
    marginBottom: 10,
  },

  primaryBtn: {
    background: theme.blue,
    color: theme.surface,
    border: `1px solid ${theme.blue}`,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    width: "100%",
  },

  secondaryBtn: {
    background: theme.surface,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    width: "100%",
    marginTop: 10,
  },

  note: {
    marginTop: 10,
    fontSize: 12,
    color: theme.muted,
    fontWeight: 700,
  },

  videoContainer: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    border: `1px solid ${theme.border}`,
    marginBottom: 14,
    background: "#000",
  },

  video: {
    width: "100%",
    height: "auto",
    display: "block",
  },

  detectionContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 14,
  },

  detectionBox: {
    borderRadius: 12,
    border: `2px solid ${theme.blue}`,
    background: `${theme.blue}20`,
    padding: 20,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },

  crowdCountBig: {
    fontSize: 48,
    fontWeight: 900,
    color: theme.blue,
    lineHeight: 1,
  },

  crowdLabel: {
    fontSize: 12,
    color: theme.muted,
    fontWeight: 700,
    marginTop: 8,
    textTransform: "uppercase",
  },

  detectionInfo: {
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: theme.text,
  },

  strong: {
    fontWeight: 900,
    color: theme.text,
  },

  timeline: {
    marginBottom: 14,
    padding: "12px",
    borderRadius: 12,
    background: theme.bg,
  },

  progressLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: theme.muted,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  slider: {
    width: "100%",
    cursor: "pointer",
  },

  progressInfo: {
    marginTop: 8,
    fontSize: 12,
    color: theme.muted,
    fontWeight: 700,
  },

  frameList: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
    overflowX: "auto",
    paddingBottom: 4,
  },

  frameItem: {
    minWidth: 60,
    padding: "8px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  frameItemActive: {
    background: theme.blue,
    border: `1px solid ${theme.blue}`,
    color: theme.surface,
  },

  frameItemCount: {
    fontWeight: 900,
    fontSize: 16,
  },

  frameItemTime: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 4,
  },
};
