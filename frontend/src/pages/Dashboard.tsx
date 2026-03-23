import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { FileDropzone } from "@/components/dashboard/FileDropzone";
import { DocumentTable } from "@/components/dashboard/DocumentTable";
import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Overview from "@/pages/Overview";
import Settings from "@/pages/Settings";
import ApiKeys from "@/pages/ApiKeys";
import Analytics from "@/pages/Analytics";
import { documentService } from "@/api/documentService";
import { toast } from "sonner";

interface UploadedDoc {
  id: string;
  name: string;
  date: string;
  status: "pending" | "success" | "error";
  score: number | null;
}

const breadcrumbMap: Record<string, { label: string }[]> = {
  "/dashboard": [{ label: "Dashboard" }, { label: "Overview" }],
  "/dashboard/files": [{ label: "Dashboard" }, { label: "Files" }],
  "/dashboard/analytics": [{ label: "Dashboard" }, { label: "Analytics" }],
  "/dashboard/api-keys": [{ label: "Dashboard" }, { label: "API Keys" }],
  "/dashboard/settings": [{ label: "Dashboard" }, { label: "Settings" }],
};

export default function Dashboard() {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const handleFilesDropped = async (files: File[]) => {
    // 1. Create temporary UI entries (Optimistic Update)
    const tempDocs: UploadedDoc[] = files.map((f) => ({
      id: crypto.randomUUID(), // Temp ID
      name: f.name,
      date: "Uploading...",
      status: "pending" as const,
      score: null,
    }));

    setUploadedDocs((prev) => [...tempDocs, ...prev]);

    // 2. Loop through and upload each file to Django
    for (const file of files) {
      try {
        const result = await documentService.upload(file);

        // 3. Replace the temp entry with real data from backend
        setUploadedDocs((prev) =>
          prev.map(doc =>
            doc.name === file.name ? {
              ...doc,
              id: result.document.id,
              date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              status: "success" // Or whatever your status logic is
            } : doc
          )
        );
        toast.success(`${file.name} uploaded!`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
        // Remove failed upload from UI
        setUploadedDocs((prev) => prev.filter(d => d.name !== file.name));
      }
    }
  };

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
  const crumbs = breadcrumbMap[pathname] || breadcrumbMap["/dashboard"];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar breadcrumbs={crumbs} />
          <main className="flex-1 p-6 max-w-5xl">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="files" element={
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Files</h1>
                    <p className="text-muted-foreground mt-1">Upload documents and monitor audit status.</p>
                  </div>
                  <FileDropzone onFilesDropped={handleFilesDropped} />
                  <DocumentTable extraDocs={uploadedDocs} />
                </div>
              } />
              <Route path="analytics" element={<Analytics />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
