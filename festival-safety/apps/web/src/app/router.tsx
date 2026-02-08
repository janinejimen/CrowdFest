// festival-safety/apps/web/src/app/router.tsx
import React, { useEffect, useState } from "react";
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
import ProfileSetupPage from "../features/profile/ProfileSetupPage";
import ProfilePage from "../features/profile/ProfilePage";

import LoginPage from "../features/auth/LoginPage";
import SignupPage from "../features/auth/SignupPage";
import GetStartedPage from "../features/auth/GetStartedPage";

import EventHomePage from "../features/event/EventHomePage";
import CreateEventPage from "../features/event/CreateEventPage";
import EventDetailPage from "../features/event/EventDetailPage";

import InvitesPage from "../features/invites/InvitesPage";
import ComputerVisionPage from "../features/computer-vision/ComputerVisionPage";
import ReportsPage from "../features/report/ReportsPage";

import { useAppStore } from "../state/store";

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
  const location = useLocation();

  // Hide top nav on onboarding/auth pages
  const hideNav =
    location.pathname === "/get-started" ||
    location.pathname === "/profile/setup" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

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
          background: theme.surface,
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
          CrowdFest Admin
        </div>

        {!hideNav && (
          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/computer-vision" label="Vision" />
            <NavItem to="/events" label="Events" />
            <NavItem to="/invites" label="Invites" />
            <NavItem to="/reports" label="Reports" />
            <NavItem to="/profile" label="Profile" />
          </nav>
        )}
      </header>

      <main style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}

/* ---------- Persist Hydration Gate ---------- */
/**
 * If your store uses zustand/persist, the persisted state is rehydrated async.
 * During that moment, organizerProfile can be undefined and redirects can loop.
 *
 * This hook waits until hydration finishes (if persist exists).
 * If persist is not used, it resolves immediately.
 */
function useHydratedStore() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const anyStore = useAppStore as any;

    // No persist? consider hydrated immediately
    if (!anyStore.persist?.hasHydrated || !anyStore.persist?.onFinishHydration) {
      setHydrated(true);
      return;
    }

    // Already hydrated
    if (anyStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    // Wait for hydration
    const unsub = anyStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  return hydrated;
}

/* ---------- Guard ---------- */
function RequireOutOfField({ children }: { children: React.ReactNode }) {
  const hydrated = useHydratedStore();
  const profile = useAppStore((s) => s.organizerProfile);
  const location = useLocation();

  // ⛔ Don't route/redirect until store is ready (prevents white-screen loops)
  if (!hydrated) return null;

  // ✅ Always allow onboarding/auth pages
  if (
    location.pathname === "/get-started" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/profile/setup" ||
    location.pathname === "/profile"
  ) {
    return <>{children}</>;
  }

  // No profile? send to get-started
  if (!profile) return <Navigate to="/get-started" replace />;

  // Wrong role? force setup
  if (profile.role !== "OUT_OF_FIELD") {
    return <Navigate to="/profile/setup" replace />;
  }

  return <>{children}</>;
}

/* ---------- Root Redirect ---------- */
function RootRedirect() {
  const hydrated = useHydratedStore();
  const profile = useAppStore((s) => s.organizerProfile);

  if (!hydrated) return null;

  return profile ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/get-started" replace />
  );
}

/* ---------- Router ---------- */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <RequireOutOfField>
          <Routes>
            {/* Root */}
            <Route path="/" element={<RootRedirect />} />

            {/* Onboarding / Auth */}
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Profile */}
            <Route path="/profile/setup" element={<ProfileSetupPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Vision */}
            <Route path="/computer-vision" element={<ComputerVisionPage />} />

            {/* Events */}
            <Route path="/events" element={<EventHomePage />} />
            <Route path="/events/new" element={<CreateEventPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />

            {/* Invites */}
            <Route path="/invites" element={<InvitesPage />} />
            <Route path="/events/:eventId/invites" element={<InvitesPage />} />

            {/* Reports */}
            <Route path="/reports" element={<ReportsPage />} />

            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </RequireOutOfField>
      </AppShell>
    </BrowserRouter>
  );
}
