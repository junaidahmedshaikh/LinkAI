import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API_URL } from "@/constants/config";
import { Card } from "@/components/ui";
import type { CommentTone, ICommentHistoryItem } from "@linkai/types";
import { COMMENT_TONES } from "@linkai/types";

const TONE_LABELS: Record<CommentTone, string> = {
  professional: "Professional",
  "thought-leadership": "Thought Leadership",
  friendly: "Friendly",
  networking: "Networking",
  "industry-expert": "Industry Expert",
  funny: "Funny",
};

const TONE_COLORS: Record<CommentTone, string> = {
  professional: "bg-blue-500/20 text-blue-300",
  "thought-leadership": "bg-purple-500/20 text-purple-300",
  friendly: "bg-green-500/20 text-green-300",
  networking: "bg-amber-500/20 text-amber-300",
  "industry-expert": "bg-indigo-500/20 text-indigo-300",
  funny: "bg-pink-500/20 text-pink-300",
};

interface CommentsResponse {
  history: ICommentHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<ICommentHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toneFilter, setToneFilter] = useState<CommentTone | "all">("all");

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    loadComments();
  }, [currentPage, toneFilter]);

  async function loadComments(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const url = new URL(`${API_URL}/api/ai/comments/history`);
      url.searchParams.set("limit", ITEMS_PER_PAGE.toString());
      url.searchParams.set("offset", offset.toString());

      const response = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to load comments");
      }

      const data = (await response.json()) as { data: CommentsResponse };
      let filtered = data.data.history;

      if (toneFilter !== "all") {
        filtered = filtered.filter((c) => c.tone === toneFilter);
      }

      setComments(filtered);
      setTotal(data.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm("Delete this comment?")) return;

    try {
      const response = await fetch(`${API_URL}/api/ai/comments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete comment");

      setComments(comments.filter((c) => c._id !== id));
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  }

  async function handleSearch(): Promise<void> {
    if (!searchQuery.trim()) {
      setCurrentPage(1);
      await loadComments();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_URL}/api/ai/comments/search`);
      url.searchParams.set("q", searchQuery);
      url.searchParams.set("limit", "50");

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Search failed");

      const data = (await response.json()) as {
        data: { results: ICommentHistoryItem[] };
      };
      setComments(data.data.results);
      setTotal(data.data.results.length);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">AI Generated Comments</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and manage all your AI-generated LinkedIn comments
        </p>
      </motion.div>

      <Card className="mb-6" animate={false}>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSearch();
              }}
              className="flex-1 rounded-lg border border-surface-border bg-surface-elevated px-4 py-2 text-sm text-white placeholder-muted-foreground focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => void handleSearch()}
              className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Search
            </button>
          </div>

          {/* Tone Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setToneFilter("all");
                setCurrentPage(1);
              }}
              className={`rounded-full px-4 py-1 text-sm transition ${
                toneFilter === "all"
                  ? "bg-accent text-white"
                  : "bg-surface-border text-muted-foreground hover:bg-surface-border/80"
              }`}
            >
              All
            </button>
            {COMMENT_TONES.map((tone) => (
              <button
                key={tone}
                onClick={() => {
                  setToneFilter(tone);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-1 text-sm transition ${
                  toneFilter === tone
                    ? `${TONE_COLORS[tone]} border border-current`
                    : "bg-surface-border text-muted-foreground hover:bg-surface-border/80"
                }`}
              >
                {TONE_LABELS[tone]}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="text-sm text-muted-foreground">
            {total === 0
              ? "No comments yet"
              : `Showing ${comments.length} of ${total} comments`}
          </div>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500/20 bg-red-500/10" animate={false}>
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card animate={false}>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-lg bg-surface-border animate-pulse"
              />
            ))}
          </div>
        </Card>
      ) : comments.length === 0 ? (
        <Card animate={false}>
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No comments found. Generate your first AI comment from the
              extension!
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4" animate={false}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_COLORS[comment.tone]}`}
                      >
                        {TONE_LABELS[comment.tone]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.tokensUsed && (
                        <span className="text-xs text-muted-foreground">
                          {comment.tokensUsed} tokens
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Generated Comment
                        </p>
                        <p className="text-sm text-white bg-surface-elevated rounded px-3 py-2">
                          {comment.generatedText}
                        </p>
                      </div>

                      {comment.postAuthor && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Post Author
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {comment.postAuthor}
                          </p>
                        </div>
                      )}

                      {comment.postContent && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Post Content
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {comment.postContent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-col">
                    {comment.postUrl && (
                      <a
                        href={comment.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs hover:bg-white/5 whitespace-nowrap"
                      >
                        View Post
                      </a>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(comment.generatedText);
                      }}
                      className="rounded-lg border border-surface-border px-3 py-1.5 text-xs hover:bg-white/5 whitespace-nowrap"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => void handleDelete(comment._id)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 whitespace-nowrap"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Pagination */}
          {!searchQuery && totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, currentPage - 2),
                    Math.min(totalPages, currentPage + 1),
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-lg px-4 py-2 text-sm transition ${
                        currentPage === page
                          ? "bg-accent text-white"
                          : "border border-surface-border hover:bg-white/5"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
              </div>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
