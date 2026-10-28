"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cloneElement, useState, type FormEvent, type ReactElement } from "react";
import { ErrorState, ImageWithFallback } from "@/components/site";
import { createEvent, isValidHttpsImageUrl, updateEvent, type CommunityEvent } from "@/lib/api";
import type { User } from "@firebase/auth";

type Values = {
  title: string;
  description: string;
  category: string;
  coverImageUrl: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  venueType: "in_person" | "online";
  venueName: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  registrationDeadline: string;
  capacity: string;
  eligibility: string;
  instructions: string;
  pricingType: "free" | "paid";
  amount: string;
  currency: string;
  externalRegistrationUrl: string;
};

function formatLocalInput(value: string, timeZone: string) {
  if (!value) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(value));
    const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
  } catch {
    return "";
  }
}

function localInputToIso(value: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Enter a valid local date and time.");
  const target = match.slice(1).map(Number);
  const targetAsUtc = Date.UTC(target[0], target[1] - 1, target[2], target[3], target[4]);
  let candidate = targetAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const valueFor = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const shownAsUtc = Date.UTC(
      valueFor("year"),
      valueFor("month") - 1,
      valueFor("day"),
      valueFor("hour"),
      valueFor("minute"),
    );
    const correction = targetAsUtc - shownAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }
  const normalized = formatLocalInput(new Date(candidate).toISOString(), timeZone);
  if (normalized !== value) throw new Error("This local time does not exist in the selected timezone. Choose another time.");
  return new Date(candidate).toISOString();
}

