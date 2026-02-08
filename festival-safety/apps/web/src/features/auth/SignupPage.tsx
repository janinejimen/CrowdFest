// festival-safety/apps/web/src/features/auth/SignupPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
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

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      const setAccountType = httpsCallable(functions, "setAccountType");
      await setAccountType({ accountType: "organizer" });

      navigate("/profile/setup", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Signup failed (are you allowlisted?)");
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>CROWDFEST ADMIN</div>
        <h1 style={styles.title}>Create organizer account</h1>
        <p style={styles.subtitle}>Create an organizer login to access the admin dashboard.</p>

        {error ? (
          <div style={styles.errorBox} role="alert">
            <div style={styles.errorTitle}>Signup failed</div>
            <div style={styles.errorMsg}>{error}</div>
          </div>
        ) : null}

        <form onSubmit={handleSignup} style={styles.form}>
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
              autoComplete="new-password"
              required
              style={styles.input}
            />
          </label>

          <div style={styles.btnRow}>
            <button type="submit" style={styles.primaryBtn} disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>

            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate("/login")}
              disabled={busy}
            >
              Back to login
            </button>
          </div>

          <div style={styles.metaRow}>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.wisteria }} />
              Organizer allowlist
            </span>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.blue }} />
              Secure account creation
            </span>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.copper }} />
              Role set on signup
            </span>
          </div>
        </form>
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
  kicker: { fontSize: 12, fontWeight: 900, letterSpacing: 1.2, color: palette.muted },
  title: {
    margin: 0,
    fontSize: 44,
    lineHeight: 1.05,
    fontWeight: 980,
    letterSpacing: -0.9,
    color: palette.ink,
  },
  subtitle: { margin: 0, fontSize: 14, lineHeight: 1.55, fontWeight: 800, color: palette.muted },
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
  form: { marginTop: 8, display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 12, fontWeight: 900, color: palette.muted },
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
  btnRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 },
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
  metaRow: { marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, fontWeight: 850, color: palette.muted },
  metaItem: { display: "inline-flex", alignItems: "center", gap: 8 },
  metaDot: { width: 7, height: 7, borderRadius: 999 },
};
