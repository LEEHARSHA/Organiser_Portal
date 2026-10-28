"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck2, Compass, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader, EventCard, EmptyEvents, ErrorState, LoadingState } from "@/components/site";
import { getPublicEvents, type CommunityEvent } from "@/lib/api";

const categories = [
  "Running", "Walking", "Cycling", "Gym challenges", "College fitness",
  "Corporate wellness", "Yoga", "Sports",
];

export default function HomePage() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicEvents({ limit: 3 })
      .then((response) => setEvents(response.events))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Events could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SiteHeader />
      <main>
        <section
          className="hero"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(13,35,24,.89) 0%, rgba(13,35,24,.72) 47%, rgba(13,35,24,.18) 100%), url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=85')",
          }}
        >
          <div className="hero-inner">
            <p className="eyebrow"><span className="eyebrow-dot" /> Movement starts together</p>
            <h1>Bring your fitness community together.</h1>
            <p className="hero-copy">
              Create a place for people to discover local fitness events, meet their community,
              and take part in something active.
            </p>
            <div className="hero-actions">
              <Link className="button button-lime" href="/organizer/apply">Become an organizer <ArrowRight size={16} /></Link>
              <Link className="button button-outline" href="/events">Explore events</Link>
            </div>
            <p className="hero-note">For clubs, campuses, workplaces, sports groups, and independent organizers.</p>
          </div>
        </section>

        <section className="section section-white">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <p className="section-kicker">Built for community movement</p>
                <h2>More than a listing.<br />A place to get moving.</h2>
              </div>
              <p>Whether it’s a neighborhood run or a workplace wellness day, give your next event a clear path from discovery to participation.</p>
            </div>
            <div className="feature-grid">
              <Feature icon={<Compass size={20} />} title="Local discovery" text="Help people find events by activity, city, and date." />
              <Feature icon={<ShieldCheck size={20} />} title="Organizer verification" text="Approved organizers and events go through a review process." />
              <Feature icon={<CalendarCheck2 size={20} />} title="Useful event details" text="Share schedules, locations, eligibility, and registration guidance." />
              <Feature icon={<UsersRound size={20} />} title="Community participation" text="Keep your event information and participant registrations in one place." />
            </div>
          </div>
        </section>

        <section className="section section-muted">
          <div className="section-inner">
            <p className="section-kicker">Find your kind of movement</p>
            <h2 className="section-title">A community for every pace.</h2>
            <div className="category-row">{categories.map((category) => <span className="category-chip" key={category}>{category}</span>)}</div>
          </div>
        </section>

        <section className="section section-white" id="how-it-works">
          <div className="section-inner">
            <p className="section-kicker">How it works</p>
            <h2 className="section-title">From idea to event day.</h2>
            <div className="steps-grid">
              <Step number="01" title="Apply to organize" text="Tell us about your group and the community you bring together. We review every application." />
              <Step number="02" title="Create your event" text="Approved organizers can draft an event with the details participants need to decide." />
              <Step number="03" title="Share after approval" text="Once reviewed, your event can appear for participants to discover and register." />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <p className="section-kicker">On the calendar</p>
                <h2>Upcoming community events</h2>
              </div>
              <Link className="button-link" href="/events">Browse all events <ArrowRight size={15} /></Link>
            </div>
            {loading ? <LoadingState label="Finding upcoming events" /> : error ? <ErrorState message={error} /> : events.length
              ? <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div>
              : <EmptyEvents title="Your next event is waiting" detail="There are no published events just yet. Explore again soon or start organizing one for your community." />}
          </div>
        </section>

        <section className="section section-white">
          <div className="section-inner">
            <div className="organizer-cta">
              <div>
                <p className="section-kicker" style={{ color: "var(--lime)" }}>For organizers</p>
                <h2>Make it easier for your people to show up.</h2>
                <p>Applications are reviewed before organizers can publish events.</p>
              </div>
              <Link className="button button-lime" href="/organizer/apply">Apply to organize <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>

        <section className="section section-muted">
          <div className="section-inner">
            <p className="section-kicker">Good to know</p>
            <h2 className="section-title">Frequently asked questions</h2>
            <div className="faq-list">
              <Faq question="Who can apply to become an organizer?" answer="Fitness clubs, colleges, companies, sports organizations, and individuals with relevant community experience can apply." />
              <Faq question="Can I publish an event as soon as I sign up?" answer="No. Organizer applications must be approved first, and each event is reviewed before it is publicly listed." />
              <Faq question="Can participants pay through Fitness Species?" answer="The initial community website lists paid-event prices and external registration instructions. It does not collect or confirm payments." />
              <Faq question="Where do published events appear?" answer="Approved events are available through this event directory and can be shared with the Fitness Species mobile experience through the same backend." />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="feature-card"><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p></article>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="step-card"><span className="step-number">{number}</span><h3>{title}</h3><p>{text}</p></article>;
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return <details><summary>{question}</summary><p>{answer}</p></details>;
}
