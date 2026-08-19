import { RideProviders } from "@the-ride/ui";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { AdminShell } from "@/components/AdminShell";
import { AppAuthProvider } from "@/components/AppAuthProvider";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clayba — Admin",
  description: "Operations dashboard for Clayba.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        <RideProviders>
          <AppAuthProvider>
            <AdminShell>{children}</AdminShell>
          </AppAuthProvider>
        </RideProviders>
      </body>
    </html>
  );
}
