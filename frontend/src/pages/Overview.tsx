import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Activity, Key, Loader2 } from "lucide-react";
import { authApi } from "@/api/axiosConfig";

const entrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

interface WorkspaceStats {
  total_documents: number;
  active_keys: number;
  api_usage: string;
  audits_completed: number;
  key_change_label: string;
  docs_this_week_label: string;
}

export default function Overview() {
  const [data, setData] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await authApi.get("/api/documents/summary/");
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const dynamicStats = data ? [
    { label: "Total Documents", value: data.total_documents, change: data.docs_this_week_label, icon: FileText, color: "text-primary" },
    { label: "AI Audits Completed", value: data.audits_completed, change: data.key_change_label, icon: Shield, color: "text-emerald-400" },
    { label: "API Usage", value: data.api_usage, change: "requests this month", icon: Activity, color: "text-amber-400" },
    { label: "Active API Keys", value: data.active_keys, change: "Live from DB", icon: Key, color: "text-sky-400" },
  ] : [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <motion.div initial="hidden" animate="show" variants={entrance} custom={0}>
        <h1 className="text-2xl font-bold tracking-tight">Guardian View</h1>
        <p className="text-muted-foreground mt-1">High-level summary of your SentinelDocs workspace.</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicStats.map((stat, i) => (
          <motion.div key={stat.label} initial="hidden" animate="show" variants={entrance} custom={i + 1}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
