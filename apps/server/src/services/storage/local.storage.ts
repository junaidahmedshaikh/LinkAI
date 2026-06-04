import fs from "fs/promises";
import path from "path";
import { env } from "../../config/env";
import type { IStorageProvider, StoredFile } from "./storage.interface";

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(env.UPLOAD_DIR);
  }

  getPublicUrl(relativePath: string): string {
    return `/uploads/${relativePath.replace(/\\/g, "/")}`;
  }

  async save(file: Express.Multer.File, subPath: string): Promise<StoredFile> {
    const dir = path.join(this.baseDir, subPath);
    await fs.mkdir(dir, { recursive: true });

    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(dir, safeName);
    await fs.writeFile(filePath, file.buffer);

    const relativePath = path.join(subPath, safeName);
    return {
      fileName: file.originalname,
      filePath,
      publicUrl: this.getPublicUrl(relativePath),
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // file may already be removed
    }
  }
}
