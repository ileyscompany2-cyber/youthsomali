"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [state, setState] = useState<{ status: "idle" | "sending" | "success" | "error"; message: string }>({ status: "idle", message: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState({ status: "sending", message: "" });
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, phone: values.phone || null }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string; fields?: Record<string, string[]> };
        throw new Error(result.error || "We could not submit your message. Please try again.");
      }
      form.reset();
      setState({ status: "success", message: "Thank you. Your message has been received by YPP." });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "The request could not be completed." });
    }
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="form-grid">
        <label>Full name *<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>
        <label>Email address *<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>Phone number (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
        <label>Subject *<input name="subject" minLength={3} maxLength={180} required /></label>
        <label className="form-wide">Your message *<textarea name="message" rows={6} minLength={10} maxLength={5000} required /></label>
        <label className="honeypot" aria-hidden="true">Leave this blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <button className="button button-primary" type="submit" disabled={state.status === "sending"}>{state.status === "sending" ? "Sending…" : "Send message"}</button>
      <p className={`form-status ${state.status}`} role="status" aria-live="polite">{state.message}</p>
    </form>
  );
}
