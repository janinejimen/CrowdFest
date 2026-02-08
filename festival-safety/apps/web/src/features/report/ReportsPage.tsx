import React from "react";
import { theme } from "../../app/theme";
import { useAppStore } from "../../state/store";

/**
 * Reports Inbox (Out-of-Field Organizer)
 * - View reports
 * - Assign to in-field organizers (dispatch)
 *
 * Backend note:
 * You currently do NOT have listReports/listOrganizers/assignReport functions shown,
 * so this is an MVP using local mock data + local assignment state.
 * Later: replace mock arrays with backend data + callable "assignReportFn".
 */

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ReportStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED";

type ReportItem = {
  id: string;
  eventId: string;
  createdAt: string;
  category: string;
  title: string;
  description: string;
  locationText?: string | null;
  severity: Severity;
  status: ReportStatus;
  assignedTo?: { uid: string; name: string } | null;
};

type InFieldOrganizer = {
  uid: string;
  name: string;
  role: "IN_FIELD";
  active: boolean;
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}
function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function ReportsPage() {
  const events = useAppStore((s) => s.events);
  const [selectedEventId, setSelectedEventId] = React.useState(events[0]?.id || "");

  // Mock in-field organizers (replace later with backend listOrganizersFn)
  const [organizers] = React.useState<InFieldOrganizer[]>([
    { uid: "org_amy", name: "Amy (In-Field)", role: "IN_FIELD", active: true },
    { uid: "org_jordan", name: "Jordan (In-Field)", role: "IN_FIELD", active: true },
    { uid: "org_sam", name: "Sam (In-Field)", role: "IN_FIELD", active: false },
  ]);

  // Mock reports inbox (replace later with backend listReportsFn)
  const [reports, setReports] = React.useState<ReportItem[]>(() => {
    const now = Date.now();
    const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
    const defaultEventId = events[0]?.id || "event_demo";

    return [
      {
        id: "rpt_" + makeId(),
        eventId: defaultEventId,
        createdAt: iso(7),
        category: "CROWD",
        title: "Possible crowd surge near Main Stage",
        description: "Density increasing fast; people pushing toward barricade.",
        locationText: "Main Stage - Front Left",
        severity: "HIGH",
        status: "OPEN",
        assignedTo: null,
      },
      {
        id: "rpt_" + makeId(),
        eventId: defaultEventId,
        createdAt: iso(22),
        category: "MEDICAL",
        title: "Attendee fainted",
        description: "Person down, needs water + med assistance.",
        locationText: "Food Court Entrance",
        severity: "CRITICAL",
        status: "ASSIGNED",
        assignedTo: { uid: "org_amy", name: "Amy (In-Field)" },
      },
      {
        id: "rpt_" + makeId(),
        eventId: defaultEventId,
        createdAt: iso(55),
        category: "SECURITY",
        title: "Flashing signals in crowd",
        description: "Repeated flashing light pattern; unsure if coordinated.",
        locationText: "Stage B - Middle",
        severity: "MEDIUM",
        status: "RESOLVED",
        assignedTo: { uid: "org_jordan", name: "Jordan (In-Field)" },
      },
    ];
  });

  const [activeReportId, setActiveReportId] = React.useState<string | null>(null);
  const activeReport = React.useMemo(
    () => reports.find((r) => r.id === activeReportId) || null,
    [reports, activeReportId]
  );

  React.useEffect(() => {
    if (!selectedEventId && events[0]?.id) setSelectedEventId(events[0].id);
  }, [selectedEventId, events]);

  const filteredReports = React.useMemo(() => {
    if (!selectedEventId) return [];
    return reports
      .filter((r) => r.eventId === selectedEventId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [reports, selectedEventId]);

  React.useEffect(() => {
    if (!activeReportId && filteredReports[0]) setActiveReportId(filteredReports[0].id);
    if (activeReportId && !filteredReports.some((r) => r.id === activeReportId)) {
      setActiveReportId(filteredReports[0]?.id || null);
    }
  }, [filteredReports, activeReportId]);

  // Assign workflow (MVP local; later call backend assign/claim/dispatch)
  const [selectedOrganizerUid, setSelectedOrganizerUid] = React.useState("");
  React.useEffect(() => {
    // default to first active organizer
    const firstActive = organizers.find((o) => o.active)?.uid || "";
    setSelectedOrganizerUid(firstActive);
  }, [organizers]);

  const assign = () => {
    if (!activeReport) return;
    const org = organizers.find((o) => o.uid === selectedOrganizerUid);
    if (!org) return;

    setReports((prev) =>
      prev.map((r) =>
        r.id === activeReport.id
          ? {
              ...r,
              status: r.status === "RESOLVED" ? "RESOLVED" : "ASSIGNED",
              assignedTo: { uid: org.uid, name: org.name },
            }
          : r
      )
    );
  };

  const markInProgress = () => {
    if (!activeReport) return;
    setReports((prev) =>
      prev.map((r) => (r.id === activeReport.id ? { ...r, status: "IN_PROGRESS" } : r))
    );
  };

  const resolve = () => {
    if (!activeReport) return;
    setReports((prev) =>
      prev.map((r) => (r.id === activeReport.id ? { ...r, status: "RESOLVED" } : r))
    );
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={styles.headerCard}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18, color: theme.text }}>Reports</div>
            <div style={{ color: theme.muted, fontWeight: 700, marginTop: 4 }}>
              View reports and dispatch in-field organizers.
            </div>
          </div>
          <div style={styles.badgeInfo}>MVP: local inbox + assignment</div>
        </div>
      </div>

      <div style={styles.controlsCard}>
        <div style={{ fontWeight: 900, marginBottom: 8, color: theme.text }}>Event</div>
        <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={styles.input}>
          <option value="">(Select event)</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <div style={{ marginTop: 8, fontSize: 12, color: theme.muted, fontWeight: 700 }}>
          Later: replace with backend listReportsFn + listOrganizersFn + assignReportFn.
        </div>
      </div>

      <div style={styles.grid}>
        {/* Inbox list */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Inbox</div>

          {filteredReports.length === 0 ? (
            <div style={styles.empty}>No reports for this event yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filteredReports.map((r) => {
                const active = r.id === activeReportId;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveReportId(r.id)}
                    style={{
                      ...styles.listItem,
                      borderColor: active ? theme.blue : theme.border,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 950, color: theme.text, lineHeight: 1.15 }}>{r.title}</div>
                      <span style={severityPill(r.severity)}>{r.severity}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
                      <div style={{ color: theme.muted, fontWeight: 800, fontSize: 12 }}>
                        {r.category} • {fmt(r.createdAt)}
                      </div>
                      <span style={statusPill(r.status)}>{r.status}</span>
                    </div>

                    {r.assignedTo && (
                      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, color: theme.text }}>
                        Assigned: {r.assignedTo.name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details + dispatch */}
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Dispatch</div>

          {!activeReport ? (
            <div style={styles.empty}>Select a report to dispatch.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={statusPill(activeReport.status)}>{activeReport.status}</span>
                <span style={severityPill(activeReport.severity)}>{activeReport.severity}</span>
                <span style={styles.metaText}>{activeReport.category} • {fmt(activeReport.createdAt)}</span>
              </div>

              <div style={{ fontWeight: 950, fontSize: 18, color: theme.text }}>{activeReport.title}</div>

              <div style={styles.block}>
                <div style={styles.blockLabel}>Description</div>
                <div style={styles.blockBody}>{activeReport.description}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.blockLabel}>Location</div>
                <div style={styles.blockBody}>{activeReport.locationText || "—"}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.blockLabel}>Assign to In-Field Organizer</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <select
                    value={selectedOrganizerUid}
                    onChange={(e) => setSelectedOrganizerUid(e.target.value)}
                    style={{ ...styles.input, minWidth: 280, flex: 1 }}
                  >
                    {organizers.map((o) => (
                      <option key={o.uid} value={o.uid}>
                        {o.name} {o.active ? "" : "(offline)"}
                      </option>
                    ))}
                  </select>

                  <button
                    style={styles.primaryBtn}
                    onClick={assign}
                    disabled={activeReport.status === "RESOLVED"}
                    title={activeReport.status === "RESOLVED" ? "Resolved reports cannot be reassigned" : "Assign report"}
                  >
                    Assign
                  </button>
                </div>

                {activeReport.assignedTo && (
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: theme.text }}>
                    Currently assigned to: {activeReport.assignedTo.name}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  style={styles.secondaryBtn}
                  onClick={markInProgress}
                  disabled={activeReport.status === "RESOLVED"}
                >
                  Mark In Progress
                </button>
                <button style={styles.secondaryBtn} onClick={resolve} disabled={activeReport.status === "RESOLVED"}>
                  Resolve
                </button>
              </div>

              <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700 }}>
                Backend hookup later: list reports + assign/dispatch to specific organizer uid.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles: Record<string, React.CSSProperties> = {
  headerCard: {
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
  },
  badgeInfo: {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  controlsCard: {
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 380px) 1fr",
    gap: 12,
    alignItems: "start",
  },
  panel: {
    borderRadius: 18,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    padding: 14,
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.06)",
  },
  panelTitle: {
    fontWeight: 950,
    color: theme.text,
    marginBottom: 10,
    fontSize: 14,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontWeight: 800,
    outline: "none",
    width: "100%",
  },
  listItem: {
    textAlign: "left",
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    padding: 12,
    cursor: "pointer",
  },
  empty: {
    padding: 12,
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.muted,
    fontWeight: 800,
  },
  metaText: {
    color: theme.muted,
    fontWeight: 800,
    fontSize: 12,
  },
  block: {
    borderRadius: 14,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    padding: 12,
  },
  blockLabel: {
    color: theme.muted,
    fontWeight: 900,
    fontSize: 12,
    marginBottom: 6,
  },
  blockBody: {
    color: theme.text,
    fontWeight: 800,
    fontSize: 14,
    lineHeight: 1.35,
  },
  primaryBtn: {
    background: theme.blue,
    color: theme.surface,
    border: `1px solid ${theme.blue}`,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    background: theme.surface,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};

function severityPill(sev: Severity): React.CSSProperties {
  const bg =
    sev === "CRITICAL" ? theme.coral : sev === "HIGH" ? theme.coral : sev === "MEDIUM" ? theme.purple : theme.bg;
  return {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: bg,
    color: theme.text,
    fontWeight: 950,
    fontSize: 12,
    whiteSpace: "nowrap",
  };
}

function statusPill(status: ReportStatus): React.CSSProperties {
  const bg = status === "OPEN" ? theme.bg : status === "ASSIGNED" ? theme.purple : status === "IN_PROGRESS" ? theme.purple : theme.blue;
  return {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: bg,
    color: theme.text,
    fontWeight: 950,
    fontSize: 12,
    whiteSpace: "nowrap",
  };
}
