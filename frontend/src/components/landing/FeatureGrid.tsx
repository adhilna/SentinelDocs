import { motion } from "framer-motion";
import { Search, ShieldAlert, GitBranch, Zap, FileCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Hybrid Search",
    description: "Combines semantic embeddings with keyword matching for high-recall, high-precision retrieval across your entire doc corpus.",
    span: "col-span-1 md:col-span-2",
  },
  {
    icon: ShieldAlert,
    title: "Hallucination Detection",
    description: "Cross-references every AI claim against source documents. Flags unsupported statements with confidence intervals.",
    span: "col-span-1",
  },
  {
    icon: GitBranch,
    title: "CI/CD Integration",
    description: "Plug into GitHub Actions, GitLab CI, or any pipeline. Auto-audit on every doc change.",
    span: "col-span-1",
  },
  {
    icon: Zap,
    title: "Sub-second Latency",
    description: "Optimized retrieval pipeline delivers answers in under 800ms with full source tracing.",
    span: "col-span-1 md:col-span-2",
  },
  {
    icon: FileCheck,
    title: "Source Verification",
    description: "Every response links back to exact page, paragraph, and sentence in your PDF.",
    span: "col-span-1",
  },
  {
    icon: BarChart3,
    title: "Faithfulness Analytics",
    description: "Track accuracy metrics over time. Identify drift and maintain quality benchmarks.",
    span: "col-span-1",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function FeatureGrid() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Built for rigorous verification
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto text-pretty">
            Every feature designed to ensure your documentation AI never hallucinates.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={item} className={`bento-card ${f.span}`}>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
