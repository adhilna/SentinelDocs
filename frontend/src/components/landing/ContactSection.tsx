import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const POLISH_ENDPOINT = "http://localhost:8001/polish";

export function ContactSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);

  const handlePolish = async () => {
    setIsPolishing(true);
    try {
      const res = await fetch(POLISH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const data = await res.json();
      if (data.polished) setMessage(data.polished);
    } catch (err) {
      console.error("Polish endpoint unreachable:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Connect to your submit endpoint
    console.log("Submit:", { email, message });
  };

  return (
    <section className="relative py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-lg"
      >
        <h2 className="text-balance text-3xl font-bold tracking-tight text-center mb-2">
          Get in touch
        </h2>
        <p className="text-pretty text-center text-muted-foreground mb-10">
          Questions about SentinelDocs? Drop us a line.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Textarea
            placeholder="Your message…"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="resize-none"
            required
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePolish}
              disabled={!message.trim() || isPolishing}
              className="gap-1.5 active:scale-[0.96] transition-transform"
            >
              {isPolishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Magic Polish
            </Button>

            <Button
              type="submit"
              className="ml-auto gap-1.5 active:scale-[0.96] transition-transform"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </form>
      </motion.div>
    </section>
  );
}
