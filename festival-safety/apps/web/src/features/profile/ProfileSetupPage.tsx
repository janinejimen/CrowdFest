import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OrganizerRole, useAppStore } from "../../state/store";

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
};

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const organizerProfile = useAppStore((s) => s.organizerProfile);
  const setOrganizerProfile = useAppStore((s) => s.setOrganizerProfile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role] = useState<OrganizerRole>("OUT_OF_FIELD"); // web is fixed

  // Prefill when editing
  useEffect(() => {
    if (!organizerProfile) return;
    setName(organizerProfile.name ?? "");
    setEmail(organizerProfile.email ?? "");
    setPhone(organizerProfile.phone ?? "");
  }, [organizerProfile]);

  const canSave = useMemo(() => {
    return name.trim().length > 1 && email.trim().length > 3 && role === "OUT_OF_FIELD";
  }, [name, email, role]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const existingId = organizerProfile?.id;
    const id =
      existingId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `org_${Math.random().toString(16).slice(2)}`);

    setOrganizerProfile({
      id,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role: "OUT_OF_FIELD",
    });

    const fromProfileEdit =
      (location.state as any)?.from === "profile" || !!organizerProfile;

    navigate(fromProfileEdit ? "/profile" : "/dashboard", { replace: true });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <div style={styles.kicker}>CROWDFEST ADMIN</div>
          <div style={styles.chip}>Web (Out-of-Field)</div>
        </div>

        <h1 style={styles.title}>Set up your profile</h1>
        <p style={styles.subtitle}>
          This takes about a minute. We’ll use this info for assignment and incident response.
        </p>

        <form onSubmit={onSave} style={styles.form}>
          <div style={styles.grid}>
            <label style={styles.label}>
              Full Name
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Last"
              />
            </label>

            <label style={styles.label}>
              Email
              <input
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                inputMode="email"
                autoComplete="email"
              />
            </label>

            <label style={styles.label}>
              Phone (optional)
              <input
                style={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(###) ###-####"
                autoComplete="tel"
                inputMode="tel"
              />
            </label>

            <div style={styles.label}>
              Role
              <div style={styles.readonlyPill}>Out-of-Field Organizer</div>
            </div>
          </div>

          <div style={styles.btnRow}>
            <button
              type="submit"
              style={{ ...styles.primaryBtn, opacity: canSave ? 1 : 0.55 }}
              disabled={!canSave}
            >
              Save profile
            </button>

            {organizerProfile ? (
              <button
                type="button"
                onClick={() => navigate("/profile")}
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/get-started")}
                style={styles.secondaryBtn}
              >
                Back
              </button>
            )}
          </div>

          <div style={styles.divider} />

          <div style={styles.metaRow}>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.blue }} />
              Stored locally (MVP)
            </span>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.wisteria }} />
              Organizer-only
            </span>
            <span style={styles.metaItem}>
              <span style={{ ...styles.metaDot, background: palette.copper }} />
              Editable anytime
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
    width: "min(820px, 100%)",
    background: palette.card,
    borderRadius: 28,
    border: `1.5px solid ${palette.border}`,
    boxShadow: "0 10px 24px rgba(17,24,39,0.08)",
    padding: 28,
    display: "grid",
    gap: 10,
  },

  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  kicker: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.2,
    color: palette.muted,
  },

  chip: {
    fontSize: 12,
    fontWeight: 900,
    color: palette.ink,
    background: palette.white,
    border: `1px solid ${palette.borderSoft}`,
    borderRadius: 999,
    padding: "6px 10px",
  },

  title: {
    margin: 0,
    fontSize: 40,
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
    maxWidth: 640,
  },

  form: {
    marginTop: 8,
    display: "grid",
    gap: 12,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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

  readonlyPill: {
    height: 42,
    borderRadius: 12,
    border: `1px solid ${palette.borderSoft}`,
    background: "rgba(255,255,255,0.65)",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    fontWeight: 900,
    fontSize: 13,
    color: palette.ink,
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

  metaRow: {
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
