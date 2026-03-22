import { useState } from "react";
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

interface Message {
  role: "user" | "ai";
  content: string;
  trustScore?: number;
  sources?: { page: number; paragraph: string; relevance: number }[];
  latencyMs?: number;
  traceId?: string;
}

const initialMessages: Message[] = [
  {
    role: "ai",
    content: "I've analyzed api-reference-v3.pdf. The document contains 247 pages covering REST endpoints, authentication flows, and webhook configurations. What would you like to audit?",
    trustScore: 97,
    sources: [
      { page: 1, paragraph: "This document provides a comprehensive reference for the SentinelDocs REST API v3...", relevance: 0.98 },
    ],
    latencyMs: 342,
    traceId: "abc123def456",
  },
];

export default function AuditWorkspace() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    const aiMsg: Message = {
      role: "ai",
      content: `Based on my analysis, the section on "${input}" is covered on pages 42-47. The documentation accurately describes the authentication flow using JWT tokens with RS256 signing. I found no hallucinated claims in this section.`,
      trustScore: 91,
      sources: [
        { page: 42, paragraph: "Authentication is handled via JWT tokens signed with RS256. Tokens expire after 3600 seconds...", relevance: 0.94 },
        { page: 45, paragraph: "Refresh tokens can be used to obtain new access tokens without re-authentication...", relevance: 0.87 },
      ],
      latencyMs: 518,
      traceId: "ghi789jkl012",
    };
    setMessages([...messages, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar breadcrumbs={[{ label: "Dashboard" }, { label: "Files" }, { label: "api-reference-v3.pdf" }]} />
          <div className="flex-1 flex min-h-0">
            {/* Left Panel: PDF Viewer */}
            <div className="hidden lg:flex w-1/2 border-r border-border flex-col">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">api-reference-v3.pdf</span>
              </div>
              <div className="flex-1 flex items-center justify-center bg-muted/20 p-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">PDF Viewer</p>
                  <p className="text-sm mt-1">Document preview renders here</p>
                </div>
              </div>
            </div>

            {/* Right Panel: Chat */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={`${msg.role === "user" ? "ml-auto max-w-md" : "max-w-lg"}`}
                  >
                    {msg.role === "user" ? (
                      <div className="rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm leading-relaxed">
                          {msg.content}
                        </div>
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
              </div>

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
