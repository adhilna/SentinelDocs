import { ChevronDown, FileText } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface Source {
  page: number;
  paragraph: string;
  relevance: number;
}

interface SourceVerificationProps {
  sources: Source[];
}

export function SourceVerification({ sources }: SourceVerificationProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        <FileText className="h-3 w-3" />
        {sources.length} source{sources.length !== 1 ? "s" : ""} verified
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {sources.map((s, i) => (
          <div key={i} className="rounded-lg bg-muted/50 p-3 text-xs border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Page {s.page}</span>
              <span className="text-muted-foreground">{(s.relevance * 100).toFixed(0)}% match</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">"{s.paragraph}"</p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
