"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const links = [
  ["About", "/about"],
  ["Programs", "/programs"],
  ["Projects", "/projects"],
  ["News", "/news"],
  ["Events", "/events"],
  ["Gallery", "/gallery"],
  ["Our team", "/team"],
  ["Partners", "/partners"],
  ["Reports", "/reports"],
  ["Contact", "/contact"],
] as const;

type SiteSettings = { email: string; phone: string; location: string };

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="topbar"><div className="container topbar-inner">
        <span>{settings.location}</span>
        <a href={`mailto:${settings.email}`}>{settings.email}</a>
        <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a>
      </div></div>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="Youth for Peace and Prosperous home">
            <Image className="brand-logo" src="/images/ypp-logo.png" alt="" width={50} height={50} priority />
            <span className="brand-name">YOUTH FOR PEACE<small>AND PROSPEROUS · SOMALIA</small></span>
          </Link>
          <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(value => !value)}>
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
          <nav id="primary-navigation" className={`primary-nav${open ? " is-open" : ""}`} aria-label="Main navigation">
            {links.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}
            <Link className="nav-cta" href="/admin/login" onClick={() => setOpen(false)}>Sign in <ArrowRight size={15} /></Link>
          </nav>
        </div>
      </header>
    </>
  );
}
