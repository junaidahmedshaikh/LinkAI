import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as resumeApi from "@/api/resume.api";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { ResumeUploader } from "@/components/dashboard/ResumeUploader";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Loader } from "@/components/ui";

export default function ResumesPage() {
  const queryClient = useQueryClient();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: resumeApi.getResumes,
  });

  const uploadMutation = useMutation({
    mutationFn: resumeApi.uploadResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardOverview"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: resumeApi.deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardOverview"] });
    },
  });

  const primaryMutation = useMutation({
    mutationFn: resumeApi.setPrimaryResume,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });

  if (isLoading) return <Loader />;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Resume Manager" }]} />
      <h1 className="text-2xl font-bold text-white mb-6">Resume Manager</h1>

      <ResumeUploader onUpload={(f) => uploadMutation.mutate(f)} isLoading={uploadMutation.isPending} />

      <div className="mt-8 space-y-4">
        {resumes?.length === 0 ? (
          <EmptyState
            title="No resumes yet"
            description="Upload your first resume to get started with parsing and profile insights."
          />
        ) : (
          resumes?.map((resume) => (
            <ResumeCard
              key={resume._id}
              resume={resume}
              onDelete={(id) => deleteMutation.mutate(id)}
              onSetPrimary={(id) => primaryMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
