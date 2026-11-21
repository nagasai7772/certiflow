import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export default function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-center">Loading CertiFlow...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
