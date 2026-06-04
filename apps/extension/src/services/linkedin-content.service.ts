import { MessageType, sendMessage } from "@/services/messaging.service";
import type { ILinkedInPostExtract } from "@linkai/types";

export async function extractActivePostFromTab(): Promise<ILinkedInPostExtract | null> {
  const res = await sendMessage<{ post: ILinkedInPostExtract | null }>(
    { type: MessageType.LINKEDIN_EXTRACT_ACTIVE_POST },
    "tab"
  );
  if (res.success && res.data?.post) return res.data.post;
  return res.data?.post ?? null;
}

export async function insertCommentOnPage(text: string): Promise<boolean> {
  const res = await sendMessage<{ inserted: boolean }>(
    { type: MessageType.AI_INSERT_COMMENT, payload: { text } },
    "tab"
  );
  return res.success && !!res.data?.inserted;
}
