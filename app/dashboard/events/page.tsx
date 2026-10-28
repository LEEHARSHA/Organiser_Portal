"use client";

import Link from "next/link";
import { Copy, ExternalLink, Plus, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useDashboard } from "@/components/dashboard-context";
import { ErrorState, LoadingState, StatusBadge } from "@/components/site";
import { cancelEvent, getMyEvents, submitEvent, type CommunityEvent } from "@/lib/api";

export default function ManageEventsPage() {
  const { user } = useAuth();
  const { organizer } = useDashboard();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!user) return;
    getMyEvents(user, status || undefined, page, 20)
      .then((response) => {
        setEvents(response.events);
        setTotal(response.total);
        setError("");
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Events could not be loaded."))
      .finally(() => setLoading(false));
  }, [user, status, page]);

  const filtered = events.filter((event) => event.title.toLowerCase().includes(search.toLowerCase()));

  async function submitForReview(event: CommunityEvent) {
    if (!user) return;
    setBusyId(event.id);
    setError("");
    setNotice("");
    try {
      const response = await submitEvent(user, event.id);
      setEvents((current) => current.map((item) => item.id === event.id ? response.event : item));
      setNotice("Event submitted. It will remain hidden until approved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Event could not be submitted.");
    } finally {
      setBusyId("");
    }
  }

  async function cancel(event: CommunityEvent) {
    if (!user || !window.confirm(`Cancel “${event.title}”? Participants will no longer be able to register.`)) return;
    setBusyId(event.id);
    setError("");
    setNotice("");
    try {
      const response = await cancelEvent(user, event.id);
      setEvents((current) => current.map((item) => item.id === event.id ? response.event : item));
      setNotice("Event cancelled. Its public page will show the cancelled status.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Event could not be cancelled.");
    } finally {
      setBusyId("");
    }
  }

  async function copyPublicLink(event: CommunityEvent) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
      setNotice("Public event link copied.");
      setError("");
    } catch {
      setError("Could not copy the link. Open the public event page and copy its address.");
    }
  }

  if (loading) return <LoadingState label="Loading your events" />;
  return <>
    <div className="page-top-row"><div><p className="section-kicker">Your community</p><h1>My events</h1></div>
      {organizer?.status === "approved" && <Link className="button button-dark" href="/dashboard/events/new"><Plus size={16} /> Create event</Link>}
    </div>
    {error && <ErrorState message={error} />}
    {notice && <div className="notice notice-success" role="status">{notice}</div>}
    {!organizer && <div className="notice notice-info">Submit an organizer application before managing events.</div>}
    {organizer && organizer.status !== "approved" && <div className="notice notice-info">Your organizer status is <StatusBadge status={organizer.status} />. Event creation and submission require approval.</div>}
    <div className="filters-secondary">
      <label htmlFor="event-search" className="sr-only">Search your events</label>
      <input id="event-search" className="field" style={{ maxWidth: 260 }} placeholder="Search events" value={search} onChange={(event) => setSearch(event.target.value)} />
      <label htmlFor="status-filter" className="sr-only">Filter by status</label>
      <select id="status-filter" className="select" style={{ maxWidth: 200 }} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
        <option value="">All statuses</option>
        {["draft", "pending_review", "approved", "changes_requested", "rejected", "cancelled", "completed"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
      </select>
      <span>{total} {total === 1 ? "event" : "events"}</span>
    </div>
    {filtered.length ? <div className="dashboard-panel table-scroll">
      <table className="dashboard-table">
        <thead><tr><th>Event</th><th>Date</th><th>Registrations</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map((event) => <tr key={event.id}>
          <td><strong>{event.title}</strong><div className="form-help">{event.city || "Online"} · {event.category}</div>{event.reviewNote && <div className="form-help" style={{ color: "#8d2926" }}>{event.reviewNote}</div>}</td>
          <td>{new Date(event.startAt).toLocaleDateString()}</td>
          <td>{event.registrationCount}{event.capacity ? ` / ${event.capacity}` : ""}</td>
          <td><StatusBadge status={event.status} /></td>
          <td><div className="table-actions">
            {["draft", "rejected", "changes_requested", "approved"].includes(event.status) && <Link className="action-link" href={`/dashboard/events/${event.id}/edit`}>Edit</Link>}
            <Link className="action-link" href={`/dashboard/registrations?eventId=${encodeURIComponent(event.id)}`}>View registrations</Link>
            {["draft", "rejected", "changes_requested"].includes(event.status) && <button className="action-link" disabled={busyId === event.id || organizer?.status !== "approved"} title="Submit for admin review" onClick={() => void submitForReview(event)}><Send size={14} aria-label="Submit for review" /></button>}
            {["draft", "pending_review", "approved"].includes(event.status) && <button className="action-link action-link-danger" disabled={busyId === event.id} onClick={() => void cancel(event)}><XCircle size={14} aria-label="Cancel event" /></button>}
            {["approved", "cancelled"].includes(event.status) && <button className="action-link" onClick={() => void copyPublicLink(event)}><Copy size={14} aria-label="Copy public link" /></button>}
            {["approved", "cancelled"].includes(event.status) && <Link className="action-link" href={`/events/${event.id}`} aria-label="Open public event"><ExternalLink size={14} /></Link>}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div> : <div className="empty-state"><span className="empty-icon"><Plus size={20} /></span><h3>No events to show</h3><p>Create a draft event after your organizer application is approved.</p>{organizer?.status === "approved" && <Link className="button button-dark button-small" href="/dashboard/events/new">Create event</Link>}</div>}
    {total > 20 && <div className="form-actions" style={{ justifyContent: "center" }}>
      <button className="button button-outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
      <span>Page {page} of {Math.ceil(total / 20)}</span>
      <button className="button button-outline" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((current) => current + 1)}>Next</button>
    </div>}
  </>;
}
