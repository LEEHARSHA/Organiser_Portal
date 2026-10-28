"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Menu, Users, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { CommunityEvent, EventStatus, OrganizerStatus } from "@/lib/api";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  async function handleSignOut() {
    setSignOutError("");
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Sign out failed.");
    }
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Fitness Species Community home">
          <span className="brand-mark">FS</span>
          <span className="brand-name">fitness species <b>community</b></span>
        </Link>
        <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav${open ? " is-open" : ""}`} aria-label="Main navigation">
          <Link href="/events" onClick={() => setOpen(false)}>Explore events</Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="nav-dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
              <button className="text-button" onClick={() => void handleSignOut()}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
              <Link className="button button-dark button-small" href="/organizer/apply" onClick={() => setOpen(false)}>
                Become an organizer <ArrowRight size={15} />
              </Link>
            </>
          )}
        </nav>
      </div>
      {signOutError && <div className="notice notice-error" role="alert" style={{ margin: "0 auto 10px", maxWidth: 1200 }}>{signOutError}</div>}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link className="brand brand-footer" href="/">
            <span className="brand-mark">FS</span>
            <span className="brand-name">fitness species <b>community</b></span>
          </Link>
          <p>Making local movement easier to find, join, and grow.</p>
        </div>
        <div className="footer-links">
          <Link href="/events">Explore events</Link>
          <Link href="/organizer/apply">For organizers</Link>
          <Link href="/contact">Contact support</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <span className="copyright">© {new Date().getFullYear()} Fitness Species</span>
      </div>
    </footer>
  );
}

export function EventCard({ event }: { event: CommunityEvent }) {
  return (
    <article className="event-card">
      <Link className="event-image-link" href={`/events/${encodeURIComponent(event.id)}`}>
        <ImageWithFallback src={event.coverImageUrl} alt="" className="event-image" />
        <span className="image-category">{event.category.replaceAll("_", " ")}</span>
      </Link>
      <div className="event-card-content">
        <div className="event-date-line"><CalendarDays size={15} /> {formatEventDate(event.startAt, event.timeZone)}</div>
        <h3><Link href={`/events/${encodeURIComponent(event.id)}`}>{event.title}</Link></h3>
        <p className="event-card-meta"><MapPin size={15} /> {event.city || event.venueName || "Online"}</p>
        <div className="event-card-bottom">
          <OrganizerName event={event} />
          <span className="price-tag">{event.pricingType === "free" ? "Free" : `${event.currency} ${event.amount}`}</span>
        </div>
      </div>
    </article>
  );
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    return <div className={`image-fallback ${className}`} role="img" aria-label={alt || "Event image unavailable"}>FS</div>;
  }
  return (
    // External event images are not fetched or proxied by the server.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
  );
}

export function OrganizerName({ event }: { event: CommunityEvent }) {
  return (
    <span className="organizer-name">
      {event.organizer?.verified && <CheckCircle2 size={14} aria-label="Verified organizer" />}
      {event.organizer?.name || "Fitness Species organizer"}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrganizerStatus | EventStatus }) {
  const text: Record<string, string> = {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    changes_requested: "Changes requested",
    draft: "Draft",
    pending_review: "Pending review",
    cancelled: "Cancelled",
    completed: "Completed",
  };
  return <span className={`status-badge status-${status}`}>{text[status] || status}</span>;
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}…</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="notice notice-error" role="alert">{message}</div>;
}

export function EmptyEvents({ title = "No events found", detail = "Try another search or check back soon." }: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Users size={21} /></span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}

export function formatEventDate(value: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString("en-IN");
  }
}

export function categoryLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
