"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { EventForm } from "@/components/event-form";
import { useDashboard } from "@/components/dashboard-context";
import { ErrorState, LoadingState, StatusBadge } from "@/components/site";
import { getMyEvent, type CommunityEvent } from "@/lib/api";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { organizer } = useDashboard();
  const [event, setEvent] = useState<CommunityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user || !params.id) return;
    getMyEvent(user, params.id)
      .then((response) => setEvent(response.event))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Event could not be loaded."))
      .finally(() => setLoading(false));
  }, [user, params.id]);
  if (loading) return <LoadingState label="Loading event" />;
  if (error) return <ErrorState message={error} />;
  if (!user || !event) return null;
  if (organizer?.status !== "approved") return <div className="notice notice-error">An approved organizer account is required to edit events.</div>;
  if (["pending_review", "cancelled", "completed"].includes(event.status)) {
    return <><h1>{event.title}</h1><p className="dashboard-subtitle"><StatusBadge status={event.status} /></p><div className="notice notice-info">This event can’t be edited while it is {event.status.replaceAll("_", " ")}.</div><Link className="button button-outline" href="/dashboard/events">Back to events</Link></>;
  }
  return <><p className="section-kicker">Manage event · <StatusBadge status={event.status} /></p><h1>Edit event</h1><p className="dashboard-subtitle">Changes to a published event are sent back for review.</p><div className="dashboard-panel"><EventForm key={event.id} user={user} initialEvent={event} /></div></>;
}
