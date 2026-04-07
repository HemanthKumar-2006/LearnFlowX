import type { Metadata } from "next";
import "reactflow/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnFlow — Your AI Learning Roadmap",
  description:
    "LearnFlow turns 'I want to learn X' into a structured, visual, and adaptive learning journey. Personalized roadmaps powered by Claude.",
  metadataBase: new URL("https://learnflow.local"),
  openGraph: {
    title: "LearnFlow — Your AI Learning Roadmap",
    description:
      "Personalized, time-optimized learning roadmaps visualized as an interactive graph.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
