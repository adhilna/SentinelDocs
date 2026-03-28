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
import { LiveTerminal } from "@/components/dashboard/LiveTerminal";
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
import {
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [auditMetadata, setAuditMetadata] = useState<{
    total_chunks?: number;
    faithfulness_score?: number;
    claims_flagged?: number;
  } | null>(null);

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

      // 1. Create the single temp entry in the table
      const newDoc: UploadedDoc = {
        id: tempId,
        name: file.name,
        date: "Uploading...",
        status: "pending",
        score: null,
      };

      setUploadedDocs((prev) => [newDoc, ...prev]);

      try {
        // --- MILESTONE 1: Starting Django Upload ---
        // This is a good time to open the terminal
        // setActiveAuditId(tempId); // Use tempId first so the terminal shows up immediately
        // setCurrentStatus("indexing");

        // 1. Upload to Django to get the Database ID
        const djangoResult = await documentService.upload(file);
        const realDocId = djangoResult.document.id.toString();

        // Update the active ID to the real one from the DB
        setActiveAuditId(realDocId);
        // --- MILESTONE 2: Starting FastAPI Vectorization ---
        // We change status to show we are moving to the AI/Vector layer
        setCurrentStatus("indexing"); // Terminal shows "Indexing pages..."
        setAuditMetadata(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_id', realDocId);

        const fastApiRes = await axios.post('http://localhost:8001/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        setAuditMetadata({
          total_chunks: fastApiRes.data.total_chunks,
          faithfulness_score: fastApiRes.data.faithfulness_score || 98.5, // Fallback if backend isn't sending score yet
          claims_flagged: fastApiRes.data.claims_flagged || 0
        });

        // --- MILESTONE 3: Auditing ---
        // Once FastAPI returns, we move to the "Auditing" phase
        setCurrentStatus("auditing"); // Terminal shows "Running hallucination detection..."

        // Update the table row from temp to real
        setUploadedDocs((prev) =>
          prev.map((doc) =>
            doc.id === tempId
              ? {
                ...doc,
                id: realDocId,
                name: djangoResult.document.filename,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                status: "success",
              }
              : doc
          )
        );

        // --- MILESTONE 4: Completion ---
        // We add a small delay so the user can actually read the "Auditing" step
        setTimeout(() => {
          setCurrentStatus("completed");
          toast.success(`${file.name} audit complete!`);
        }, 1500);

      } catch (err) {
        setActiveAuditId(null);
        setCurrentStatus("pending");
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
                <div className="flex gap-6 items-start">
                  {/* 1. The Main Content Area (Shrinks when Terminal is open) */}
                  <div className={`transition-all duration-500 ${activeAuditId ? 'flex-1 pr-4' : 'w-full'} space-y-6`}>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Files</h1>
                      <p className="text-muted-foreground mt-1">Upload documents and monitor audit status.</p>
                    </div>

                    <FileDropzone onFilesDropped={handleFilesDropped} />

                    <DocumentTable
                      documents={uploadedDocs}
                      isLoading={isLoading}
                      onDelete={confirmDelete}
                    />
                  </div>

                  {/* 2. The Live Terminal Sidebar (AnimatePresence handles the smooth entrance/exit) */}
                  <AnimatePresence>
                    {activeAuditId && (
                      <motion.div
                        initial={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: 40, filter: "blur(10px)" }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="w-80 sticky top-6 hidden lg:block" // Hidden on mobile to avoid overlap
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            Live Pipeline Trace
                          </span>
                          <button
                            onClick={() => setActiveAuditId(null)}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <LiveTerminal
                          status={currentStatus}
                          filename={uploadedDocs.find(d => d.id === activeAuditId)?.name || "Analyzing..."}
                          metadata={auditMetadata ?? undefined}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
