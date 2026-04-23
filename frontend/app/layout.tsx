import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans as DMSans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ClientInit from "../components/ClientInIt";
import Chatbot from "../components/Chatbot";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DMSans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "WanderPlan | Travel Planner",
  description: "Big Data Travel Planner Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      {/* Added min-h-screen and flex classes to keep footer at the bottom */}
      <body
        className={`${dmSans.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientInit />
          
          <div className="flex-1 flex flex-col min-h-screen">
            {children}
          </div>
          
          <Chatbot />
        </AuthProvider>

          <Footer />
      </body>
    </html>
  );
}