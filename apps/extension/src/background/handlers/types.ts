import type { MessageResponse } from "@/types/messages";

export interface HandlerContext {
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
}

export type MessageHandler = (
  payload: unknown,
  ctx: HandlerContext
) => Promise<MessageResponse>;
