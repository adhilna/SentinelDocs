import { Upload, FileText } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";

interface FileDropzoneProps {
  onFilesDropped?: (files: File[]) => void;
}

export function FileDropzone({ onFilesDropped }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent, entering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(entering);
  }, []);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pdfFiles = Array.from(files).filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    pdfFiles.forEach((f) => console.log("[SentinelDocs] File received:", f.name, `(${(f.size / 1024).toFixed(1)} KB)`));
    if (pdfFiles.length > 0) onFilesDropped?.(pdfFiles);
  }, [onFilesDropped]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors duration-200 ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
        }`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => handleDrag(e, true)}
      onDragOver={(e) => handleDrag(e, true)}
      onDragLeave={(e) => handleDrag(e, false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          {isDragging ? <FileText className="h-6 w-6 text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
        </div>
        <div>
          <p className="font-medium">
            {isDragging ? "Drop your PDF here" : "Drag & drop PDFs to audit"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse · PDF up to 50MB
          </p>
        </div>
      </div>
    </motion.div>
  );
}
