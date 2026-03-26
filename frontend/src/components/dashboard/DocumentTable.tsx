import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Doc {
  id: string;
  name: string;
  date: string;
  status: string;
  score: number | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  complete: { label: "Audited", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  audited: { label: "Audited", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  in_progress: { label: "In Progress", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  flagged: { label: "Flagged", className: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
};

interface DocumentTableProps {
  documents: Doc[];
  isLoading?: boolean;
  onDelete: (id: string) => void;
}

export function DocumentTable({ documents, isLoading, onDelete }: DocumentTableProps) {
  const allDocs = documents || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold">Recent Documents</h3>
        {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Syncing...</span>}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12 text-center">Action</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {allDocs.length === 0 && !isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                No documents found. Upload one above!
              </TableCell>
            </TableRow>
          ) : (
            allDocs.map((doc) => {
              // Standardize status keys (Django might send 'success' instead of 'complete')
              const statusKey = doc.status === 'success' ? 'complete' : doc.status;
              const st = statusConfig[statusKey] || statusConfig.pending;
              return (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium font-mono text-sm">{doc.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={st.className}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(doc.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-sm">
                    {doc.score != null ? `${doc.score}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 active:scale-[0.95] transition-transform">
                      <Link to={`/dashboard/audit/${doc.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
}
