"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed. Try again.");
      setPending(false);
    }
  }

  return (
    <main className="login-page"><section className="login-card">
      <Link className="login-back" href="/">← Back to YPP website</Link>
      <p className="eyebrow">Administrator access</p><h1>Sign in to YPP</h1>
      <p className="muted">Use your authorized YPP administrator account.</p>
      <form className="form-card login-form" onSubmit={submit}>
        <label>Email address<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={200} /></label>
        {error && <p className="form-status error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in securely"}</button>
      </form>
      <p className="microcopy">Access is provisioned by YPP administrators. If you need access, contact your system administrator.</p>
    </section></main>
  );
}
