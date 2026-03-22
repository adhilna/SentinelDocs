import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-success/15 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground mb-8">
            <Shield className="h-4 w-4 text-primary" />
            AI-Powered Document Intelligence
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-balance text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
        >
          Audit your docs with{" "}
          <span className="gradient-text">unwavering precision</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-pretty mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
        >
          SentinelDocs combines hybrid search, hallucination detection, and source verification 
          to ensure every AI response is grounded in your documentation.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="h-12 px-8 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform">
            <Link to="/register">
              Start Auditing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-xl active:scale-[0.97] transition-transform">
            <Link to="/dashboard">View Demo</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
