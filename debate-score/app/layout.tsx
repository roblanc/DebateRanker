import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DebateRank — AI Debate Analysis",
  description: "Analyze debate transcripts with AI-powered structured scoring and argument mapping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
