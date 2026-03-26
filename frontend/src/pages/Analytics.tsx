import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, FileText, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { authApi, aiApi } from "@/api/axiosConfig";

interface Doc {
  id: string;
  name: string;
  date: string;
  status: string;
  score: number | null;
}

interface AnalyticsProps {
  documents: Doc[];
}

const entrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Analytics({ documents = [] }: AnalyticsProps) {
  const [health, setHealth] = useState([
    { name: "Django API (Auth & DB)", instance: authApi, path: "/api/documents/health/", status: "Checking...", latency: "—", online: true },
    { name: "FastAPI Engine (Vector RAG)", instance: aiApi, path: "/health", status: "Checking...", latency: "—", online: true },
  ]);

  useEffect(() => {
    const runChecks = async () => {
      const results = await Promise.all(
        health.map(async (svc) => {
          const start = performance.now();
          try {
            await svc.instance.get(svc.path, { timeout: 2000 });
            const end = performance.now();
            return {
              ...svc,
              status: "Operational",
              latency: `${Math.round(end - start)}ms`,
              online: true
            };
          } catch (err) {
            return { ...svc, status: "Offline", latency: "—", online: false };
          }
        })
      );
      setHealth(results);
    };

    runChecks();
    const id = setInterval(runChecks, 15000); // Check every 15s for better "Live" feel
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const audited = documents.filter(d => d.score !== null);
    const avgScore = audited.length > 0
      ? (audited.reduce((acc, d) => acc + (d.score || 0), 0) / audited.length).toFixed(1)
      : "0";

    return [
      { label: "Avg Faithfulness", value: `${avgScore}%`, icon: TrendingUp, color: "text-emerald-400" },
      { label: "Docs Audited", value: documents.length.toString(), icon: FileText, color: "text-blue-400" },
      { label: "Audit Success", value: `${audited.length}`, icon: Activity, color: "text-purple-400" },
    ];
  }, [documents]);

  // 📊 Prepare Chart Data (Sorting by date)
  const chartData = useMemo(() => {
    return documents
      .filter(d => d.score !== null)
      .slice(-8) // Show last 8 audits
      .map(d => ({
        date: d.date,
        score: d.score
      }));
  }, [documents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Real-time RAG performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 rounded-full bg-emerald-500">
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </span>
          <span className="text-sm font-medium text-emerald-400">Sentinel Engine: Active</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial="hidden" animate="show" variants={entrance} custom={i}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Live</Badge>
            </div>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Faithfulness Chart */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={2} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Audit Quality Trend</h3>
          <p className="text-xs text-muted-foreground italic">Based on last {chartData.length} document audits</p>
        </div>
        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="faithGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#faithGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Activity className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm italic">Perform an audit to see quality metrics...</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Deployment Status */}
      {/* Backend Infrastructure Sync */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={3} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Infrastructure Monitoring</h3>
          <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-tighter opacity-70">
            Real-time Pings
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {health.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3 border border-border/50">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${svc.online ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
                <div>
                  <p className="text-xs font-medium">{svc.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono italic">Latency: {svc.latency}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] font-bold ${svc.online
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
              >
                {svc.status}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
