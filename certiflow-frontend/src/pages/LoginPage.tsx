import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Fingerprint, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/http";

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try { await signIn(email, password); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="login-screen">
      <section className="login-visual">
        <div className="login-brand"><div className="brand-mark"><ShieldCheck size={22} /></div><strong>CertiFlow</strong></div>
        <div className="visual-content">
          <div className="eyebrow light"><span /> DIGITAL CREDENTIAL OPERATIONS</div>
          <h1>Every achievement.<br /><em>Verified.</em> Trusted.</h1>
          <p>A single, secure workflow for training records, multi-level approvals, and digital certificates.</p>
          <div className="visual-points">
            <div><CheckCircle2 size={17} /> Structured approval workflow</div>
            <div><CheckCircle2 size={17} /> Secure QR-based credentials</div>
            <div><CheckCircle2 size={17} /> Complete activity traceability</div>
          </div>
        </div>
        <div className="visual-footer"><span>© {new Date().getFullYear()} CertiFlow</span><span>Secure operations platform</span></div>
        <div className="visual-orb orb-one" /><div className="visual-orb orb-two" />
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="mobile-login-brand"><div className="brand-mark"><ShieldCheck size={21} /></div><strong>CertiFlow</strong></div>
          <div className="login-heading"><div className="eyebrow">WELCOME BACK</div><h2>Sign in to your workspace</h2><p>Enter your account details to continue.</p></div>
          <form onSubmit={submit} className="login-form">
            <label>Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.com" required autoComplete="username" />
            <div className="password-label"><label>Password</label><span>Protected access</span></div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button login-submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"} <ArrowRight size={17} /></button>
          </form>
          <div className="login-security"><Fingerprint size={17} /><span>Your session is protected with authenticated access.</span></div>
          <p className="login-help">Need access? Contact your CertiFlow administrator.</p>
        </div>
      </section>
    </div>
  );
}
