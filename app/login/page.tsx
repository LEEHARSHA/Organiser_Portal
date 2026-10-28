"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { SiteFooter, SiteHeader } from "@/components/site";

function LoginForm() {
  const { user, loading, configError, signIn, signUp, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    const safeNext = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/dashboard";
    if (!loading && user) router.replace(safeNext);
  }, [loading, user, router, next]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (creatingAccount && password.length < 6) {
        throw new Error("Choose a password with at least 6 characters.");
      }
      if (creatingAccount) await signUp(email, password);
      else await signIn(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    setError("");
    setSuccess("");
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    try {
      await resetPassword(email);
      setSuccess("If an account exists for that address, a password reset email has been sent.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "A reset email could not be sent.");
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="section-kicker">Organizer access</p>
        <h1>{creatingAccount ? "Create your account." : "Welcome back."}</h1>
        <p>{creatingAccount ? "Create a Fitness Species account, then apply to organize a community event." : "Sign in with your Fitness Species account to manage your organizer application and events."}</p>
        {configError && <div className="notice notice-error" role="alert">{configError}. Add the public Firebase web settings before enabling sign-in.</div>}
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        {success && <div className="notice notice-success" role="status">{success}</div>}
        <form onSubmit={submit}>
          <div className="form-field"><label htmlFor="email">Email address</label><input className="field" type="email" id="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="form-field"><label htmlFor="password">Password</label><input className="field" type="password" id="password" autoComplete={creatingAccount ? "new-password" : "current-password"} minLength={creatingAccount ? 6 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <button className="button button-dark button-wide" disabled={busy || Boolean(configError)}>{busy ? (creatingAccount ? "Creating account…" : "Signing in…") : (creatingAccount ? "Create account" : "Sign in")}</button>
        </form>
        <div className="login-footer">
          {creatingAccount
            ? <button className="link-button" type="button" onClick={() => { setCreatingAccount(false); setError(""); }}>Already have an account?</button>
            : <button className="link-button" type="button" onClick={() => void sendReset()}>Forgot password?</button>}
          {!creatingAccount
            ? <button className="link-button" type="button" onClick={() => { setCreatingAccount(true); setError(""); }}>Create an account</button>
            : <span className="form-help">After creating your account, continue to the organizer application.</span>}
        </div>
        {loading && <p className="form-help" role="status" style={{ marginTop: 14 }}>Checking your saved session…</p>}
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <><SiteHeader /><Suspense fallback={<main className="auth-wait">Loading sign-in…</main>}><LoginForm /></Suspense><SiteFooter /></>;
}
