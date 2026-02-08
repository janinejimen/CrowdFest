import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../state/store";

const palette = {
  cream: "#F6E2BC",   // lighter wheat background
  card: "#F2E8DC",
  blue: "#334195",
  wisteria: "#C69DD2",
  copper: "#D66853",
  ink: "#111827",
  muted: "rgba(17,24,39,0.65)",
  border: "rgba(17,24,39,0.12)",
  white: "#FFFFFF",
};

export default function GetStartedPage() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.organizerProfile);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.content}>
          <div style={styles.kicker}>CROWDFEST ADMIN</div>

          <h1 style={styles.title}>Get started.</h1>

          <p style={styles.subtitle}>
            {profile
              ? `Welcome back, ${profile.name}.`
              : "Create your Out-of-Field organizer profile to access the admin dashboard."}
          </p>

          {!profile ? (
            <div style={styles.infoPill}>
              <span style={styles.dot} />
              No profile yet — create one in ~1 minute
            </div>
          ) : (
            <div style={styles.infoPill}>
              <span style={styles.dot} />
              Signed in as <b>{profile.email}</b>
            </div>
          )}

          <div style={styles.ctaRow}>
            <button
              style={styles.primaryBtn}
              onClick={() =>
                navigate(profile ? "/dashboard" : "/profile/setup")
              }
            >
              {profile ? "Go to Dashboard" : "Create Profile"}
            </button>

            <button
              style={styles.secondaryBtn}
              onClick={() =>
                navigate(profile ? "/profile" : "/login")
              }
            >
              {profile ? "View Profile" : "Login"}
            </button>
          </div>

          <div style={styles.metaRow}>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.blue }} />
              Vision signals
            </span>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.wisteria }} />
              Incident response
            </span>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.copper }} />
              Events & invites
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 64px)",
    background: "#FBF8F2", // lighter cream / off-white
    display: "grid",
    placeItems: "center",
    padding: 20,
  },  

  hero: {
    width: "min(1100px, 100%)",
    background: palette.card,
    borderRadius: 28,
  
    // clearer outline
    border: "1.5px solid rgba(17,24,39,0.18)",
  
    // softer, closer shadow
    boxShadow: "0 12px 28px rgba(17,24,39,0.10)",
  },
  

  content: {
    padding: 32,
    maxWidth: 720,
    display: "grid",
    gap: 14,
  },

  kicker: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.2,
    color: palette.muted,
  },

  title: {
    margin: 0,
    fontSize: 52,
    lineHeight: 1.02,
    fontWeight: 980,
    letterSpacing: -1.2,
    color: palette.ink,
  },

  subtitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.55,
    fontWeight: 800,
    color: palette.muted,
    maxWidth: 620,
  },

  infoPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    background: palette.white,
    border: `1px solid ${palette.border}`,
    fontWeight: 850,
    fontSize: 12,
    color: palette.muted,
    width: "fit-content",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: palette.blue,
  },

  ctaRow: {
    display: "flex",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },

  primaryBtn: {
    background: palette.blue,
    color: palette.white,
    border: `1px solid ${palette.blue}`,
    padding: "12px 18px",
    borderRadius: 14,
    fontWeight: 950,
    cursor: "pointer",
  },

  secondaryBtn: {
    background: palette.white,
    color: palette.ink,
    border: `1px solid ${palette.border}`,
    padding: "12px 18px",
    borderRadius: 14,
    fontWeight: 950,
    cursor: "pointer",
  },

  metaRow: {
    marginTop: 8,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    fontSize: 12,
    fontWeight: 850,
    color: palette.muted,
  },

  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },

  metaDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
};
