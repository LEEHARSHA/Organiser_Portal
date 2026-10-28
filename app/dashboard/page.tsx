"use client";

import Link from "next/link";
import { ArrowRight, CalendarPlus, CircleCheck, Clock3, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useDashboard } from "@/components/dashboard-context";
import { ErrorState, LoadingState, StatusBadge } from "@/components/site";
import { getMyEvents, getOrganizerSummary, type CommunityEvent } from "@/lib/api";

type Summary = {
  totalEvents: number;
  upcomingEvents: number;
  registrations: number;
  completedEvents: number;
  pendingReviewEvents: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { organizer, organizerError, organizerLoading } = useDashboard();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([getOrganizerSummary(user), getMyEvents(user)])
      .then(([summaryResponse, eventsResponse]) => {
        setSummary(summaryResponse.summary);
        setEvents(eventsResponse.events.slice(0, 5));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Dashboard details could not be loaded."))
      .finally(() => setLoading(false));
  }, [user]);

  if (organizerLoading || loading) return <LoadingState label="Loading dashboard" />;
  return (
    <>
      <p className="section-kicker">Organizer workspace</p>
      <h1>Good to see you{organizer?.contactName ? `, ${organizer.contactName.split(" ")[0]}` : ""}.</h1>
      <p className="dashboard-subtitle">Your events and community activity at a glance.</p>
      {organizerError && <ErrorState message={organizerError} />}
      {error && <ErrorState message={error} />}

      {!organizer && <div className="notice notice-info">
        <strong>Start with an organizer application.</strong> You’ll need approval before creating event drafts.
        <div style={{ marginTop: 13 }}><Link className="button button-dark button-small" href="/organizer/apply">Apply to organize <ArrowRight size={14} /></Link></div>
      </div>}
      {organizer && organizer.status !== "approved" && <div className={`notice ${organizer.status === "rejected" ? "notice-error" : "notice-info"}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><strong>Organizer application</strong><StatusBadge status={organizer.status} /></div>
        <p>{organizer.status === "pending" ? "Your application is being reviewed. Event creation becomes available after approval." : organizer.status === "rejected" ? "Your application needs changes before it can be approved." : "The review team has requested additional changes."}</p>
        {organizer.reviewNote && <p><strong>Review note:</strong> {organizer.reviewNote}</p>}
        {(organizer.status === "rejected" || organizer.status === "changes_requested") && <Link className="button button-outline button-small" href="/organizer/apply">Update application</Link>}
      </div>}

      {summary && <>
        <div className="metric-grid">
          <Metric icon={<CalendarPlus size={16} />} label="Total events" value={summary.totalEvents} />
          <Metric icon={<Clock3 size={16} />} label="Upcoming events" value={summary.upcomingEvents} />
          <Metric icon={<Users size={16} />} label="Registrations" value={summary.registrations} />
          <Metric icon={<CircleCheck size={16} />} label="Completed events" value={summary.completedEvents} />
        </div>
        {organizer?.status === "approved" && <div className="split-heading">
          <h2>Recent events</h2>
          <Link className="button-link" href="/dashboard/events">Manage events <ArrowRight size={14} /></Link>
        </div>}
        {organizer?.status === "approved" && <div className="dashboard-panel">
          {events.length ? <div className="table-scroll"><table className="dashboard-table">
            <thead><tr><th>Event</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{events.map((event) => <tr key={event.id}><td><Link className="button-link" href={`/dashboard/events/${event.id}/edit`}>{event.title}</Link></td><td>{new Date(event.startAt).toLocaleDateString()}</td><td><StatusBadge status={event.status} /></td></tr>)}</tbody>
          </table></div> : <p className="table-empty">No events yet. Create a draft when you’re ready.</p>}
          <div style={{ marginTop: 16 }}><Link className="button button-dark button-small" href="/dashboard/events/new">Create an event</Link></div>
        </div>}
      </>}
    </>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="metric-card"><span style={{ display: "flex", alignItems: "center", gap: 6 }}>{icon}{label}</span><strong>{value}</strong></div>;
}
