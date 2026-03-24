import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("w-full animate-fade-up", className)}>
            <article className={cn(
                // Base prose for Light Mode (Dark text)
                "prose prose-sm md:prose-base max-w-none transition-colors",
                // Invert only when Dark Mode is active (White text)
                "dark:prose-invert",

                // Headings: Use 'foreground' variable so it flips automatically
                "prose-headings:text-foreground prose-headings:font-mono prose-headings:font-light",

                // Tables: Use 'border' variable for the lines
                "prose-tr:border-border/50 prose-th:text-muted-foreground",

                // Bold/Strong: Use 'primary' for that "Sentinel" look
                "prose-strong:text-primary font-bold",

                className
            )}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                </ReactMarkdown>
            </article>
        </div>
    );
}