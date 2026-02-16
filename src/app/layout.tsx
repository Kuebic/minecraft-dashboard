import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CraftBoard - Minecraft Server Dashboard",
  description: "Real-time Minecraft server monitoring and management dashboard",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
