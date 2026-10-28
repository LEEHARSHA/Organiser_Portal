"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useDashboard } from "@/components/dashboard-context";
import { ErrorState, LoadingState } from "@/components/site";
import { getEventRegistrations, getMyEvents, type CommunityEvent } from "@/lib/api";

type Registration = {
  id: string;
  participantName: string;
  email?: string;
  phone?: string;
  status: string;
  registeredAt: string;
};

export default function RegistrationsPage() {
  const { user } = useAuth();
  const { organizer } = useDashboard();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationTotal, setRegistrationTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const authenticatedUser = user;
    async function loadEvents() {
      const firstPage = await getMyEvents(authenticatedUser, undefined, 1, 100);
      const remainingPages = await Promise.all(
        Array.from(
          { length: Math.max(0, Math.ceil(firstPage.total / 100) - 1) },
          (_, index) => getMyEvents(authenticatedUser, undefined, index + 2, 100),
        ),
      );
      return [...firstPage.events, ...remainingPages.flatMap((response) => response.events)];
    }

    loadEvents()
      .then((organizerEvents) => {
        setEvents(organizerEvents);
        const requestedEventId = new URLSearchParams(window.location.search).get("eventId");
        const selectedEvent = organizerEvents.find((event) => event.id === requestedEventId)
          || organizerEvents[0];
        setListLoading(Boolean(selectedEvent));
        setSelectedId(selectedEvent?.id || "");
      })
      .catch((reason: unknown) => {
        setEvents([]);
        setError(reason instanceof Error ? reason.message : "Events could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || !selectedId || organizer?.status !== "approved") {
      return;
    }
    let active = true;
    getEventRegistrations(user, selectedId, page)
      .then((response) => {
        if (!active) return;
        setRegistrations(response.registrations);
        setRegistrationTotal(response.total);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setRegistrations([]);
        setRegistrationTotal(0);
        setError(reason instanceof Error ? reason.message : "Registrations could not be loaded.");
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, selectedId, organizer?.status, page]);

  const selectedEvent = events.find((event) => event.id === selectedId);

  if (loading) return <LoadingState label="Loading registration overview" />;
  if (organizer?.status !== "approved") return <><h1>Registrations</h1><div className="notice notice-info">Registration details are available to approved organizers only.</div></>;
  return <>
    <p className="section-kicker">Participant list</p><h1>Registrations</h1>
    <p className="dashboard-subtitle">View the participants registered for each of your events. Contact details are available exclusively to approved organizers for event coordination.</p>
    {error && <ErrorState message={error} />}
    {events.length ? <>
      <label className="form-field" style={{ maxWidth: 460, marginBottom: 18 }}><span className="field-label">Choose an event</span>
        <select className="select" value={selectedId} onChange={(event) => { setListLoading(true); setRegistrations([]); setRegistrationTotal(0); setPage(1); setSelectedId(event.target.value); }}>{events.map((event) => <option key={event.id} value={event.id}>{event.title} · {new Date(event.startAt).toLocaleDateString()}</option>)}</select>
      </label>
      <div className="dashboard-panel">
        <h2>{selectedEvent?.title || "Event registrations"}</h2>
        <p>{registrationTotal} active {registrationTotal === 1 ? "registration" : "registrations"}</p>
        {listLoading ? <LoadingState label="Loading participants" /> : registrations.length ? <div className="table-scroll"><table className="dashboard-table">
          <thead><tr><th>Participant</th><th>Email</th><th>Phone</th><th>Registration date</th><th>Status</th></tr></thead>
          <tbody>{registrations.map((registration) => (
            <tr key={registration.id}>
              <td>{registration.participantName}</td>
              <td>{registration.email || "—"}</td>
              <td>{registration.phone || "—"}</td>
              <td>{new Date(registration.registeredAt).toLocaleString()}</td>
              <td>{registration.status}</td>
            </tr>
          ))}</tbody>
        </table></div> : <p className="table-empty">There are no active registrations for this event yet.</p>}
      </div>
      {registrationTotal > 50 && <div className="form-actions" style={{ justifyContent: "center" }}>
        <button className="button button-outline" disabled={page <= 1} onClick={() => { setListLoading(true); setPage((current) => current - 1); }}>Previous</button>
        <span>Page {page} of {Math.ceil(registrationTotal / 50)}</span>
        <button className="button button-outline" disabled={page >= Math.ceil(registrationTotal / 50)} onClick={() => { setListLoading(true); setPage((current) => current + 1); }}>Next</button>
      </div>}
    </> : !error && <div className="empty-state"><h3>No events yet</h3><p>Your event registrations will appear here once participants join.</p></div>}
  </>;
}
