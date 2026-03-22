import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Doc {
  id: string;
  name: string;
  date: string;
  status: string;
  score: number | null;
}

const staticDocs: Doc[] = [
  { id: "1", name: "api-reference-v3.pdf", date: "Mar 18, 2026", status: "complete", score: 94.7 },
  { id: "2", name: "onboarding-guide.pdf", date: "Mar 17, 2026", status: "flagged", score: 72.3 },
  { id: "3", name: "security-whitepaper.pdf", date: "Mar 15, 2026", status: "pending", score: null },
  { id: "4", name: "changelog-2026-q1.pdf", date: "Mar 14, 2026", status: "complete", score: 98.1 },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  complete: { label: "Audited", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  audited: { label: "Audited", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  in_progress: { label: "In Progress", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  flagged: { label: "Flagged", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
};

interface DocumentTableProps {
  extraDocs?: Doc[];
}

export function DocumentTable({ extraDocs = [] }: DocumentTableProps) {
  const allDocs = [...extraDocs, ...staticDocs];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold">Recent Documents</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {allDocs.map((doc) => {
            const st = statusConfig[doc.status] || statusConfig.pending;
            return (
              <TableRow key={doc.id}>
                <TableCell className="font-medium font-mono text-sm">{doc.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{doc.date}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={st.className}>{st.label}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums font-mono text-sm">
                  {doc.score != null ? `${doc.score}%` : "—"}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 active:scale-[0.95] transition-transform">
                    <Link to={`/audit/${doc.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </motion.div>
  );
}
