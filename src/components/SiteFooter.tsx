import Link from "next/link";
import Image from "next/image";

type SiteSettings = { email: string; phone: string; location: string };

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-about"><Link className="brand footer-brand" href="/"><Image className="brand-logo" src="/images/ypp-logo.png" alt="" width={50} height={50} /><span className="brand-name">YOUTH FOR PEACE<small>AND PROSPEROUS · SOMALIA</small></span></Link>
          <p>A youth-led organization working alongside young people and communities for peace, inclusion, and prosperity.</p>
        </div>
        <div><h2>Explore</h2><ul><li><Link href="/about">About YPP</Link></li><li><Link href="/programs">Programs</Link></li><li><Link href="/projects">Projects</Link></li><li><Link href="/news">News and updates</Link></li><li><Link href="/events">Events</Link></li></ul></div>
        <div><h2>More</h2><ul><li><Link href="/gallery">Gallery</Link></li><li><Link href="/team">Our team</Link></li><li><Link href="/partners">Partners</Link></li><li><Link href="/reports">Reports</Link></li><li><Link href="/privacy">Privacy policy</Link></li></ul></div>
        <div><h2>Contact</h2><ul><li>{settings.location}</li><li><a href={`mailto:${settings.email}`}>{settings.email}</a></li><li><a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}>{settings.phone}</a></li><li><Link href="/terms">Terms and conditions</Link></li></ul></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Youth for Peace and Prosperous. All rights reserved.</span><span>Established 5 February 2017</span></div>
    </footer>
  );
}
