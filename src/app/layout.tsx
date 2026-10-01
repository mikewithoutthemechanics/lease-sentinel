import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lease Sentinel | Property operations, made clearer",
  description: "The South African operating system for residential, commercial and industrial rental portfolios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
