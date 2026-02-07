import React from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";

import { theme } from "./theme";

import DashboardPage from "../features/dashboard/DashboardPage";
import EventHomePage from "../features/event-home/EventHomePage";
import InvitesPage from "../features/invites/InvitesPage";
import NotificationsPage from "../features/notifications/NotificationsPage";

/* ---------- Nav Link ---------- */
function NavItem({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        padding: "8px 12px",
        borderRadius: 12,
        fontWeight: 800,
        fontSize: 13,
        textDecoration: "none",
        color: active ? theme.surface : theme.text,
        background: active ? theme.blue : "transparent",
        border: `1px solid ${active ? theme.blue : theme.border}`,
      }}
    >
      {label}
    </Link>
  );
}

/* ---------- App Shell ---------- */
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      <header
        style={{
          background: theme.cream,
          borderBottom: `1px solid ${theme.border}`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: -0.3,
            color: theme.text,
          }}
        >
          WiCS2026 · Admin
        </div>

        <nav
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/events" label="Events" />
          <NavItem to="/invites" label="Invites" />
          <NavItem to="/notifications" label="Alerts" />
        </nav>
      </header>

      <main
        style={{
          padding: 16,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}

/* ---------- Router ---------- */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventHomePage />} />
          <Route path="/invites" element={<InvitesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<div>Page not found</div>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
