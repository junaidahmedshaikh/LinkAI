export interface StoredFile {
  fileName: string;
  filePath: string;
  publicUrl: string;
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  save(file: Express.Multer.File, subPath: string): Promise<StoredFile>;
  delete(filePath: string): Promise<void>;
  getPublicUrl(relativePath: string): string;
}
