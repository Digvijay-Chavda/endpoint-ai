import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Endpoint — AI-Powered API Mocking for Social Good",
  description:
    "Instantly generate realistic mock APIs with Google Gemini AI, Faker.js templates, network simulation, and real-time request inspection. Built for developers creating impactful apps — no backend required.",
  keywords: [
    "API mocking", "mock API", "Gemini AI", "Faker.js", "social good",
    "developer tools", "SaaS", "hackathon", "Next.js",
  ],
  openGraph: {
    title: "Endpoint — AI-Powered API Mocking for Social Good",
    description:
      "Generate realistic mock APIs with Google Gemini AI. Built for developers building apps for social good.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans dark", geist.variable)} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
