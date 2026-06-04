import path from "path";
import { Resume, IResumeDocument } from "../models/Resume.model";
import { getStorageProvider } from "./storage";
import { resumeParserService } from "./resume-parser.service";
import { activityService } from "./activity.service";
import { env } from "../config/env";
import type { IResume } from "@linkai/types";

class ResumeService {
  async upload(userId: string, file: Express.Multer.File): Promise<IResumeDocument> {
    const storage = getStorageProvider();
    const stored = await storage.save(file, `${userId}/resumes`);

    let parsedData;
    try {
      parsedData = await resumeParserService.parseFile(stored.filePath, stored.mimeType);
    } catch {
      parsedData = { skills: [], experience: [], education: [], projects: [], certifications: [], rawText: "" };
    }

    const count = await Resume.countDocuments({ userId });
    const resume = await Resume.create({
      userId,
      fileName: stored.fileName,
      fileUrl: stored.publicUrl,
      fileSize: stored.size,
      mimeType: stored.mimeType,
      parsedData,
      isPrimary: count === 0,
    });

    await activityService.log(userId, "RESUME_UPLOADED", `Uploaded resume: ${stored.fileName}`, {
      resumeId: resume._id.toString(),
    });

    return resume;
  }

  async list(userId: string): Promise<IResumeDocument[]> {
    return Resume.find({ userId }).sort({ isPrimary: -1, createdAt: -1 });
  }

  async delete(userId: string, resumeId: string): Promise<void> {
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw new Error("Resume not found");

    const storage = getStorageProvider();
    const filePath = path.join(env.UPLOAD_DIR, resume.fileUrl.replace("/uploads/", ""));
    await storage.delete(filePath);
    await Resume.deleteOne({ _id: resumeId });

    if (resume.isPrimary) {
      const next = await Resume.findOne({ userId }).sort({ createdAt: -1 });
      if (next) {
        next.isPrimary = true;
        await next.save();
      }
    }

    await activityService.log(userId, "RESUME_DELETED", `Deleted resume: ${resume.fileName}`);
  }

  async setPrimary(userId: string, resumeId: string): Promise<IResumeDocument> {
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) throw new Error("Resume not found");

    await Resume.updateMany({ userId }, { isPrimary: false });
    resume.isPrimary = true;
    await resume.save();
    return resume;
  }

  serialize(doc: IResumeDocument): IResume {
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      parsedData: doc.parsedData,
      isPrimary: doc.isPrimary,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}

export const resumeService = new ResumeService();
