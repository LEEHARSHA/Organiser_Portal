"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { EventForm } from "@/components/event-form";
import { useDashboard } from "@/components/dashboard-context";
import { ErrorState, LoadingState } from "@/components/site";

export default function NewEventPage() {
  const { user } = useAuth();
  const { organizer, organizerError, organizerLoading } = useDashboard();
  if (organizerLoading) return <LoadingState label="Checking organizer approval" />;
  if (organizerError) return <ErrorState message={organizerError} />;
  if (!organizer || organizer.status !== "approved") {
    return <><h1>Create an event</h1><div className="notice notice-info">Only approved organizers can create event drafts. Your application status is shown in the dashboard.</div><Link className="button button-outline" href="/dashboard">Back to dashboard</Link></>;
  }
  if (!user) return null;
  return <><p className="section-kicker">Event creation</p><h1>Create an event draft</h1><p className="dashboard-subtitle">New events stay private until they have been submitted and approved.</p><div className="dashboard-panel"><EventForm user={user} /></div></>;
}
