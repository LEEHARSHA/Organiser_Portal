import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return <LegalPage
    eyebrow="Privacy"
    title="Your information, handled with care."
    intro="A practical summary of information used by the Fitness Species Community MVP."
    sections={[
      {
        title: "Information used",
        body: "Firebase Authentication provides the signed-in account identity. Organizer applications store the account identifier, account email, organizer type, contact details, location, public profile links, and the application description for review. Event records contain event details supplied by organizers, such as schedule, venue, coordinates, pricing, image URL, and participation instructions.",
      },
      {
        title: "Event registrations",
        body: "When a participant registers, the backend stores the event, Firebase account identifier, display name when available, registration status, and registration time. An organizer can see participant display names, registration status, and timestamps only for events they own. The Community MVP does not collect or confirm payments.",
      },
      {
        title: "Sharing and external services",
        body: "Firebase Authentication is used for account sign-in. Community records are processed by the Fitness Species backend and MongoDB database. Organizers may provide external image or ticket links; those third-party services have their own privacy terms. The Community website does not fetch user-provided image URLs on its server.",
      },
      {
        title: "Questions and data requests",
        body: "Use the Fitness Species support channel to ask about an organizer application or request help with your account. Contact and data-retention details must be finalized by Fitness Species before public launch.",
      },
    ]}
  />;
}
