import { useCallback, useEffect, useState } from "react";
import type {
  CommentTone,
  ICommentHistoryItem,
  ILinkedInPostExtract,
} from "@linkai/types";
import { COMMENT_TONES } from "@linkai/types";
import { MessageType, sendMessage } from "@/services/messaging.service";
import {
  extractActivePostFromTab,
  insertCommentOnPage,
} from "@/services/linkedin-content.service";
import { SidebarCard } from "@/components/ui/SidebarCard";
import { Loader } from "@/components/ui/Loader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/utils/cn";

const TONE_LABELS: Record<CommentTone, string> = {
  professional: "Professional",
  "thought-leadership": "Thought Leader",
  friendly: "Friendly",
  networking: "Networking",
  "industry-expert": "Industry Expert",
  funny: "Funny",
};

interface CommentGeneratorProps {
  enabled: boolean;
  onUsageUpdate?: () => void;
}

export function CommentGenerator({
  enabled,
  onUsageUpdate,
}: CommentGeneratorProps) {
  const [post, setPost] = useState<ILinkedInPostExtract | null>(null);
  const [tone, setTone] = useState<CommentTone>("professional");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [history, setHistory] = useState<ICommentHistoryItem[]>([]);

  const refreshPost = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const extracted = await extractActivePostFromTab();
      setPost(extracted);
      if (!extracted?.content) {
        setError(
          "Scroll to a LinkedIn post with visible text, then scan again.",
        );
      }
    } finally {
      setScanning(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await sendMessage<{ history: ICommentHistoryItem[] }>({
      type: MessageType.AI_GET_COMMENT_HISTORY,
    });
    if (res.success && res.data?.history) {
      setHistory(res.data.history);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void refreshPost();
      void loadHistory();
    }
  }, [enabled, refreshPost, loadHistory]);

  const generate = async () => {
    if (!post?.content) {
      setError("No post detected. Scan the current page first.");
      return;
    }
    setLoading(true);
    setError(null);
    setCopied(false);
    setInserted(false);

    const res = await sendMessage<{ comment: { text: string } }>({
      type: MessageType.AI_GENERATE_COMMENT,
      payload: {
        postContent: post.content,
        postAuthor: post.author,
        postUrl: post.url,
        tone,
      },
    });

    setLoading(false);
    if (res.success && res.data?.comment?.text) {
      setComment(res.data.comment.text);
      void loadHistory();
      onUsageUpdate?.();
    } else {
      setError(res.error ?? "Failed to generate comment");
    }
  };

  const copyComment = async () => {
    if (!comment) return;
    try {
      await navigator.clipboard.writeText(comment);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  const insertComment = async () => {
    if (!comment) return;
    const ok = await insertCommentOnPage(comment);
    setInserted(ok);
    if (!ok) {
      setError("Open the comment box on the post, then try Insert again.");
    }
  };

  if (!enabled) {
    return (
      <SidebarCard title="AI Comment Generator">
        <p className="text-xs text-muted-foreground">
          This feature is not enabled for your account.
        </p>
      </SidebarCard>
    );
  }

  return (
    <SidebarCard
      title="AI Comment Generator"
      action={
        <button
          type="button"
          onClick={() => void refreshPost()}
          className="text-xs text-accent hover:underline"
        >
          {scanning ? "Scanning…" : "Scan post"}
        </button>
      }
    >
      <div className="space-y-3">
        {post?.content ? (
          <div className="rounded-lg bg-surface-elevated p-2 text-xs text-muted-foreground max-h-24 overflow-y-auto">
            {post.author && (
              <p className="font-medium text-white mb-1">{post.author}</p>
            )}
            <p className="line-clamp-4">{post.content}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Go to the LinkedIn feed, scroll to a post, then click Scan post.
          </p>
        )}

        <div>
          <p className="text-xs text-muted mb-1.5">Tone</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMENT_TONES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium border transition",
                  tone === t
                    ? "border-accent bg-accent/20 text-white"
                    : "border-surface-border text-muted-foreground hover:border-accent/40",
                )}
              >
                {TONE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={loading || !post?.content}
          onClick={() => void generate()}
          className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate comment"}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {loading && (
          <div className="flex justify-center py-2">
            <Loader size="sm" />
          </div>
        )}

        {comment && !loading && (
          <div className="space-y-2">
            <textarea
              readOnly
              value={comment}
              rows={4}
              className="w-full rounded-lg border border-surface-border bg-surface-elevated p-2 text-xs text-white resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void copyComment()}
                className="flex-1 rounded-lg border border-surface-border py-1.5 text-xs hover:bg-white/5"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => void insertComment()}
                className="flex-1 rounded-lg bg-accent/80 py-1.5 text-xs text-white hover:bg-accent"
              >
                {inserted ? "Inserted" : "Insert"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void generate()}
              className="w-full text-xs text-accent hover:underline"
            >
              Regenerate
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div className="border-t border-surface-border pt-3">
            <p className="text-xs font-medium text-white mb-2">
              Recent comments
            </p>
            <ul className="space-y-2 max-h-32 overflow-y-auto">
              {history.slice(0, 5).map((item) => (
                <li key={item._id} className="text-xs">
                  <div className="flex items-center gap-1 mb-0.5">
                    <StatusBadge label={item.tone} variant="muted" />
                    <span className="text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-left text-muted-foreground hover:text-white line-clamp-2"
                    onClick={() => setComment(item.generatedText)}
                  >
                    {item.generatedText}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </SidebarCard>
  );
}
