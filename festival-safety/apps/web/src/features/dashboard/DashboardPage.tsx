import React from "react";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

export default function DashboardPage() {
  const attendees = useAppStore((s) => s.attendees);
  const highRisk = attendees.filter((a) => a.medicallyHighRisk);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h2 style={styles.h2}>Dashboard</h2>
        <div style={styles.subtext}>Off-Field Admin</div>
      </div>

      <div style={styles.cards}>
        <StatCard
          title="Total Attendees"
          value={String(attendees.length)}
          accent="blue"
        />
        <StatCard
          title="Medically High Risk"
          value={String(highRisk.length)}
          accent="coral"
        />
      </div>

      <div style={styles.panel}>
        <div style={styles.panelTitle}>All Attendees (risk flags)</div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Risk Flag</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={a.id}>
                  <td style={styles.td}>{a.name}</td>
                  <td style={styles.td}>
                    {a.medicallyHighRisk ? (
                      <span style={styles.badgeHigh}>HIGH RISK</span>
                    ) : (
                      <span style={styles.badgeOk}>OK</span>
                    )}
                  </td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td style={styles.tdMuted} colSpan={2}>
                    No attendees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.note}>
          Flags indicate attendees marked as medically high risk.
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: "blue" | "purple" | "coral";
}) {
  const accentColor =
    accent === "blue" ? theme.blue : accent === "purple" ? theme.purple : theme.coral;

  return (
    <div style={styles.card}>
      <div style={{ ...styles.accentBar, background: accentColor }} />
      <div style={styles.cardInner}>
        <div style={styles.cardTitle}>{title}</div>
        <div style={styles.cardValue}>{value}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "grid",
    gap: 14,
  },

  headerRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 16,
    background: theme.cream,
    border: `1px solid ${theme.border}`,
  },

  h2: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: theme.text,
    letterSpacing: -0.2,
  },

  subtext: {
    fontSize: 13,
    fontWeight: 700,
    color: theme.muted,
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  accentBar: {
    height: 6,
    width: "100%",
  },

  cardInner: {
    padding: 14,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: theme.muted,
    marginBottom: 8,
  },

  cardValue: {
    fontSize: 34,
    fontWeight: 950,
    color: theme.text,
    lineHeight: 1,
  },

  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },

  panelTitle: {
    fontWeight: 900,
    color: theme.text,
    marginBottom: 10,
    fontSize: 14,
  },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: theme.surface,
  },

  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    color: theme.muted,
    fontWeight: 900,
    borderBottom: `1px solid ${theme.border}`,
    background: theme.bg,
  },

  td: {
    padding: "12px",
    fontSize: 14,
    color: theme.text,
    borderBottom: `1px solid ${theme.border}`,
  },

  tdMuted: {
    padding: "12px",
    fontSize: 14,
    color: theme.muted,
  },

  badgeHigh: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    color: theme.text,
    background: theme.coral,
    border: `1px solid ${theme.border}`,
  },

  badgeOk: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    color: theme.text,
    background: theme.purple,
    border: `1px solid ${theme.border}`,
  },

  note: {
    marginTop: 10,
    fontSize: 12,
    color: theme.muted,
    fontWeight: 700,
  },
};
