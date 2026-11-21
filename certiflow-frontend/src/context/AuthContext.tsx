import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "../types";
import { loginRequest } from "../services/auth.service";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("certiflow_user");
    return stored ? JSON.parse(stored) as User : null;
  });
  const [loading] = useState(false);

  const signIn = async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    localStorage.setItem("certiflow_token", result.token);
    localStorage.setItem("certiflow_user", JSON.stringify(result.user));
    setUser(result.user);
  };

  const signOut = () => {
    localStorage.removeItem("certiflow_token");
    localStorage.removeItem("certiflow_user");
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
