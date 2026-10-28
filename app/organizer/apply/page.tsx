"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { ErrorState, SiteFooter, SiteHeader, StatusBadge } from "@/components/site";
import { CommunityApiError, applyAsOrganizer, getMyOrganizer, type Organizer } from "@/lib/api";

type ApplicationForm = {
  type: "organization" | "individual";
  organizationName: string;
  organizationType: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  website: string;
  description: string;
  experience: string;
  publicProfile: string;
};

const emptyForm: ApplicationForm = {
  type: "organization",
  organizationName: "",
  organizationType: "",
  contactName: "",
  phone: "",
  address: "",
  city: "",
  website: "",
  description: "",
  experience: "",
  publicProfile: "",
};

export default function ApplyPage() {
  const { user, loading, configError } = useAuth();
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [existing, setExisting] = useState<Organizer | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    getMyOrganizer(user)
      .then((response) => {
        setExisting(response.organizer);
        setForm({
          ...emptyForm,
          ...response.organizer,
          type: response.organizer.type,
          organizationName: response.organizer.organizationName || "",
          organizationType: response.organizer.organizationType || "",
          address: response.organizer.address || "",
          city: response.organizer.city || "",
          website: response.organizer.website || "",
          description: response.organizer.description || "",
          experience: response.organizer.experience || "",
          publicProfile: response.organizer.publicProfile || "",
        });
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof CommunityApiError && reason.status === 404)) {
          setError(reason instanceof Error ? reason.message : "Your application could not be loaded.");
        }
      })
      .finally(() => setChecking(false));
  }, [user]);

  function update<K extends keyof ApplicationForm>(key: K, value: ApplicationForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    setSubmitted(false);
    const application: Record<string, unknown> = { ...form };
    Object.keys(application).forEach((key) => {
      if (typeof application[key] === "string" && !application[key]) delete application[key];
    });
    if (form.type === "individual") delete application.organizationName;
    try {
      const response = await applyAsOrganizer(user, application);
      setExisting(response.organizer);
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Application could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  const editable = !existing || existing.status === "rejected" || existing.status === "changes_requested";
  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <div className="form-page">
          <section className="form-card">
            <p className="section-kicker">Organizer application</p>
            <h1>Tell us about your community.</h1>
            <p className="form-intro">Applications are reviewed by the Fitness Species team. You’ll need approval before creating event drafts. We never ask for government ID documents through this form.</p>
            {configError && <ErrorState message={`${configError}. Sign-in is unavailable until Firebase web settings are configured.`} />}
            {error && <ErrorState message={error} />}
            {submitted && <div className="notice notice-success" role="status">Your application is in the review queue. We’ll show updates here.</div>}
            {loading || (Boolean(user) && checking) ? <div className="auth-wait" role="status">Checking your account…</div> : !user ? (
              <div className="notice notice-info">Sign in to start or continue your application. <Link href="/login?next=%2Forganizer%2Fapply">Sign in</Link></div>
            ) : existing && !editable ? (
              <div className="dashboard-panel">
                <div className="split-heading"><h2>Application status</h2><StatusBadge status={existing.status} /></div>
                <p>{existing.status === "approved"
                  ? "Your organizer account is approved. You can now create event drafts from the dashboard."
                  : "Your application is under review. You can continue using the dashboard while the team reviews it."}</p>
                {existing.reviewNote && <div className="notice notice-info"><strong>Review note</strong><br />{existing.reviewNote}</div>}
                <Link className="button button-dark" href="/dashboard">Go to dashboard</Link>
              </div>
            ) : (
              <>
                {existing?.reviewNote && <div className="notice notice-info"><strong>Changes requested</strong><br />{existing.reviewNote}</div>}
                <form onSubmit={submit}>
                  <div className="form-field form-field-full" style={{ marginBottom: 18 }}>
                    <span className="field-label">I’m applying as</span>
                    <div className="radio-row">
                      <label className="radio-card"><input type="radio" name="organizerType" checked={form.type === "organization"} onChange={() => update("type", "organization")} /> Organization</label>
                      <label className="radio-card"><input type="radio" name="organizerType" checked={form.type === "individual"} onChange={() => { update("type", "individual"); update("organizationName", ""); }} /> Individual organizer</label>
                    </div>
                  </div>
                  <div className="form-grid">
                    {form.type === "organization" && <>
                      <Field label="Organization name" required value={form.organizationName} onChange={(value) => update("organizationName", value)} />
                      <Field label="Organization type" placeholder="Gym, college, company…" value={form.organizationType} onChange={(value) => update("organizationType", value)} />
                    </>}
                    <Field label="Contact person" required value={form.contactName} onChange={(value) => update("contactName", value)} />
                    <Field label="Phone number" required type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
                    <Field label="Account email" value={user.email || ""} disabled />
                    <Field label="City or area" value={form.city} onChange={(value) => update("city", value)} />
                    <Field label="Organization address" className="form-field-full" value={form.address} onChange={(value) => update("address", value)} />
                    <Field label="Website (optional)" type="url" value={form.website} onChange={(value) => update("website", value)} />
                    <Field label="Public profile (optional)" type="url" value={form.publicProfile} onChange={(value) => update("publicProfile", value)} />
                    <div className="form-field form-field-full"><label htmlFor="description">About your activities</label><textarea id="description" className="textarea" required minLength={20} maxLength={3000} value={form.description} onChange={(event) => update("description", event.target.value)} /><p className="form-help">Describe the community and activities you organize. 20–3,000 characters.</p></div>
                    {form.type === "individual" && <div className="form-field form-field-full"><label htmlFor="experience">Fitness or community experience *</label><textarea id="experience" className="textarea" required minLength={20} maxLength={3000} value={form.experience} onChange={(event) => update("experience", event.target.value)} /></div>}
                  </div>
                  <div className="form-actions">
                    <button className="button button-dark" disabled={busy || Boolean(configError)}>{busy ? "Submitting…" : existing ? "Resubmit application" : "Submit for review"}</button>
                    <span className="form-help">Your email comes from your signed-in account.</span>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <div className={`form-field ${className}`}><label htmlFor={id}>{label}{required ? " *" : ""}</label><input className="field" id={id} type={type} required={required} disabled={disabled} placeholder={placeholder} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} /></div>;
}
