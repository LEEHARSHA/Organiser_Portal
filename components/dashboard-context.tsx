"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, LayoutDashboard, Settings, PlusCircle } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { CommunityApiError, getMyOrganizer, type Organizer } from "@/lib/api";
import { SiteHeader } from "@/components/site";

type DashboardContextValue = {
  organizer: Organizer | null;
  organizerLoading: boolean;
  organizerError: string;
  refreshOrganizer: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("Dashboard context is missing.");
  return value;
}

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "My events", icon: CalendarDays },
  { href: "/dashboard/events/new", label: "Create event", icon: PlusCircle },
  { href: "/dashboard/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Profile settings", icon: Settings },
];

export function DashboardFrame({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [organizerLoading, setOrganizerLoading] = useState(true);
  const [organizerError, setOrganizerError] = useState("");

  async function refreshOrganizer() {
    if (!user) return;
    try {
      const response = await getMyOrganizer(user);
      setOrganizer(response.organizer);
      setOrganizerError("");
    } catch (error) {
      if (error instanceof CommunityApiError && error.status === 404) {
        setOrganizer(null);
      } else {
        setOrganizerError(error instanceof Error ? error.message : "Organizer details could not be loaded.");
      }
    } finally {
      setOrganizerLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // This synchronizes the dashboard with the authenticated backend profile.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshOrganizer();
  // refreshOrganizer intentionally reads the current session user.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, pathname, router]);

  if (authLoading || !user || organizerLoading) {
    return <><SiteHeader /><div className="auth-wait" role="status">Loading your organizer workspace…</div></>;
  }

  return (
    <>
      <SiteHeader />
      <div className="dashboard-shell">
        <nav className="dashboard-nav" aria-label="Organizer dashboard">
          <p>Workspace</p>
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""} aria-current={pathname === href ? "page" : undefined}>
              <Icon size={16} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <main className="dashboard-content">
          <DashboardContext.Provider value={{ organizer, organizerLoading, organizerError, refreshOrganizer }}>
            <div className="dashboard-content-inner">{children}</div>
          </DashboardContext.Provider>
        </main>
      </div>
    </>
  );
}
