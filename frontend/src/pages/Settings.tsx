import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, Brain, Eye, Zap } from "lucide-react";

const entrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Settings() {
  return (
    <div className="space-y-8">
      <motion.div initial="hidden" animate="show" variants={entrance} custom={0}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and AI preferences.</p>
      </motion.div>

      {/* Profile Section */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={1}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Your account details linked to your Django backend.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">MR</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Marcus Reeves</p>
                <p className="text-sm text-muted-foreground">marcus.reeves@sentineldocs.io</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue="Marcus Reeves" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="marcus.reeves@sentineldocs.io" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization</Label>
                <Input id="org" defaultValue="Reeves Legal Group" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Lead Auditor" disabled className="opacity-70" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="active:scale-[0.97] transition-transform">Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security / AI Feature Toggles */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={2}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Security & AI Features</CardTitle>
                <CardDescription>Control which AI capabilities are active on your account.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { icon: Brain, label: "Hallucination Detection", desc: "Flag AI responses that aren't grounded in source documents.", defaultOn: true },
              { icon: Eye, label: "Source Verification", desc: "Automatically highlight PDF regions referenced by the AI.", defaultOn: true },
              { icon: Zap, label: "Auto-Audit on Upload", desc: "Run a full audit pass immediately when a document is uploaded.", defaultOn: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <Switch defaultChecked={item.defaultOn} />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
