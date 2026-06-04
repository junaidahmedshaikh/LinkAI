import type { ApiResponse, IResume } from "@linkai/types";
import { API_ROUTES } from "@linkai/shared";
import { apiClient } from "./axios";

export async function getResumes(): Promise<IResume[]> {
  const { data } = await apiClient.get<ApiResponse<{ resumes: IResume[] }>>(API_ROUTES.RESUMES.BASE);
  return data.data!.resumes;
}

export async function uploadResume(file: File): Promise<IResume> {
  const formData = new FormData();
  formData.append("resume", file);
  const { data } = await apiClient.post<ApiResponse<{ resume: IResume }>>(
    API_ROUTES.RESUMES.UPLOAD,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data!.resume;
}

export async function deleteResume(id: string): Promise<void> {
  await apiClient.delete(API_ROUTES.RESUMES.BY_ID(id));
}

export async function setPrimaryResume(id: string): Promise<IResume> {
  const { data } = await apiClient.put<ApiResponse<{ resume: IResume }>>(
    API_ROUTES.RESUMES.PRIMARY(id)
  );
  return data.data!.resume;
}
