import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiService } from "../../api/aiService"
import { AxiosError } from "axios";
import { MarkdownRenderer } from "@/components/audit/MarkdownRenderer";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}
type AskResponse = {
  answer?: string;
};

type ErrorResponse = {
  detail?: string;
  message?: string;
};

export function AiChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", content: "Hi! Ask me anything about SentinelDocs." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    // 1. Basic validation
    if (!text || loading) return;

    // 2. UI Updates: Clear input and add user message locally
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
    ]);
    setLoading(true);

    try {
      // 3. 🎯 Use the centralized service (Public Endpoint)
      // No need to pass a doc_id or handle headers here; the service does it!
      const data = await aiService.sendEnquiry(text);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.answer ?? "I'm sorry, I couldn't find an answer to that.",
        },
      ]);
    } catch (error: unknown) {
      // 4. Error Handling
      let message = "I'm having trouble connecting right now.";

      if (error instanceof AxiosError) {
        const errData = error.response?.data as ErrorResponse | undefined;
        // Fallback to specific backend error messages if they exist
        message = errData?.detail || errData?.message || message;
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: message },
      ]);
    } finally {
      // 5. Always stop the loading spinner
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            // 🎯 INCREASED SIZE: w-96 (24rem) and h-[32rem] for a "Pro" feel
            className="w-96 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "32rem" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight">SentinelDocs AI</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Support Agent</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col gap-1.5 max-w-[90%]",
                    m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none shadow-sm"
                        : "bg-muted/50 border border-border/50 text-foreground rounded-bl-none w-full"
                    )}
                  >
                    {/* 🎯 INTEGRATED MARKDOWN RENDERER */}
                    {m.role === "ai" ? (
                      <MarkdownRenderer content={m.content} className="prose-p:leading-relaxed" />
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs animate-pulse pl-1">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Thinking...
                </div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-4 bg-background border-t border-border"
            >
              <div className="relative flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="pr-12 h-11 rounded-xl bg-muted/20 border-border/60 focus-visible:ring-primary/20"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || loading}
                  className="absolute right-1.5 h-8 w-8 rounded-lg active:scale-90 transition-transform"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Powered by SentinelDocs RAG Engine
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:shadow-primary/40 transition-all border-4 border-background"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}