export function EventForm({
  user,
  initialEvent,
}: {
  user: User;
  initialEvent?: CommunityEvent;
}) {
  const router = useRouter();
  const defaultTimeZone = initialEvent?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  const [values, setValues] = useState<Values>({
    title: initialEvent?.title || "",
    description: initialEvent?.description || "",
    category: initialEvent?.category || "running",
    coverImageUrl: initialEvent?.coverImageUrl || "",
    startAt: formatLocalInput(initialEvent?.startAt || "", defaultTimeZone),
    endAt: formatLocalInput(initialEvent?.endAt || "", defaultTimeZone),
    timeZone: defaultTimeZone,
    venueType: initialEvent?.venueType || "in_person",
    venueName: initialEvent?.venueName || "",
    address: initialEvent?.address || "",
    city: initialEvent?.city || "",
    postalCode: initialEvent?.postalCode || "",
    latitude: initialEvent?.latitude === null ? "" : String(initialEvent?.latitude ?? ""),
    longitude: initialEvent?.longitude === null ? "" : String(initialEvent?.longitude ?? ""),
    registrationDeadline: formatLocalInput(initialEvent?.registrationDeadline || "", defaultTimeZone),
    capacity: initialEvent?.capacity === null ? "" : String(initialEvent?.capacity ?? ""),
    eligibility: initialEvent?.eligibility || "",
    instructions: initialEvent?.instructions || "",
    pricingType: initialEvent?.pricingType || "free",
    amount: initialEvent?.amount === null ? "" : String(initialEvent?.amount ?? ""),
    currency: initialEvent?.currency || "INR",
    externalRegistrationUrl: initialEvent?.externalRegistrationUrl || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (!isValidHttpsImageUrl(values.coverImageUrl)) {
        throw new Error("Cover image URL must be a valid HTTPS URL without embedded credentials.");
      }
      if (values.externalRegistrationUrl && !isValidHttpsImageUrl(values.externalRegistrationUrl)) {
        throw new Error("External registration link must be a valid HTTPS URL without embedded credentials.");
      }
      const startAt = localInputToIso(values.startAt, values.timeZone);
      const endAt = localInputToIso(values.endAt, values.timeZone);
      const registrationDeadline = values.registrationDeadline
        ? localInputToIso(values.registrationDeadline, values.timeZone)
        : undefined;
      if (Boolean(values.latitude) !== Boolean(values.longitude)) {
        throw new Error("Provide both latitude and longitude, or leave both empty.");
      }
      const payload: Record<string, unknown> = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        coverImageUrl: values.coverImageUrl.trim(),
        startAt,
        endAt,
        timeZone: values.timeZone.trim(),
        venueType: values.venueType,
        venueName: values.venueName.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        postalCode: values.postalCode.trim(),
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
        registrationDeadline,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        eligibility: values.eligibility.trim(),
        instructions: values.instructions.trim(),
        pricingType: values.pricingType,
        amount: values.pricingType === "paid" ? Number(values.amount) : undefined,
        currency: values.currency.trim().toUpperCase(),
        externalRegistrationUrl: values.externalRegistrationUrl.trim() || undefined,
      };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === "") delete payload[key];
      });
      const response = initialEvent
        ? await updateEvent(user, initialEvent.id, payload)
        : await createEvent(user, payload);
      setSuccess(initialEvent && initialEvent.status === "approved"
        ? "Your changes were saved and sent back for review."
        : initialEvent ? "Event changes saved." : "Draft created. Submit it for review when it’s ready.");
      if (!initialEvent) {
        router.replace(`/dashboard/events/${response.event.id}/edit`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The event could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <ErrorState message={error} />}
      {success && <div className="notice notice-success" role="status">{success} <Link href="/dashboard/events">View your events</Link></div>}
      <div className="form-grid">
        <Field label="Event title" required className="form-field-full"><input id="title" className="field" required minLength={3} maxLength={160} value={values.title} onChange={(event) => set("title", event.target.value)} /></Field>
        <Field label="Description" required className="form-field-full"><textarea id="description" className="textarea" required minLength={30} maxLength={10000} value={values.description} onChange={(event) => set("description", event.target.value)} /></Field>
        <Field label="Category" required>
          <select id="category" className="select" value={values.category} onChange={(event) => set("category", event.target.value)}>
            {["running", "walking", "cycling", "gym", "college", "corporate", "yoga", "sports", "other"].map((category) => <option key={category} value={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Cover image URL" required hint="Use a public HTTPS image URL. External images may be moved or blocked.">
          <input id="coverImageUrl" className="field" type="url" required value={values.coverImageUrl} onChange={(event) => set("coverImageUrl", event.target.value)} />
        </Field>
        {values.coverImageUrl && isValidHttpsImageUrl(values.coverImageUrl) && <div className="form-field form-field-full"><ImageWithFallback src={values.coverImageUrl} alt="Event cover preview" className="form-preview" /></div>}
        {values.coverImageUrl && !isValidHttpsImageUrl(values.coverImageUrl) && <div className="form-field form-field-full"><div className="notice notice-error">Enter a valid HTTPS image URL. The server will never fetch it.</div></div>}
        <Field label="Start date and time" required><input id="startAt" className="field" type="datetime-local" required value={values.startAt} onChange={(event) => set("startAt", event.target.value)} /></Field>
        <Field label="End date and time" required><input id="endAt" className="field" type="datetime-local" required value={values.endAt} onChange={(event) => set("endAt", event.target.value)} /></Field>
        <Field label="Event timezone" required hint="Use an IANA name, for example Asia/Kolkata."><input id="timeZone" className="field" required value={values.timeZone} onChange={(event) => set("timeZone", event.target.value)} /></Field>
        <Field label="Registration deadline"><input id="registrationDeadline" className="field" type="datetime-local" value={values.registrationDeadline} onChange={(event) => set("registrationDeadline", event.target.value)} /></Field>
        <Field label="Event format" required>
          <select id="venueType" className="select" value={values.venueType} onChange={(event) => set("venueType", event.target.value as Values["venueType"])}>
            <option value="in_person">In person</option><option value="online">Online</option>
          </select>
        </Field>
        {values.venueType === "in_person" && <>
          <Field label="Venue name" required><input id="venueName" className="field" required value={values.venueName} onChange={(event) => set("venueName", event.target.value)} /></Field>
          <Field label="Full address" required><input id="address" className="field" required value={values.address} onChange={(event) => set("address", event.target.value)} /></Field>
          <Field label="City" required><input id="city" className="field" required value={values.city} onChange={(event) => set("city", event.target.value)} /></Field>
          <Field label="PIN / postal code"><input id="postalCode" className="field" value={values.postalCode} onChange={(event) => set("postalCode", event.target.value)} /></Field>
          <Field label="Latitude (optional)"><input id="latitude" className="field" type="number" step="any" min="-90" max="90" value={values.latitude} onChange={(event) => set("latitude", event.target.value)} /></Field>
          <Field label="Longitude (optional)"><input id="longitude" className="field" type="number" step="any" min="-180" max="180" value={values.longitude} onChange={(event) => set("longitude", event.target.value)} /></Field>
        </>}
        <Field label="Participant capacity (optional)" hint="Leave blank for no fixed capacity."><input id="capacity" className="field" type="number" min="1" max="100000" step="1" value={values.capacity} onChange={(event) => set("capacity", event.target.value)} /></Field>
        <Field label="Eligibility requirements" className="form-field-full"><textarea id="eligibility" className="textarea" maxLength={2000} value={values.eligibility} onChange={(event) => set("eligibility", event.target.value)} /></Field>
        <Field label="Participation or registration instructions" className="form-field-full" hint={values.pricingType === "paid" ? "Required for paid events if no external registration link is supplied." : undefined}>
          <textarea id="instructions" className="textarea" maxLength={3000} value={values.instructions} onChange={(event) => set("instructions", event.target.value)} />
        </Field>
        <div className="form-field form-field-full">
          <span className="field-label">Price</span>
          <div className="radio-row">
            <label className="radio-card"><input type="radio" name="priceType" checked={values.pricingType === "free"} onChange={() => set("pricingType", "free")} /> Free</label>
            <label className="radio-card"><input type="radio" name="priceType" checked={values.pricingType === "paid"} onChange={() => set("pricingType", "paid")} /> Paid</label>
          </div>
        </div>
        {values.pricingType === "paid" && <>
          <Field label="Amount" required><input id="amount" className="field" type="number" min="0.01" max="10000000" step="0.01" required value={values.amount} onChange={(event) => set("amount", event.target.value)} /></Field>
          <Field label="Currency" required><input id="currency" className="field" maxLength={3} minLength={3} required value={values.currency} onChange={(event) => set("currency", event.target.value)} /></Field>
          <Field label="External registration link" className="form-field-full" hint="Payments are not collected or confirmed on Fitness Species.">
            <input id="externalRegistrationUrl" className="field" type="url" value={values.externalRegistrationUrl} onChange={(event) => set("externalRegistrationUrl", event.target.value)} />
          </Field>
        </>}
      </div>
      <div className="form-actions">
        <button className="button button-dark" disabled={busy}>{busy ? "Saving…" : initialEvent ? "Save changes" : "Save draft"}</button>
        <Link className="button button-outline" href="/dashboard/events">Cancel</Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  required,
  hint,
  className = "",
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <div className={`form-field ${className}`}><label htmlFor={id}>{label}{required ? " *" : ""}</label>{cloneElement(children, { id })}{hint && <p className="form-help">{hint}</p>}</div>;
}
