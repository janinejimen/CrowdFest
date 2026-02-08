import React from "react";
import { theme } from "../../app/theme";
import { detectFromCanvas } from "../../services/localDetection";

type Feed = {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  lastSignal: "None" | "Crowd surge" | "Waving hands" | "Flashing signal";
};

const DEMO_FEEDS: Feed[] = [
  { id: "cam-1", name: "Main Stage — Cam 1", status: "disconnected", lastSignal: "None" },
  { id: "cam-2", name: "Entrance Gate — Cam 2", status: "disconnected", lastSignal: "None" },
  { id: "cam-3", name: "Food Court — Cam 3", status: "disconnected", lastSignal: "None" },
];

export default function ComputerVisionPage() {
  const [feeds, setFeeds] = React.useState<Feed[]>(DEMO_FEEDS);
  const [selected, setSelected] = React.useState<string>(DEMO_FEEDS[0].id);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [banner, setBanner] = React.useState<string | null>(null);
  const [crowdCount, setCrowdCount] = React.useState(0);
  const [flashlightDetected, setFlashlightDetected] = React.useState(false);
  const isRunningRef = React.useRef(false);
  const animationFrameRef = React.useRef<number | null>(null);

  const current = feeds.find((f) => f.id === selected)!;

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (isRunningRef.current) {
        disconnect();
      }
    };
  }, []);

  // Handle camera switching
  React.useEffect(() => {
    if (isRunningRef.current) {
      console.log("📹 Camera selection changed, disconnecting old camera");
      disconnect();
    }
  }, [selected]);

  const setFeed = (id: string, patch: Partial<Feed>) => {
    setFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const connect = async () => {
    try {
      console.log(`🎥 Connecting to ${current.name}...`);
      
      // Check if this is a video feed or live camera
      const isVideoFeed = selected === "cam-2"; // cam-2 uses video file
      
      if (isVideoFeed) {
        // Load video file
        const video = videoRef.current;
        if (!video) return;
        
        // Clear any existing media stream
        if (video.srcObject instanceof MediaStream) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
          video.srcObject = null;
        }
        
        video.src = "/output_festival.mp4"; // Video file from public folder
        video.loop = true;
        video.muted = true;
        
        setFeed(selected, { status: "connected" });
        
        // Load and play the video
        video.addEventListener("canplay", () => {
          if (videoRef.current && isRunningRef.current === false) {
            isRunningRef.current = true;
            videoRef.current.play().catch((error: any) => {
              setBanner(`Failed to play video: ${error.message}`);
            });
          }
        }, { once: true });
        
        video.load();
        startAnalysis();
        setBanner(`Playing ${current.name} feed.`);
        setTimeout(() => setBanner(null), 1500);
      } else {
        // Live camera feed
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        setFeed(selected, { status: "connected" });
        
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.src = ""; // Clear any video src
            videoRef.current.srcObject = stream;
            videoRef.current.play().then(() => {
              isRunningRef.current = true;
              startAnalysis();
            });

            setBanner(`Connected to ${current.name}.`);
            setTimeout(() => setBanner(null), 1500);
          }
        }, 100);
      }
    } catch (error: any) {
      setBanner(`Failed to access ${current.name}: ${error.message}`);
    }
  };

  const disconnect = () => {
    isRunningRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const video = videoRef.current;
    if (video) {
      // Handle both video file and live stream
      if (video.srcObject instanceof MediaStream) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        video.srcObject = null;
      } else {
        // Stop video file playback
        video.pause();
        video.src = "";
      }
    }

    setFeed(selected, { status: "disconnected", lastSignal: "None" });
    setCrowdCount(0);
    setFlashlightDetected(false);
    setBanner(`Disconnected from ${current.name}.`);
    setTimeout(() => setBanner(null), 1500);
  };

  const startAnalysis = () => {
    let frameCounter = 0;
    const ANALYZE_EVERY_N_FRAMES = 3; // Every 3 frames = faster detection (local inference is instant)
    let lastErrorTime = 0;

    const analyzeFrame = async () => {
      if (!isRunningRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      // Throttle logic
      frameCounter++;
      if (frameCounter % ANALYZE_EVERY_N_FRAMES !== 0) {
        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      try {
        // Draw video frame to canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context failed");

        ctx.drawImage(video, 0, 0);

        // Local detection - NO Firebase needed! (Fast!)
        const result = await detectFromCanvas(canvas);

        setCrowdCount(result.crowdCount);
        setFlashlightDetected(result.flashlightDetected);

        // Update feed status
        if (result.flashlightDetected) {
          setFeed(selected, { lastSignal: "Flashing signal" });
        } else if (result.crowdCount > 10) {
          setFeed(selected, { lastSignal: "Crowd surge" });
        } else {
          setFeed(selected, { lastSignal: "None" });
        }

        lastErrorTime = 0; // Reset error timer on success
      } catch (error: any) {
        const now = Date.now();
        if (now - lastErrorTime > 5000) {
          console.error("❌ Analysis error:", error.message);
          lastErrorTime = now;
        }
      }

      // Continue analyzing (no cooldown since it's local)
      if (isRunningRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
      }
    };

    analyzeFrame();
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.h2}>Computer Vision</h2>
          <div style={styles.subtext}>Monitor camera feeds for crowd danger signals</div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {current.status === "connected" ? (
            <button onClick={disconnect} style={styles.disconnectBtn}>🔴 Turn Off Camera</button>
          ) : (
            <button onClick={connect} style={styles.primaryBtn}>
              {selected === "cam-2" ? "▶️ Connect Camera" : "📷 Request Camera Access"}
            </button>
          )}
        </div>
      </div>

      {banner && <div style={styles.banner}>{banner}</div>}

      <div style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Cameras</div>
          <div style={{ display: "grid", gap: 8 }}>
            {feeds.map((f) => {
              const active = f.id === selected;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelected(f.id)}
                  style={{
                    ...styles.feedBtn,
                    borderColor: active ? theme.blue : theme.border,
                    background: active ? theme.bg : theme.surface,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 950, color: theme.text }}>{f.name}</div>
                    <span style={{ ...styles.pill, background: f.status === "connected" ? theme.purple : theme.bg }}>
                      {f.status}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, color: theme.muted, fontWeight: 800, fontSize: 12 }}>
                    Last signal: <span style={{ color: theme.text }}>{f.lastSignal}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Feed Preview</div>
          <div style={styles.preview}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                position: "absolute",
                top: 0, left: 0, width: "100%", height: "100%",
                objectFit: "cover", backgroundColor: "#000",
                display: current.status === "connected" ? "block" : "none",
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {current.status === "connected" ? (
              <>
                <div style={styles.statsOverlay}>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{crowdCount}</div>
                    <div style={styles.statLabel}>People</div>
                  </div>
                  <div style={{ ...styles.statCard, background: flashlightDetected ? "rgba(255, 100, 100, 0.9)" : "rgba(100, 100, 100, 0.7)" }}>
                    <div style={styles.statValue}>{flashlightDetected ? "🔦" : "✓"}</div>
                    <div style={styles.statLabel}>{flashlightDetected ? "Flashlight" : "Clear"}</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.previewInner}>
                <div style={{ fontWeight: 950, color: theme.text }}>{current.name}</div>
                <div style={{ color: theme.muted, fontWeight: 800 }}>Status: {current.status}</div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={styles.panelTitle}>Live Detection Stats</div>
            <div style={styles.alertBox}>
              <div style={{ fontWeight: 950 }}>People Detected</div>
              <div style={{ marginTop: 6, fontWeight: 900, fontSize: 24 }}>{crowdCount}</div>
            </div>
            <div style={{ ...styles.alertBox, borderColor: flashlightDetected ? "#ff6464" : "#64c864" }}>
              <div style={{ fontWeight: 950 }}>Flashlight Detection</div>
              <div style={{ marginTop: 6, fontWeight: 900, color: flashlightDetected ? "#ff4444" : "#44bb44" }}>
                {flashlightDetected ? "🔦 DETECTED" : "✅ None Detected"}
              </div>
            </div>
            <div style={styles.note}>
              Running every 30 frames + 1s cooldown. Signal: {current.lastSignal}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ... styles object remains exactly the same as your previous version ...
const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 14 },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 16, background: theme.surface, border: `1px solid ${theme.border}` },
  h2: { margin: 0, fontSize: 22, fontWeight: 900, color: theme.text },
  subtext: { fontSize: 13, fontWeight: 700, color: theme.muted },
  banner: { borderRadius: 14, border: `1px solid ${theme.border}`, background: theme.surface, padding: "10px 12px", fontWeight: 900 },
  grid: { display: "grid", gridTemplateColumns: "360px 1fr", gap: 12 },
  panel: { borderRadius: 18, border: `1px solid ${theme.border}`, background: theme.surface, padding: 14 },
  panelTitle: { fontWeight: 900, color: theme.text, marginBottom: 10, fontSize: 14 },
  feedBtn: { textAlign: "left", padding: 12, borderRadius: 14, border: `1px solid ${theme.border}`, cursor: "pointer" },
  pill: { padding: "6px 10px", borderRadius: 999, border: `1px solid ${theme.border}`, fontWeight: 950, fontSize: 12 },
  preview: { position: "relative", borderRadius: 16, border: `2px solid ${theme.border}`, background: "#000", overflow: "hidden", height: 500, width: "100%" },
  previewInner: { padding: 16 },
  alertBox: { borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.bg, padding: 14 },
  statsOverlay: { position: "absolute", bottom: 14, left: 14, display: "flex", gap: 12, zIndex: 10 },
  statCard: { borderRadius: 12, background: "rgba(50, 50, 50, 0.85)", padding: "12px 16px", textAlign: "center", minWidth: 80 },
  statValue: { fontSize: 32, fontWeight: 900, color: theme.text },
  statLabel: { fontSize: 11, fontWeight: 800, color: theme.muted },
  analyzing: { position: "absolute", top: 14, right: 14, background: "rgba(100, 150, 200, 0.85)", color: "#fff", padding: "8px 12px", borderRadius: 10, fontWeight: 900, fontSize: 12 },
  primaryBtn: { background: theme.blue, color: theme.surface, padding: "10px 14px", borderRadius: 12, fontWeight: 900, cursor: "pointer" },
  disconnectBtn: { background: "#ff4444", color: "#fff", padding: "10px 14px", borderRadius: 12, fontWeight: 900, cursor: "pointer" },
  note: { marginTop: 10, fontSize: 12, color: theme.muted, fontWeight: 700 },
};