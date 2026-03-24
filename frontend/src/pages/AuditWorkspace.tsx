import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
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

export default function AuditWorkspace() {
  const { id } = useParams();
  const [selectedDoc, setSelectedDoc] = useState<UploadedDoc | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
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

    // 1. Add User Message immediately for snappy UI
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      // 2. Call your FastAPI /ask endpoint
      // Pass the selectedDoc.id so FastAPI knows which vector collection to query
      const response = await aiService.askQuestion(currentInput, selectedDoc.id);

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
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Files", href: "/dashboard/files" },
            { label: selectedDoc?.name || "Loading..." }
          ]} />
          <div className="flex-1 flex min-h-0">
            {/* Left Panel: PDF Viewer */}
            <div className="hidden lg:flex w-1/2 border-r border-border flex-col bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[300px]">
                    {selectedDoc?.name || "Loading..."}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full h-full bg-slate-100">
                {selectedDoc?.url ? (
                  <iframe
                    src={`${selectedDoc.url}#toolbar=0&navpanes=0`}
                    className="w-full h-full"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                    <p>Fetching document...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Chat */}
            <div className="flex-1 flex flex-col h-[calc(100vh-64px)] min-h-0 bg-background/50">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={`${msg.role === "user" ? "ml-auto max-w-md" : "max-w-2xl"}`} // Increased max-width for tables
                  >
                    {msg.role === "user" ? (
                      <div className="rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* AI ICON / BADGE */}
                        <div className="flex items-center gap-2 px-1 mb-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                            Sentinel Audit Analysis
                          </span>
                        </div>

                        <div className="rounded-2xl rounded-bl-md border border-border bg-card/50 backdrop-blur-sm px-5 py-4 shadow-sm">
                          {/* 🎯 THE MAGIC HAPPENS HERE */}
                          <MarkdownRenderer content={msg.content} />
                        </div>

                        {/* GAUGES & METADATA */}
                        <div className="flex flex-wrap items-start gap-4 pl-1">
                          {msg.trustScore != null && <TrustGauge score={msg.trustScore} />}
                        </div>

                        <div className="space-y-2 pl-1">
                          {msg.sources && <SourceVerification sources={msg.sources} />}
                          {msg.latencyMs && msg.traceId && (
                            <ExecutionTrace latencyMs={msg.latencyMs} traceId={msg.traceId} />
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div >

              <div className="border-t border-border p-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Ask about this document..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 shrink-0 active:scale-[0.95] transition-transform">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
