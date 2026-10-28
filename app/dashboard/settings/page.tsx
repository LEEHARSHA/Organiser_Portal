"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useDashboard } from "@/components/dashboard-context";
import { ErrorState, LoadingState, StatusBadge } from "@/components/site";
import { updateOrganizer } from "@/lib/api";

type ProfileValues = {
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

export default function SettingsPage() {
  const { user } = useAuth();
  const { organizer, organizerError, organizerLoading, refreshOrganizer } = useDashboard();
  if (organizerLoading) return <LoadingState label="Loading organizer profile" />;
  if (organizerError) return <ErrorState message={organizerError} />;
  if (!organizer) return <><h1>Organizer profile</h1><div className="notice notice-info">Submit an organizer application before managing your profile.</div></>;
  return <ProfileForm organizer={organizer} userEmail={user?.email || ""} onRefresh={refreshOrganizer} />;
}

function ProfileForm({
  organizer,
  userEmail,
  onRefresh,
}: {
  organizer: NonNullable<ReturnType<typeof useDashboard>["organizer"]>;
  userEmail: string;
  onRefresh: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [values, setValues] = useState<ProfileValues>({
    organizationName: organizer.organizationName || "",
    organizationType: organizer.organizationType || "",
    contactName: organizer.contactName || "",
    phone: organizer.phone || "",
    address: organizer.address || "",
    city: organizer.city || "",
    website: organizer.website || "",
    description: organizer.description || "",
    experience: organizer.experience || "",
    publicProfile: organizer.publicProfile || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function change(key: keyof ProfileValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setSaved(false);
    setError("");
    const payload: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value.trim()) payload[key] = value.trim();
    });
    try {
      await updateOrganizer(user, payload);
      await onRefresh();
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Profile could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <p className="section-kicker">Public and contact details</p>
    <div className="split-heading"><h1>Profile settings</h1><StatusBadge status={organizer.status} /></div>
    <p className="dashboard-subtitle">Approval status and verification details are managed by the Fitness Species review team.</p>
    {error && <ErrorState message={error} />}
    {saved && <div className="notice notice-success" role="status">Profile saved.</div>}
    <div className="dashboard-panel">
      <form onSubmit={save}>
        <div className="form-grid">
          {organizer.type === "organization" && <>
            <ProfileField label="Organization name" value={values.organizationName} change={(value) => change("organizationName", value)} />
            <ProfileField label="Organization type" value={values.organizationType} change={(value) => change("organizationType", value)} />
          </>}
          <ProfileField label="Contact person" value={values.contactName} change={(value) => change("contactName", value)} />
          <ProfileField label="Phone" value={values.phone} change={(value) => change("phone", value)} />
          <ProfileField label="Email" value={userEmail} disabled />
          <ProfileField label="City" value={values.city} change={(value) => change("city", value)} />
          <ProfileField label="Address" value={values.address} change={(value) => change("address", value)} />
          <ProfileField label="Website" type="url" value={values.website} change={(value) => change("website", value)} />
          <ProfileField label="Public profile" type="url" value={values.publicProfile} change={(value) => change("publicProfile", value)} />
          <div className="form-field form-field-full"><label htmlFor="profile-description">Description</label><textarea id="profile-description" className="textarea" minLength={20} maxLength={3000} value={values.description} onChange={(event) => change("description", event.target.value)} /></div>
          {organizer.type === "individual" && <div className="form-field form-field-full"><label htmlFor="profile-experience">Fitness or community experience</label><textarea id="profile-experience" className="textarea" minLength={20} maxLength={3000} value={values.experience} onChange={(event) => change("experience", event.target.value)} /></div>}
        </div>
        <div className="form-actions"><button className="button button-dark" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div>
      </form>
    </div>
  </>;
}

function ProfileField({
  label,
  value,
  change,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  change?: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  const id = `profile-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <div className="form-field"><label htmlFor={id}>{label}</label><input id={id} className="field" type={type} disabled={disabled} value={value} onChange={change ? (event) => change(event.target.value) : undefined} /></div>;
}
