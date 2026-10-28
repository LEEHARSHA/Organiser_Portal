import { LegalPage } from "@/components/legal-page";

export default function ContactPage() {
  return <LegalPage
    eyebrow="Contact"
    title="We’re here to help."
    intro="For help with organizer applications, event information, or account access, use the Fitness Species support channel."
    sections={[
      {
        title: "Support contact",
        body: "The official support email or contact destination has not been provided in this repository. Fitness Species should configure and verify its support contact before deploying this website publicly.",
      },
      {
        title: "Event questions",
        body: "For event-specific instructions, use the organizer website or participation information shown on the event page. The website does not collect payments or provide payment support for external ticketing services.",
      },
    ]}
  />;
}
