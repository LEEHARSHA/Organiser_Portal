import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return <LegalPage
    eyebrow="Terms"
    title="A few things to know before you join."
    intro="These MVP terms explain the current event listing and organizer review flow."
    sections={[
      {
        title: "Organizer accounts and review",
        body: "Organizers must provide accurate application and event information. Organizer approval and event publication are controlled by Fitness Species review. Creating an account or draft does not grant approval or make an event public.",
      },
      {
        title: "Event information",
        body: "Events are supplied by organizers and may change or be cancelled. Check the event details and organizer instructions before attending. Fitness Species may hide or remove content that is inaccurate, unsafe, or inconsistent with platform rules.",
      },
      {
        title: "Pricing and external registration",
        body: "The Community MVP may display a price and an organizer-provided external registration link or instructions. Fitness Species does not collect payments, process refunds, or confirm payment completion through this website.",
      },
      {
        title: "Acceptable use",
        body: "Do not submit misleading event details, infringe others’ rights, or use the platform to harass, spam, or endanger participants. Organizers are responsible for their events, venues, eligibility rules, and any external registration or payment process.",
      },
    ]}
  />;
}
