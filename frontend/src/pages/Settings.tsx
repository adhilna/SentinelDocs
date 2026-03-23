import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, User, Brain, Eye, Zap, Loader2, Camera } from "lucide-react";
import { authService } from "@/api/authService";
import { toast } from "sonner";

const entrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    organization: "",
    role: "",
    avatar: "" // This will be the URL from Django
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setFetching(true); // Start spinning
      try {
        const data = await authService.getCurrentUser();
        console.log("Data received in component:", data);

        // Ensure we map every field, providing defaults for nulls
        setProfile({
          username: data.username || "User",
          email: data.email || "",
          organization: data.organization || "",
          role: data.role || "",
          avatar: data.avatar || ""
        });
      } catch (err) {
        console.error("Fetch error in Settings.tsx:", err);
        toast.error("Failed to sync profile data");
      } finally {
        // THIS MUST RUN to stop the spinner
        setFetching(false);
      }
    };

    loadProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, avatar: previewUrl }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Capture the response from the server
      const responseData = await authService.updateProfile({
        email: profile.email,
        organization: profile.organization,
        role: profile.role,
        avatar: selectedFile
      });

      // 2. Sync the local state with what the server just saved
      // We spread the existing profile and overwrite with the fresh data
      setProfile((prev) => ({
        ...prev,
        ...responseData.data, // This contains the 'TEST_PASSED' values
        avatar: responseData.avatar || prev.avatar // Update with the new URL if returned
      }));

      // 3. Clear the temporary file state since it's now in the DB
      setSelectedFile(null);

      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This is the "Cleanup Function"
    return () => {
      // If the user picked a file but navigated away before saving,
      // or if the component re-renders, we clean up the memory.
      if (profile.avatar && profile.avatar.startsWith('blob:')) {
        URL.revokeObjectURL(profile.avatar);
      }
    };
  }, [profile.avatar]);

  if (fetching) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

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
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
                  <AvatarImage src={profile.avatar} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {profile.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <div>
                <p className="font-medium">@{profile.username}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Organization</Label>
                <Input
                  id="org"
                  value={profile.organization}
                  onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="role">Professional Role</Label>
                <Input
                  id="role"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  placeholder="e.g. Lead Auditor"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="active:scale-[0.97] transition-transform"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
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
};
