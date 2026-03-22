import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { TerminalDemo } from "@/components/landing/TerminalDemo";
import { ContactSection } from "@/components/landing/ContactSection";
import { AiChatBubble } from "@/components/landing/AiChatBubble";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <div className="pt-16">
        <HeroSection />
        <FeatureGrid />
        <TerminalDemo />
        <ContactSection />
      </div>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 SentinelDocs. Built for teams that demand accuracy.
      </footer>
      <AiChatBubble />
    </div>
  );
}
