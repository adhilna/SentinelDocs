import { motion } from "framer-motion";

interface LiveTerminalProps {
    status: string;
    filename: string;
    metadata?: {
        total_chunks?: number;
        faithfulness_score?: number;
        claims_flagged?: number;
    };
}

export const LiveTerminal = ({ status, filename, metadata }: LiveTerminalProps) => {
    const chunkCount = metadata?.total_chunks;
    const auditScore = metadata?.faithfulness_score;
    const flaggedCount = metadata?.claims_flagged;
    return (
        <div className="bg-[#0f172a] rounded-lg border border-slate-800 p-4 font-mono text-[11px] leading-relaxed shadow-2xl w-full">
            {/* Terminal Header Dots */}
            <div className="flex gap-1.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
            </div>

            <div className="space-y-1.5">
                <div className="text-slate-500">$ sentinel audit --file="./{filename}"</div>

                {/* Step 1: Indexing */}
                {(status === "indexing" || status === "auditing" || status === "completed") && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400">
                        {status === "indexing" ? "⠋" : "✓"} Indexing pages...
                    </motion.div>
                )}

                {/* Step 2: Vectorizing & AI Pass */}
                {(status === "auditing" || status === "completed") && (
                    <motion.div className="space-y-1.5">
                        <div className="text-emerald-400">
                            ✓ Built {chunkCount ?? "..."} semantic chunks
                        </div>
                        <div className="text-blue-400">
                            {status === "auditing" ? "⠋" : "✓"} Running hallucination detection...
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Results */}
                {status === "completed" && (
                    <motion.div className="space-y-1.5 pt-1">
                        <div className="text-emerald-400">
                            ✓ Faithfulness score: {auditScore ?? "0"}%
                        </div>
                        <div className="text-amber-400">
                            ⚠ {flaggedCount ?? "0"} claims flagged for review
                        </div>
                        <div className="text-slate-100 font-bold mt-2 border-t border-slate-800 pt-2">
                            ✓ Audit complete. Trace saved to Database.
                        </div>
                    </motion.div>
                )}

                {/* Cursor */}
                {status !== "completed" && (
                    <div className="inline-block w-1.5 h-3 bg-white animate-pulse align-middle ml-1" />
                )}
            </div>
        </div>
    );
};