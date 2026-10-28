"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, ExternalLink, MapPin, UsersRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ErrorState, formatEventDate, ImageWithFallback, LoadingState, SiteFooter, SiteHeader } from "@/components/site";
import { cancelMyRegistration, CommunityApiError, getMyEventRegistration, getPublicEvent, registerForEvent, type CommunityEvent } from "@/lib/api";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [registrationCheckKey, setRegistrationCheckKey] = useState("");

  useEffect(() => {
    if (!params.id) return;
    getPublicEvent(params.id)
      .then((response) => setEvent(response.event))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "This event could not be loaded."))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!user || !params.id) return;
    getMyEventRegistration(user, params.id)
      .then((response) => {
        setRegistrationStatus(response.registration.status);
        setRegistrationCheckKey(`${user.uid}:${params.id}`);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof CommunityApiError && reason.status === 404)) {
          setRegistrationError(reason instanceof Error ? reason.message : "Registration status could not be checked.");
        }
        setRegistrationStatus("");
        setRegistrationCheckKey(`${user.uid}:${params.id}`);
      });
  }, [user, params.id]);

  async function register() {
    if (!user || !event) return;
    setRegistering(true);
    setMessage("");
    setRegistrationError("");
    try {
      const response = await registerForEvent(user, event.id);
      setRegistrationStatus("registered");
      setRegistrationCheckKey(`${user.uid}:${event.id}`);
      setMessage(response.registration.paymentNote || "You are registered for this event.");
      setEvent((current) => current ? { ...current, registrationCount: current.registrationCount + 1 } : current);
    } catch (reason) {
      setRegistrationError(reason instanceof Error ? reason.message : "Registration could not be completed.");
    } finally {
      setRegistering(false);
    }
  }

  async function cancelRegistration() {
    if (!user || !event || !window.confirm("Cancel your registration for this event?")) return;
    setRegistering(true);
    setRegistrationError("");
    try {
      await cancelMyRegistration(user, event.id);
      setRegistrationStatus("cancelled");
      setRegistrationCheckKey(`${user.uid}:${event.id}`);
      setEvent((current) => current ? { ...current, registrationCount: Math.max(0, current.registrationCount - 1) } : current);
      setMessage("Your registration was cancelled.");
    } catch (reason) {
      setRegistrationError(reason instanceof Error ? reason.message : "Registration could not be cancelled.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <div className="content-wrap">
          <Link className="button-link" href="/events"><ArrowLeft size={15} /> Back to events</Link>
          {loading ? <LoadingState label="Loading event" /> : error ? <ErrorState message={error} /> : event ? (
            <div className="detail-layout" style={{ marginTop: 22 }}>
              <article className="detail-main">
                <div className="detail-cover"><ImageWithFallback className="event-image" src={event.coverImageUrl} alt={`${event.title} event`} /></div>
                {event.status === "cancelled" && <div className="notice notice-error">This event has been cancelled by the organizer.</div>}
                <p className="section-kicker" style={{ marginTop: 24 }}>{event.category.replaceAll("_", " ")}</p>
                <h1>{event.title}</h1>
                <div className="organizer-name">
                  {event.organizer?.verified && <CheckCircle2 size={15} />}
                  {event.organizer?.name || "Fitness Species organizer"}
                  {event.organizer?.verified && <span>· Verified</span>}
                </div>
                <div className="dashboard-panel" style={{ marginTop: 25 }}>
                  <h2>About this event</h2>
                  <p className="detail-description">{event.description}</p>
                  {event.eligibility && <><h3>Who can participate</h3><p className="detail-description">{event.eligibility}</p></>}
                  {event.instructions && <><h3>Participation instructions</h3><p className="detail-description">{event.instructions}</p></>}
                </div>
                {event.organizer?.website && <a className="button-link" href={event.organizer.website} target="_blank" rel="noreferrer">Organizer website <ExternalLink size={14} /></a>}
              </article>

              <aside className="detail-aside">
                <h2>Event details</h2>
                <Fact icon={<CalendarDays size={17} />} label="Starts" value={formatEventDate(event.startAt, event.timeZone)} />
                <Fact icon={<Clock3 size={17} />} label="Ends" value={formatEventDate(event.endAt, event.timeZone)} />
                <Fact icon={<MapPin size={17} />} label={event.venueType === "online" ? "Format" : event.venueName || "Venue"} value={event.venueType === "online" ? "Online event" : [event.address, event.city, event.postalCode].filter(Boolean).join(", ")} />
                {event.venueType === "in_person" && event.address && (
                  <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venueName, event.address, event.city, event.postalCode].filter(Boolean).join(", "))}`} target="_blank" rel="noreferrer">Get directions <ExternalLink size={13} /></a>
                )}
                {event.capacity !== null && <Fact icon={<UsersRound size={17} />} label="Places" value={`${Math.max(event.capacity - event.registrationCount, 0)} of ${event.capacity} remaining`} />}
                <Fact icon={<CheckCircle2 size={17} />} label="Price" value={event.pricingType === "free" ? "Free" : `${event.currency} ${event.amount}`} />
                {event.registrationDeadline && <Fact icon={<Clock3 size={17} />} label="Register by" value={formatEventDate(event.registrationDeadline, event.timeZone)} />}
                {message && <div className="notice notice-success" role="status">{message}</div>}
                {registrationError && <ErrorState message={registrationError} />}
                {event.status !== "cancelled" && (
                  user ? registrationCheckKey !== `${user.uid}:${event.id}` ? (
                    <button className="button button-dark button-wide" disabled>Checking registration…</button>
                  ) : registrationStatus === "registered" ? (
                    <button className="button button-outline button-wide" disabled={registering} onClick={() => void cancelRegistration()}>
                      {registering ? "Cancelling…" : "Cancel my registration"}
                    </button>
                  ) : event.capacity !== null && event.registrationCount >= event.capacity ? (
                    <button className="button button-outline button-wide" disabled>Event is full</button>
                  ) : (
                    <button className="button button-dark button-wide" disabled={registering} onClick={() => void register()}>
                      {registering ? "Registering…" : registrationStatus === "cancelled" ? "Register again" : "Register for this event"}
                    </button>
                  ) : (
                    <Link className="button button-dark button-wide" href={`/login?next=${encodeURIComponent(`/events/${event.id}`)}`}>Sign in to register</Link>
                  )
                )}
                {event.pricingType === "paid" && <p className="form-help" style={{ marginTop: 12 }}>Event registration does not confirm an external payment. Follow the organizer’s instructions.</p>}
                {event.externalRegistrationUrl && (
                  <a className="button button-outline button-wide" style={{ marginTop: 9 }} href={event.externalRegistrationUrl} target="_blank" rel="noreferrer">External registration <ExternalLink size={14} /></a>
                )}
              </aside>
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="detail-fact">{icon}<div><strong>{label}</strong><span>{value || "To be announced"}</span></div></div>;
}
