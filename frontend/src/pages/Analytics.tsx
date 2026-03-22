import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, FileText, Clock } from "lucide-react";
import { motion } from "framer-motion";

const faithfulnessData = [
  { date: "Mar 1", score: 88.2 },
  { date: "Mar 4", score: 90.1 },
  { date: "Mar 7", score: 87.5 },
  { date: "Mar 10", score: 92.3 },
  { date: "Mar 13", score: 91.8 },
  { date: "Mar 16", score: 94.7 },
  { date: "Mar 19", score: 93.2 },
  { date: "Mar 21", score: 95.1 },
];

const stats = [
  { label: "Avg Faithfulness", value: "93.2%", icon: TrendingUp, trend: "+2.1%" },
  { label: "Docs Audited", value: "147", icon: FileText, trend: "+12 this week" },
  { label: "Avg Latency", value: "423ms", icon: Clock, trend: "-18ms" },
];

const entrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Audit performance and quality metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 rounded-full bg-emerald-500">
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </span>
          <span className="text-sm font-medium text-emerald-400">CI/CD Pipeline: Healthy</span>
        </div>
      </div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={1} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{s.trend}</Badge>
            </div>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={2} className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-6">Average Faithfulness Score</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={faithfulnessData}>
              <defs>
                <linearGradient id="faithGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
              />
              <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#faithGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Deployment Status */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={3} className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4">Deployment Status</h3>
        <div className="space-y-3">
          {[
            { name: "Document Indexer", status: "Running", version: "v2.4.1" },
            { name: "Audit Engine", status: "Running", version: "v3.1.0" },
            { name: "Evaluation Pipeline", status: "Running", version: "v1.8.2" },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 border border-border">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium">{svc.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">{svc.version}</Badge>
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{svc.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
