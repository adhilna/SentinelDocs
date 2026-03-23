import { useState } from "react";
import { FileText, BarChart3, Key, Settings, Shield, LayoutDashboard, LogOut, Loader2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { authService } from "@/api/authService";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Files", url: "/dashboard/files", icon: FileText },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "API Keys", url: "/dashboard/api-keys", icon: Key },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Add a tiny delay for a smoother "Luxury" feel
    setTimeout(() => {
      authService.logout();
      setOpen(false);
      navigate("/login");
    }, 600);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`flex items-center gap-2.5 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
          <Shield className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && <span className="font-semibold text-sm tracking-tight">SentinelDocs</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* --- LOGOUT DIALOG --- */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <SidebarMenuButton className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[380px] border-border/50 shadow-2xl">
                <DialogHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                      <LogOut className="h-6 w-6" />
                    </div>
                  </div>
                  <DialogTitle className="text-center text-xl">Confirm Logout</DialogTitle>
                  <DialogDescription className="text-center pt-2">
                    Are you sure you want to log out of your session? You will need to sign in again to access your audits.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                    disabled={isLoggingOut}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex-1 shadow-lg shadow-destructive/20"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : "Logout"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
