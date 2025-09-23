"use client";
import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { Demo } from "../components/landing/Demo";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Testimonials } from "../components/landing/Testimonials";
import { Pricing } from "../components/landing/Pricing";
import { Footer } from "../components/landing/Footer";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <Features />
        <Demo />
        <HowItWorks />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
