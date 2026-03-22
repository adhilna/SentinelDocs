import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Activity, Key } from "lucide-react";

const stats = [
  { label: "Total Documents", value: "128", change: "+12 this week", icon: FileText, color: "text-primary" },
  { label: "AI Audits Completed", value: "94", change: "73% completion", icon: Shield, color: "text-emerald-400" },
  { label: "API Usage", value: "2,847", change: "requests this month", icon: Activity, color: "text-amber-400" },
  { label: "Active API Keys", value: "3", change: "1 generated today", icon: Key, color: "text-sky-400" },
];

const entrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Overview() {
  return (
    <div className="space-y-8">
      <motion.div initial="hidden" animate="show" variants={entrance} custom={0}>
        <h1 className="text-2xl font-bold tracking-tight">Guardian View</h1>
        <p className="text-muted-foreground mt-1">High-level summary of your SentinelDocs workspace.</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
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
