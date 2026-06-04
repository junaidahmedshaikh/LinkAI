import type { IResume } from "@linkai/types";
import { Button } from "@/components/ui";
import { assetUrl } from "@/constants/config";
import { cn } from "@/utils/cn";

interface ResumeCardProps {
  resume: IResume;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  isDeleting?: boolean;
}

export function ResumeCard({ resume, onDelete, onSetPrimary, isDeleting }: ResumeCardProps) {
  const sizeKb = Math.round(resume.fileSize / 1024);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        resume.isPrimary ? "border-accent/40 bg-accent/5" : "border-surface-border bg-surface-card/60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{resume.fileName}</p>
          <p className="text-xs text-muted mt-1">{sizeKb} KB · {new Date(resume.createdAt).toLocaleDateString()}</p>
          {resume.isPrimary && (
            <span className="inline-block mt-2 text-[10px] uppercase font-medium text-accent">Primary</span>
          )}
          {resume.parsedData?.skills && resume.parsedData.skills.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              Skills: {resume.parsedData.skills.slice(0, 5).join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <a href={assetUrl(resume.fileUrl)} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm">View</Button>
          </a>
          {!resume.isPrimary && (
            <Button variant="secondary" size="sm" onClick={() => onSetPrimary(resume._id)}>
              Set primary
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onDelete(resume._id)} isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
