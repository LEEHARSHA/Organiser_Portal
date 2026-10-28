import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Fitness Species Community",
  description: "Discover local fitness events and bring your community together.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
