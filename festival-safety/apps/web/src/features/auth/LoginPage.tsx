// festival-safety/apps/web/src/features/auth/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../services/firebase";

const palette = {
  page: "#FBF8F2",
  card: "#F4EEE6",
  blue: "#334195",
  wisteria: "#C69DD2",
  copper: "#D66853",
  ink: "#111827",
  muted: "rgba(17,24,39,0.68)",
  border: "rgba(17,24,39,0.22)",
  borderSoft: "rgba(17,24,39,0.14)",
  white: "#FFFFFF",
  dangerBg: "rgba(214, 104, 83, 0.14)",
  dangerText: "#8B2E22",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      const getMyRole = httpsCallable(functions, "getMyRole");
      const res = await getMyRole();
      const role = (res.data as any)?.role as string | undefined;

      if (role !== "organizer") {
        setError("This web app is for organizers only. Please use the attendee app.");
        setBusy(false);
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>CROWDFEST ADMIN</div>
        <h1 style={styles.title}>Organizer login</h1>
        <p style={styles.subtitle}>Sign in to access monitoring, reports, and event tools.</p>

        {error ? (
          <div style={styles.errorBox} role="alert">
            <div style={styles.errorTitle}>Login failed</div>
            <div style={styles.errorMsg}>{error}</div>
          </div>
        ) : null}

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              autoComplete="email"
              inputMode="email"
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={styles.input}
            />
          </label>

          <div style={styles.btnRow}>
            <button type="submit" style={styles.primaryBtn} disabled={busy}>
              {busy ? "Logging in…" : "Login"}
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate("/get-started")}
              disabled={busy}
            >
              Back
            </button>
          </div>

          <div style={styles.divider} />

          <button
            type="button"
            style={styles.linkBtn}
            onClick={() => navigate("/signup")}
            disabled={busy}
          >
            Create organizer account
          </button>
        </form>

        <div style={styles.metaRow}>
          <span style={styles.metaItem}>
            <span style={{ ...styles.metaDot, background: palette.blue }} />
            Secure sign-in
          </span>
          <span style={styles.metaItem}>
            <span style={{ ...styles.metaDot, background: palette.wisteria }} />
            Organizer-only access
          </span>
          <span style={styles.metaItem}>
            <span style={{ ...styles.metaDot, background: palette.copper }} />
            Role verified
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 64px)",
    background: palette.page,
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  card: {
    width: "min(860px, 100%)",
    background: palette.card,
    borderRadius: 28,
    border: `1.5px solid ${palette.border}`,
    boxShadow: "0 10px 24px rgba(17,24,39,0.08)",
    padding: 28,
    display: "grid",
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.2,
    color: palette.muted,
  },
  title: {
    margin: 0,
    fontSize: 44,
    lineHeight: 1.05,
    fontWeight: 980,
    letterSpacing: -0.9,
    color: palette.ink,
  },
  subtitle: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.55,
    fontWeight: 800,
    color: palette.muted,
    maxWidth: 560,
  },
  errorBox: {
    marginTop: 6,
    borderRadius: 16,
    border: `1px solid rgba(214, 104, 83, 0.35)`,
    background: palette.dangerBg,
    padding: 12,
    color: palette.dangerText,
  },
  errorTitle: { fontWeight: 950, fontSize: 12, marginBottom: 4 },
  errorMsg: { fontWeight: 850, fontSize: 12, lineHeight: 1.35 },
  form: {
    marginTop: 8,
    display: "grid",
    gap: 12,
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 12,
    fontWeight: 900,
    color: palette.muted,
  },
  input: {
    height: 42,
    borderRadius: 12,
    border: `1px solid ${palette.borderSoft}`,
    background: palette.white,
    padding: "0 12px",
    fontWeight: 850,
    fontSize: 13,
    color: palette.ink,
    outline: "none",
  },
  btnRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 4,
  },
  primaryBtn: {
    background: palette.blue,
    color: palette.white,
    border: `1px solid ${palette.blue}`,
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    background: palette.white,
    color: palette.ink,
    border: `1px solid ${palette.borderSoft}`,
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  divider: {
    height: 1,
    background: "rgba(17,24,39,0.10)",
    margin: "6px 0",
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    padding: 0,
    textAlign: "left",
    color: palette.blue,
    fontWeight: 950,
    cursor: "pointer",
    width: "fit-content",
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
  metaItem: { display: "inline-flex", alignItems: "center", gap: 8 },
  metaDot: { width: 7, height: 7, borderRadius: 999 },
};
