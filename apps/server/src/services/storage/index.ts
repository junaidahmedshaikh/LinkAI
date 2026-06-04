import { LocalStorageProvider } from "./local.storage";
import type { IStorageProvider } from "./storage.interface";

let storageInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageInstance) {
    storageInstance = new LocalStorageProvider();
  }
  return storageInstance;
}

export type { IStorageProvider, StoredFile } from "./storage.interface";
