import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { FileDropzone } from "@/components/dashboard/FileDropzone";
import { DocumentTable } from "@/components/dashboard/DocumentTable";
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Overview from "@/pages/Overview";
import Settings from "@/pages/Settings";
import ApiKeys from "@/pages/ApiKeys";
import Analytics from "@/pages/Analytics";
import AuditWorkspace from "@/pages/AuditWorkspace";
import { documentService } from "@/api/documentService";
import { authService } from "@/api/authService";
import { toast } from "sonner";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";


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
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [user, setUser] = useState(null);

  const confirmDelete = (id: string) => {
    setDocToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await documentService.getDocuments();
        // data will look like: [{id: "4", name: "adhil_original.pdf", date: "Mar 23", ...}]
        setUploadedDocs(data);
      } catch (err) {
        console.error("Failed to fetch docs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    const syncSession = async () => {
      try {
        // This triggers the authApi interceptor immediately
        const userData = await authService.getCurrentUser();
        setUser(userData);
        console.log("Session synced successfully");
      } catch (err) {
        // Interceptor handles the redirect to /login if refresh fails
        console.error("Session sync failed");
      }
    };

    syncSession();
  }, []);

  const handleFilesDropped = async (files: File[]) => {
    for (const file of files) {
      const tempId = crypto.randomUUID();

      // 1. Create the single temp entry
      const newDoc: UploadedDoc = {
        id: tempId,
        name: file.name,
        date: "Uploading...",
        status: "pending",
        score: null,
      };

      // 2. Add it to the UI
      setUploadedDocs((prev) => [newDoc, ...prev]);

      try {
        // 1. Upload to Django to get the Database ID (e.g., 8)
        const djangoResult = await documentService.upload(file);
        const realDocId = djangoResult.document.id.toString();

        // 2. NEW: Now send the file AND the ID to FastAPI for Vector Processing
        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_id', realDocId); // This fixes the 422 error!

        await axios.post('http://localhost:8001/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        // 3. Update the UI as you were doing before
        setUploadedDocs((prev) =>
          prev.map((doc) =>
            doc.id === tempId
              ? {
                ...doc,
                id: realDocId,
                name: djangoResult.document.filename,
                date: "Mar 23",
                status: "success",
              }
              : doc
          )
        );
        toast.success(`${file.name} uploaded and indexed!`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
        setUploadedDocs((prev) => prev.filter((d) => d.id !== tempId));
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {

    try {
      // 1. Call the service we updated earlier
      await documentService.deleteDocument(docId);

      // 2. Update the local UI state instantly
      setUploadedDocs((prev) => prev.filter((doc) => doc.id !== docId));

      toast.success("Document deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete the document from the server.");
    } finally {
      // 3. Close the modal and reset the ID
      setIsDeleteDialogOpen(false);
      setDocToDelete(null);
    }
  };

  const updateDocScore = async (docId: string, newScore: number) => {
    // 1. Standardize: If AI gives 0.81, we save 81.
    const standardizedScore = Math.round(newScore * 100);

    // 2. Update UI instantly (Optimistic Update)
    setUploadedDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, score: standardizedScore } : doc
      )
    );

    // 3. Persist to Django so it survives a Refresh
    try {
      await documentService.updateScore(docId, standardizedScore);
      console.log("Database updated successfully");
    } catch (err) {
      console.error("Failed to save score to Django", err);
    }
  };

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
  const crumbs = breadcrumbMap[pathname] || breadcrumbMap["/dashboard"];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <TopBar breadcrumbs={crumbs} user={user} />
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
                  <DocumentTable
                    documents={uploadedDocs} isLoading={isLoading} onDelete={confirmDelete} />
                </div>
              } />
              <Route
                path="audit/:id"
                element={<AuditWorkspace onAuditComplete={updateDocScore} />}
              />
              <Route path="analytics" element={<Analytics documents={uploadedDocs} />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              document and remove it from the Sentinel audit index.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => docToDelete && handleDeleteDocument(docToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
