import { Hero } from "@/components/Landing/Hero";
import { Features } from "@/components/Landing/Features";
import { Pricing } from "@/components/Landing/Pricing";
import { Contact } from "@/components/Landing/Contact";
import { Footer } from "@/components/Landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Hero />
      <Features />
      <Pricing />
      <Contact />
      <Footer />
    </div>
  );
}