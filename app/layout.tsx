import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldAssist · SC Incentive Policy Simulator",
  description: "Solution Consulting incentive policy simulator.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
