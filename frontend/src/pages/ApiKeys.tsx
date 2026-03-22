import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Key, Plus, Copy, Trash2, Check } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
}

const generateKey = () =>
  `sk-sentinel-${Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("")}`;

const entrance = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: "1", name: "Production Key", key: "sk-sentinel-a8f3k29d...x4m1", created: "2025-12-01", lastUsed: "2 hours ago", status: "active" },
    { id: "2", name: "Staging Key", key: "sk-sentinel-p7w2n81b...q9r3", created: "2025-11-15", lastUsed: "3 days ago", status: "active" },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!newKeyName.trim()) return;
    const fullKey = generateKey();
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName.trim(),
      key: fullKey,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "active",
    };
    setKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    setRevealedKey(newKey.id);
    toast({ title: "API key generated", description: "Copy it now — you won't see the full key again." });
  };

  const handleCopy = (key: ApiKey) => {
    navigator.clipboard.writeText(key.key);
    setCopiedId(key.id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)));
    toast({ title: "API key revoked", description: "This key can no longer authorize requests." });
  };

  return (
    <div className="space-y-8">
      <motion.div initial="hidden" animate="show" variants={entrance} custom={0}>
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-1">Manage keys that authorize requests to your FastAPI AI service.</p>
      </motion.div>

      {/* Generate New Key */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={1}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Generate New Key</CardTitle>
                <CardDescription>Create a key to connect your frontend to the FastAPI service.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Key name, e.g. Production"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="max-w-xs"
              />
              <Button onClick={handleGenerate} disabled={!newKeyName.trim()} className="active:scale-[0.97] transition-transform">
                <Key className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key List */}
      <motion.div initial="hidden" animate="show" variants={entrance} custom={2}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Keys</CardTitle>
            <CardDescription>{keys.filter((k) => k.status === "active").length} key(s) in use</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {keys.map((apiKey) => (
                    <motion.tr
                      key={apiKey.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {revealedKey === apiKey.id ? apiKey.key : apiKey.key.slice(0, 18) + "..."}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{apiKey.created}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{apiKey.lastUsed}</TableCell>
                      <TableCell>
                        <Badge variant={apiKey.status === "active" ? "default" : "secondary"}
                          className={apiKey.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : ""}
                        >
                          {apiKey.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => handleCopy(apiKey)}
                            disabled={apiKey.status === "revoked"}
                            className="h-8 w-8 active:scale-[0.95] transition-transform"
                          >
                            {copiedId === apiKey.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => handleRevoke(apiKey.id)}
                            disabled={apiKey.status === "revoked"}
                            className="h-8 w-8 text-destructive hover:text-destructive active:scale-[0.95] transition-transform"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
