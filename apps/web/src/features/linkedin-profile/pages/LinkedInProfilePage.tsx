import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as linkedinApi from "@/api/linkedin.api";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { ProfileStrength } from "@/components/dashboard/ProfileStrength";
import { Card, Input, Button, Alert, Loader } from "@/components/ui";

export default function LinkedInProfilePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["linkedinProfile"],
    queryFn: linkedinApi.getLinkedInProfile,
  });

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      linkedinUrl: "",
      headline: "",
      about: "",
      skills: "",
      connections: 0,
      followers: 0,
      experience: [{ title: "", company: "", duration: "" }],
      education: [{ school: "", degree: "", year: "" }],
    },
  });

  const expFields = useFieldArray({ control, name: "experience" });
  const eduFields = useFieldArray({ control, name: "education" });

  useEffect(() => {
    if (data) {
      reset({
        linkedinUrl: data.linkedinUrl ?? "",
        headline: data.headline ?? "",
        about: data.about ?? "",
        skills: data.skills?.join(", ") ?? "",
        connections: data.connections ?? 0,
        followers: data.followers ?? 0,
        experience: data.experience?.length ? data.experience : [{ title: "", company: "", duration: "" }],
        education: data.education?.length ? data.education : [{ school: "", degree: "", year: "" }],
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (form: Record<string, unknown>) =>
      linkedinApi.updateLinkedInProfile({
        ...form,
        skills: String(form.skills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      } as Parameters<typeof linkedinApi.updateLinkedInProfile>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedinProfile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardOverview"] });
    },
  });

  if (isLoading) return <Loader />;

  return (
    <div>
      <Breadcrumbs items={[{ label: "LinkedIn Profile" }]} />
      <h1 className="text-2xl font-bold text-white mb-2">LinkedIn Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manual edit — automatic sync coming in a future phase.
        {data?.lastSyncedAt && (
          <span className="ml-2">Last updated: {new Date(data.lastSyncedAt).toLocaleString()}</span>
        )}
      </p>

      <Card animate={false} className="mb-6 !p-5">
        <ProfileStrength score={data?.profileScore ?? 0} label="LinkedIn profile score" />
      </Card>

      {mutation.isSuccess && <Alert variant="success" message="LinkedIn profile saved" className="mb-4" />}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <Card animate={false}>
          <h2 className="font-semibold text-white mb-4">Basic info</h2>
          <div className="space-y-4">
            <Input label="LinkedIn URL" {...register("linkedinUrl")} />
            <Input label="Headline" {...register("headline")} />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">About</label>
              <textarea className="w-full rounded-lg border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm text-white min-h-[100px]" {...register("about")} />
            </div>
            <Input label="Skills (comma-separated)" {...register("skills")} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Connections" type="number" {...register("connections")} />
              <Input label="Followers" type="number" {...register("followers")} />
            </div>
          </div>
        </Card>

        <Card animate={false}>
          <h2 className="font-semibold text-white mb-4">Experience</h2>
          {expFields.fields.map((field, i) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-3 mb-4 pb-4 border-b border-surface-border last:border-0">
              <Input label="Title" {...register(`experience.${i}.title`)} />
              <Input label="Company" {...register(`experience.${i}.company`)} />
              <Input label="Duration" {...register(`experience.${i}.duration`)} />
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => expFields.append({ title: "", company: "", duration: "" })}>
            + Add experience
          </Button>
        </Card>

        <Card animate={false}>
          <h2 className="font-semibold text-white mb-4">Education</h2>
          {eduFields.fields.map((field, i) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-3 mb-4 pb-4 border-b border-surface-border last:border-0">
              <Input label="School" {...register(`education.${i}.school`)} />
              <Input label="Degree" {...register(`education.${i}.degree`)} />
              <Input label="Year" {...register(`education.${i}.year`)} />
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => eduFields.append({ school: "", degree: "", year: "" })}>
            + Add education
          </Button>
        </Card>

        <Button type="submit" isLoading={mutation.isPending}>Save LinkedIn profile</Button>
      </form>
    </div>
  );
}
