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

interface UploadedDoc {
  id: string;
  name: string;
  date: string;
  status: "pending";
  score: null;
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

  const handleFilesDropped = (files: File[]) => {
    const newDocs: UploadedDoc[] = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "pending" as const,
      score: null,
    }));
    setUploadedDocs((prev) => [...newDocs, ...prev]);
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
