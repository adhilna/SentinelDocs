import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { TrustGauge } from "@/components/audit/TrustGauge";
import { SourceVerification } from "@/components/audit/SourceVerification";
import { ExecutionTrace } from "@/components/audit/ExecutionTrace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { documentService } from "@/api/documentService";
import { aiService } from "@/api/aiService";
import { MarkdownRenderer } from "@/components/audit/MarkdownRenderer";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  content: string;
  trustScore?: number;
  sources?: { page: number; paragraph: string; relevance: number }[];
  latencyMs?: number;
  traceId?: string;
}

interface UploadedDoc {
  id: string;
  name: string;
  date: string;
  status: string;
  score: number | null;
  url?: string; // Important for the PDF viewer!
}

interface AuditWorkspaceProps {
  onAuditComplete: (docId: string, score: number) => void;
}

export default function AuditWorkspace({ onAuditComplete }: AuditWorkspaceProps) {
  const { id } = useParams();
  const [selectedDoc, setSelectedDoc] = useState<UploadedDoc | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  useEffect(() => {
    const loadDoc = async () => {
      try {
        const docs = await documentService.getDocuments();
        const found = docs.find((d: UploadedDoc) => String(d.id) === String(id));

        if (found) {
          setSelectedDoc(found);
          // Optional: Set a real initial message once doc is found
          setMessages([
            {
              role: "ai",
              content: `I've loaded ${found.name}. I'm ready to help you audit its contents. What would you like to know?`,
              trustScore: 100,
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading document:", err);
      }
    };

    if (id) loadDoc();
  }, [id]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedDoc) return;

    setLoading(true);
    // 1. Add User Message immediately for snappy UI
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      // 2. Call your FastAPI /ask endpoint
      // Pass the selectedDoc.id so FastAPI knows which vector collection to query
      const response = await aiService.askQuestion(currentInput, selectedDoc.id);

      if (onAuditComplete) {
        onAuditComplete(selectedDoc.id, response.confidence_score);
      }

      const aiMsg: Message = {
        role: "ai",
        content: response.answer,
        trustScore: response.confidence_score, // Real score from your AI logic
        sources: response.sources, // The real text chunks from the PDF
        latencyMs: response.execution_time,
        traceId: response.trace_id,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      // Provide a helpful fallback message
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "I'm having trouble reaching the audit engine. Please ensure FastAPI is running on port 8001." }
      ]);
    } finally {
      setLoading(false); // 🎯 Stop loading (always runs)
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
      {/* Left Panel: PDF Viewer */}
      <div className="hidden lg:flex w-1/2 flex-shrink-0 overflow-hidden border-r border-border/60 flex-col bg-white dark:bg-slate-900/40">
        {/* Refined Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold truncate max-w-[280px] text-foreground">
                {selectedDoc?.name || "Loading Document..."}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Source Document
              </span>
            </div>
          </div>
        </div>

        {/* PDF Container with soft inner shadow */}
        <div className="flex-1 w-full h-full relative group">
          {selectedDoc?.url ? (
            <iframe
              src={`${selectedDoc.url}#toolbar=0&navpanes=0`}
              className="w-full h-full grayscale-[0.1] hover:grayscale-0 transition-all duration-500"
              title="PDF Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Synchronizing Vectors...</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="w-1/2 flex flex-col flex-shrink-0 overflow-hidden bg-transparent">
        {/* Chat Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth custom-scrollbar bg-dot-slate-200 dark:bg-dot-slate-800"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col gap-3",
                msg.role === "user" ? "items-end" : "items-start"
              )}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-none bg-primary px-5 py-3 text-sm text-primary-foreground shadow-lg shadow-primary/20 leading-relaxed">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-[92%] space-y-4">
                  {/* AI Brand Header */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Sentinel Audit Logic
                    </span>
                  </div>

                  {/* Response Card */}
                  <div className="rounded-2xl rounded-bl-none border border-border/80 bg-card/80 backdrop-blur-sm px-6 py-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <MarkdownRenderer content={msg.content} />
                  </div>

                  {/* Audit Tools & Meta (Trust/Sources) */}
                  <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    {msg.trustScore != null && (
                      <div className="bg-muted/30 rounded-xl p-4 border border-border/40 inline-block self-start">
                        <TrustGauge score={msg.trustScore} />
                      </div>
                    )}

                    <div className="space-y-3">
                      {msg.sources && <SourceVerification sources={msg.sources} />}
                      {msg.latencyMs && msg.traceId && (
                        <div className="border-t border-border/30 pt-3">
                          <ExecutionTrace latencyMs={msg.latencyMs} traceId={msg.traceId} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Modern Floating Input Area */}
        <div className="p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative group max-w-3xl mx-auto flex items-center"
          >
            {/* 🎯 ADD -z-10 HERE to move the glow behind the input */}
            <div className="absolute inset-0 -z-10 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />

            <Input
              placeholder="Audit this clause..."
              value={input}
              autoFocus // 🎯 Force focus on load
              onChange={(e) => setInput(e.target.value)}
              // 🎯 ADD z-10 and relative to ensure the input is clickable
              className="relative z-10 flex-1 h-14 pl-6 pr-16 rounded-2xl border-border/80 bg-background shadow-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all text-base"
            />

            <Button
              disabled={!input.trim() || loading}
              type="submit"
              size="icon"
              // 🎯 ADD z-20 to ensure the button is above the input
              className="absolute right-2.5 z-20 h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-tighter opacity-50">
            Encryption Active • AI Hallucination Guard Enabled
          </p>
        </div>
      </div>
    </div>
  );
};