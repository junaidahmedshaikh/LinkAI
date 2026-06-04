import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

interface ResumeUploaderProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export function ResumeUploader({ onUpload, isLoading }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      alert("Only PDF, DOC, and DOCX files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB.");
      return;
    }
    onUpload(file);
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-accent bg-accent/5" : "border-surface-border hover:border-zinc-600"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
      <p className="text-xs text-muted mt-1">PDF, DOC, DOCX — max 5MB</p>
      <Button className="mt-4" onClick={() => inputRef.current?.click()} isLoading={isLoading}>
        Select file
      </Button>
    </div>
  );
}
