import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity, BadgeCheck, Bell, ChevronDown, ClipboardList, FilePlus2,
  LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

const roleNames: Record<UserRole, string> = {
  TRAINING_CENTRE: "Training Centre",
  DISTRICT_OFFICER: "District Officer",
  QUALITY_OFFICER: "Quality Officer",
  STATE_OFFICER: "State Officer",
};

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/", label: "Overview", icon: LayoutDashboard, roles: ["TRAINING_CENTRE", "DISTRICT_OFFICER", "QUALITY_OFFICER", "STATE_OFFICER"] },
    { to: "/batches", label: "Batches", icon: ClipboardList, roles: ["TRAINING_CENTRE", "DISTRICT_OFFICER", "QUALITY_OFFICER", "STATE_OFFICER"] },
    { to: "/create-batch", label: "Create batch", icon: FilePlus2, roles: ["TRAINING_CENTRE"] },
    { to: "/review", label: "Review queue", icon: ClipboardList, roles: ["DISTRICT_OFFICER", "QUALITY_OFFICER", "STATE_OFFICER"] },
    { to: "/certificates", label: "Certificates", icon: BadgeCheck, roles: ["STATE_OFFICER"] },
  ].filter((item) => item.roles.includes(user?.role ?? ""));

  const title = location.pathname === "/" ? "Overview"
    : location.pathname.startsWith("/create-batch") ? "Create batch"
    : location.pathname.startsWith("/certificates") ? "Certificates"
    : location.pathname.startsWith("/batches/") ? "Batch details" : "Batches";

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={21} /></div>
          <div><strong>CertiFlow</strong><span>Certificate operations</span></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Activity size={17} /></div>
            <strong>Workflow status</strong>
            <p>Manage submissions and approvals in one place.</p>
          </div>
          <div className="profile-row">
            <div className="avatar">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</div>
            <div className="profile-copy"><strong>{user?.name ?? "User"}</strong><span>{roleNames[user?.role ?? "TRAINING_CENTRE"]}</span></div>
            <button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div><div className="breadcrumb">Workspace <span>/</span> {title}</div><h1>{title}</h1></div>
          </div>
          <div className="topbar-right">
            <div className="system-pill"><span className="live-dot" /> System operational</div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="top-user"><div className="avatar avatar-small">{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</div><ChevronDown size={15} /></div>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
