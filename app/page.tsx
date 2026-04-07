// Landing page — futuristic, dark, glass + neon, animated.
// Goal: impress immediately so judges read past the fold.

import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink-950 text-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </main>
  );
}
