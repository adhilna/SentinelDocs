import { ChevronDown, ExternalLink, Clock, Cpu } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface ExecutionTraceProps {
  latencyMs: number;
  traceId: string;
}

export function ExecutionTrace({ latencyMs, traceId }: ExecutionTraceProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        <Cpu className="h-3 w-3" />
        Technical Details
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-lg bg-muted/50 p-3 text-xs border border-border space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" /> FastAPI Latency
            </span>
            <span className="font-medium">{latencyMs}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LangSmith Trace</span>
            <a
              href={`https://smith.langchain.com/t/${traceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              {traceId.slice(0, 8)}…
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
