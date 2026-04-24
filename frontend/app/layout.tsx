import type { Metadata } from "next";
import { Inter } from "next/font/google"; // <-- Changed to Inter
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ClientInit from "../components/ClientInIt";
import Chatbot from "../components/Chatbot";
import Footer from "../components/Footer";

// Configure Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  // Inter is a variable font, so we don't strictly need to define weights, 
  // but it's good practice for Next.js optimization
  display: 'swap', 
});

export const metadata: Metadata = {
  title: "Minutebound | Travel Planner",
  description: "Big Data Travel Planner Application",
  icons: {
    // Replace this string with the path to your new logo inside the 'public' folder
    icon: '/logo.svg', 
  },
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
      <body
        // Apply the Inter font variable here
        className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientInit />
          
          <div className="flex-1 flex flex-col min-h-screen">
            {children}
          </div>
          
          <Footer />
          <Chatbot />
        </AuthProvider>
      </body>
    </html>
  );
}