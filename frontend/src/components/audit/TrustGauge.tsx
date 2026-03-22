import { motion } from "framer-motion";

interface TrustGaugeProps {
  score: number;
}

export function TrustGauge({ score }: TrustGaugeProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  const strokeColor = score >= 80 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${color}`}>
          {score}
        </span>
      </div>
      <div>
        <p className={`text-sm font-semibold ${color}`}>Trust Score</p>
        <p className="text-xs text-muted-foreground">{score >= 80 ? "High confidence" : score >= 50 ? "Review needed" : "Low confidence"}</p>
      </div>
    </div>
  );
}
