"use client";

import { DashboardFrame } from "@/components/dashboard-context";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardFrame>{children}</DashboardFrame>;
}
