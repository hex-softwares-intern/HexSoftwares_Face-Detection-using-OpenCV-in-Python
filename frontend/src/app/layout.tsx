import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vision Engine | AI Face Detection",
  description: "Advanced multi-scale face detection suite powered by MTCNN and computer vision.",
  keywords: ["AI", "Face Detection", "MTCNN", "Computer Vision", "Next.js", "React"],
  authors: [{ name: "AI Vision Team" }],
  icons: {
    // This is the new icon URL
    icon: "https://img.icons8.com/fluency/48/artificial-intelligence.png",
  },
  openGraph: {
    title: "Vision Engine | AI Face Detection",
    description: "Professional Neural Network Visual Analysis",
    url: "http://localhost:3000",
    siteName: "Vision Engine",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vision Engine | AI Face Detection",
    description: "Professional Neural Network Visual Analysis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}