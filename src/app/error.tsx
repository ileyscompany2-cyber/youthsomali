"use client";

/* Renders a branded, actionable state for unexpected page-rendering failures. */
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="system-error" role="alert">
      <div className="system-error-card">
        <p className="eyebrow">Youth for Peace and Prosperous</p>
        <h1>We could not load this page</h1>
        <p>The requested YPP content is temporarily unavailable. Please try again.</p>
        {error.digest && <p className="error-reference">Reference: {error.digest}</p>}
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={reset}>Try again</button>
          <Link className="button button-quiet" href="mailto:youthforpeace15@gmail.com">Contact YPP</Link>
        </div>
      </div>
    </main>
  );
}
