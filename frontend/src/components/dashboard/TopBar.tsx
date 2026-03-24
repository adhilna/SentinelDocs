import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

interface TopBarProps {
  breadcrumbs?: { label: string; href?: string }[];
  user?: {
    username: string;
    avatar?: string;
    role?: string;
  } | null;
}

export function TopBar({
  breadcrumbs = [{ label: "Dashboard" }],
  user
}: TopBarProps) {

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : "US";
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 bg-background/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8" />
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <span className={i === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"}>
                {bc.label}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Optional: Show role next to avatar for that "Pro" auditor look */}
        {user?.role && (
          <span className="hidden md:block text-[10px] font-mono text-muted-foreground uppercase tracking-tighter border border-border px-1.5 py-0.5 rounded bg-muted/50">
            {user.role}
          </span>
        )}

        <ThemeToggle />

        <Avatar className="h-8 w-8 border border-border shadow-sm">
          {/* 3. Use the dynamic avatar URL */}
          <AvatarImage src={user?.avatar || ""} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {getInitials(user?.username || "User")}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
