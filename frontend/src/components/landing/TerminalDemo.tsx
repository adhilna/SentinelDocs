import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

const lines = [
  { text: "$ sentinel audit ./docs/api-reference.pdf", delay: 0 },
  { text: "⠋ Indexing 247 pages...", delay: 800 },
  { text: "✓ Built 1,842 semantic chunks", delay: 1600 },
  { text: "⠋ Running hallucination detection...", delay: 2200 },
  { text: "✓ Faithfulness score: 94.7%", delay: 3200, color: "text-success" },
  { text: "⚠ 3 claims flagged for review (pages 42, 89, 156)", delay: 4000, color: "text-warning" },
  { text: "✓ Audit complete. Trace: https://smith.langchain.com/t/abc123", delay: 5000, color: "text-success" },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            See it in action
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">Live audit pipeline demo</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5"
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/50">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
            </div>
            <div className="flex items-center gap-1.5 ml-3 text-xs text-muted-foreground">
              <Terminal className="h-3 w-3" />
              sentinel-cli
            </div>
          </div>

          {/* Terminal body */}
          <div className="p-6 font-mono text-sm leading-7 min-h-[280px]">
            {lines.slice(0, visibleLines).map((line, i) => (
              <div key={i} className={`${line.color || "text-foreground"} animate-fade-up`} style={{ animationDelay: `${i * 50}ms` }}>
                {line.text}
              </div>
            ))}
            {visibleLines < lines.length && (
              <span className="inline-block w-2 h-4 bg-primary animate-terminal-blink" />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
