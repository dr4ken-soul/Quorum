import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quorum | Put the payment on trial",
  description:
    "Forward a payment request. The agent collects the receipts, lets the group object, and tells you what is still unproven before your money moves.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <a
          href="#open"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[600] focus:rounded-[var(--radius-md)] focus:border focus:border-[var(--border-default)] focus:bg-[var(--bg-elevated)] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.12em]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
