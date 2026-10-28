"use client";

import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { EventCard, ErrorState, LoadingState, SiteFooter, SiteHeader, EmptyEvents } from "@/components/site";
import { getPublicEvents, type CommunityEvent } from "@/lib/api";

export default function EventsPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [pricingType, setPricingType] = useState("");
  const [organizerType, setOrganizerType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const query: Record<string, string | number> = { page, limit: 12 };
    if (search) query.search = search;
    if (city) {
      if (/^\d+$/.test(city.trim())) query.postalCode = city.trim();
      else query.city = city.trim();
    }
    if (category) query.category = category;
    if (pricingType) query.pricingType = pricingType;
    if (organizerType) query.organizerType = organizerType;
    if (startDate) query.startDate = new Date(`${startDate}T00:00:00`).toISOString();
    if (endDate) query.endDate = new Date(`${endDate}T23:59:59`).toISOString();
    if (location) {
      query.latitude = location.latitude;
      query.longitude = location.longitude;
      query.radiusKm = 50;
      query.sortBy = "distance";
    }
    getPublicEvents(query)
      .then((response) => {
        setEvents(response.events);
        setTotal(response.total);
        setError("");
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Events could not be loaded."))
      .finally(() => setLoading(false));
  }, [search, city, category, pricingType, organizerType, startDate, endDate, page, location]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
  }

  function useMyLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location search is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setPage(1);
        setLocating(false);
      },
      () => {
        setLocationError("Location access was not granted. Search by city or PIN code instead.");
        setLocating(false);
      },
      { maximumAge: 60000, timeout: 10000 },
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <section className="page-hero">
          <div className="page-hero-inner">
            <p className="section-kicker">Make room for movement</p>
            <h1>Find an event that gets you out there.</h1>
            <p>Browse approved community events by activity, date, and place.</p>
          </div>
        </section>
        <div className="content-wrap">
          <form className="filter-panel" onSubmit={handleSubmit}>
            <label className="filter-search">
              <span className="sr-only">Search event names</span>
              <Search size={17} />
              <input className="field" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search events" />
            </label>
            <label><span className="sr-only">City or PIN code</span><input className="field" value={city} onChange={(event) => { setCity(event.target.value); setPage(1); }} placeholder="City or PIN code" /></label>
            <label>
              <span className="sr-only">Activity category</span>
              <select className="select" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
                <option value="">All activities</option>
                {["running", "walking", "cycling", "gym", "college", "corporate", "yoga", "sports", "other"].map((item) => <option value={item} key={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Events from date</span>
              <input className="field" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} aria-label="Events from date" />
            </label>
            <label>
              <span className="sr-only">Events through date</span>
              <input className="field" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} aria-label="Events through date" />
            </label>
            <label>
              <span className="sr-only">Organizer type</span>
              <select className="select" value={organizerType} onChange={(event) => { setOrganizerType(event.target.value); setPage(1); }}>
                <option value="">All organizers</option>
                <option value="organization">Organizations</option>
                <option value="individual">Individuals</option>
              </select>
            </label>
          </form>
          <div className="filters-secondary">
            <span>Price:</span>
            <label className="filter-check"><input type="radio" name="price" checked={!pricingType} onChange={() => { setPricingType(""); setPage(1); }} /> All</label>
            <label className="filter-check"><input type="radio" name="price" checked={pricingType === "free"} onChange={() => { setPricingType("free"); setPage(1); }} /> Free</label>
            <label className="filter-check"><input type="radio" name="price" checked={pricingType === "paid"} onChange={() => { setPricingType("paid"); setPage(1); }} /> Paid</label>
              <button type="button" className="location-button" disabled={locating} onClick={useMyLocation}>
                {locating ? "Finding location…" : location ? "Nearest within 50 km" : "Use my location"}
            </button>
          </div>
          {locationError && <div className="notice notice-info" role="status">{locationError}</div>}
          {error && <ErrorState message={error} />}
          {loading ? <LoadingState label="Loading events" /> : events.length ? (
            <>
              <div className="section-head"><p>{total} {total === 1 ? "event" : "events"} to explore</p><span>Sorted by upcoming date</span></div>
              <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div>
              {total > 12 && <div className="form-actions" style={{ justifyContent: "center" }}>
                <button className="button button-outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                <span aria-live="polite">Page {page} of {Math.ceil(total / 12)}</span>
                <button className="button button-outline" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage((current) => current + 1)}>Next</button>
              </div>}
            </>
          ) : !error ? <EmptyEvents title="No events match that search" detail="Try broadening your filters, searching another city, or checking back soon." /> : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
