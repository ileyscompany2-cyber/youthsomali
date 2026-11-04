import Link from "next/link";

export default function NotFound() {
  return <main className="not-found"><p className="eyebrow">Page not found</p><h1>This page is not available.</h1><p>The page may have moved or may not have been published.</p><Link className="button button-primary" href="/">Return to YPP home</Link></main>;
}
