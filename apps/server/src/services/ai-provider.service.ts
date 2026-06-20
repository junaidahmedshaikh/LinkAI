import { env, isProduction } from "../config/env";
import type { CommentTone, IGeneratedComment } from "@linkai/types";

const MAX_WORD_COUNT = 80;
const MAX_POST_CONTENT_LENGTH = 2000;
const MAX_RESPONSE_TOKENS = 140;
const BASE_RETRY_DELAY_MS = 800;

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

const TONE_GUIDANCE: Record<CommentTone, string> = {
  professional:
    "Be concise, polished, and businesslike. Add one thoughtful observation or implication that shows real understanding.",
  "thought-leadership":
    "Sound insightful and reflective. Add a nuanced perspective, pattern, or question that pushes the conversation forward.",
  friendly:
    "Sound warm, genuine, and easy to read. Keep it natural and lightly conversational without sounding casual or vague.",
  networking:
    "Create a friendly, professional bridge for future conversation. Keep it authentic and lightly collaborative.",
  "industry-expert":
    "Show practical domain knowledge. Reference a specific mechanism, tradeoff, metric, or trend without sounding verbose.",
  funny:
    "Use subtle, tasteful humor that still feels professional. Keep it light and relevant, never cheesy or forced.",
};

class AiProviderService {
  async generateComment(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): Promise<IGeneratedComment> {
    if (!env.OPENROUTER_API_KEY) {
      if (!isProduction) {
        return this.generateMock(postContent, tone, context);
      }
      throw new Error("OpenRouter API key is not configured");
    }

    try {
      return await this.generateWithOpenRouter(postContent, tone, context);
    } catch (error) {
      if (!isProduction) {
        console.warn("[AI Provider] OpenRouter failed, using mock fallback:", error);
        return this.generateMock(postContent, tone, context);
      }
      throw error;
    }
  }

  private buildSystemPrompt(tone: CommentTone): string {
    return [
      "You write LinkedIn comments that sound like a real professional typed them quickly between meetings, not like an AI assistant.",
      "Write 1 or 2 sentences. Target 18 to 40 words.",
      "React to one specific detail, claim, or example from the post, the way a person would if something in it actually caught their attention.",
      "Sentences should vary in length and rhythm. Do not make every sentence the same tidy shape.",
      "",
      "HARD RULE: Never use an em dash (—) or a double hyphen (--) anywhere in the comment, for any reason. Use a period, comma, or just a new sentence instead. This rule has no exceptions.",
      "",
      "Avoid these AI writing tells:",
      "- Wrapping up your own observation with a clause that explains its own significance, such as 'which shows...', 'highlighting...', 'demonstrating...', 'proving that...', or 'that ties X to Y'. State the fact or ask the question and stop talking.",
      "- Generic praise or hollow validation ('great post', 'this is so true', 'love this').",
      "- Promotional or inflated language ('game-changing', 'crucial', 'pivotal', 'a testament to', 'inspiring journey').",
      "- Contrastive rule-of-three phrasing like 'X, not Y' or 'not just X, but Y'.",
      "- Hedge stacking ('could potentially', 'it might be argued that').",
      "- A tidy concluding sentence that restates the comment's own point.",
      "- Addressing the subject of the post directly as 'you' unless the post is written in the first person by that same person.",
      "- Hashtags, emojis, markdown, quotation marks around the whole comment, or any disclaimer about being an AI.",
      "",
      "Example of what NOT to do (real failure, do not repeat this pattern):",
      "Bad: \"Balancing a nine-hour Wipro role with self-study and still hitting AIR 356 shows how strategic time-blocking can turn a full-time job into a launchpad, not a roadblock — what scheduling tweaks helped you stay consistent?\"",
      "Why it's bad: two em dashes, a self-summarizing clause ('shows how... can turn...'), and an 'X, not Y' contrast pair.",
      "Good: \"Nine-hour Wipro job and still cracked AIR 356 with self-study. Genuinely curious what the daily schedule looked like, that's the hard part most people give up on before the syllabus even matters.\"",
      "Why it's better: no dashes, states the fact plainly, asks a real question without explaining why the question is good.",
      "",
      "Do not repeat the post back or summarize it. Do not sound like marketing copy.",
      "It is fine to sound mildly opinionated, slightly informal, or like you're mid-thought, as long as it stays professional and readable.",
      `Tone guidance: ${TONE_GUIDANCE[tone]}`,
      "Before returning your answer, check it for an em dash or double hyphen. If you find one, rewrite the sentence without it.",
      "Return only the final comment text, nothing else.",
    ].join("\n");
  }

  private buildUserPrompt(
    postContent: string,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): string {
    const parts = [
      context?.userName
        ? `Commenter profile: ${context.userName}${context.userHeadline ? ` | ${context.userHeadline}` : ""}`
        : undefined,
      context?.author ? `Post author: ${context.author}` : undefined,
      context?.hashtags?.length ? `Relevant topics: ${context.hashtags.join(", ")}` : undefined,
      `Post content:\n${postContent.slice(0, MAX_POST_CONTENT_LENGTH)}`,
    ].filter(Boolean);

    return parts.join("\n\n");
  }

  private async generateWithOpenRouter(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): Promise<IGeneratedComment> {
    try {
      return await this.callOpenRouter(env.OPENROUTER_MODEL, postContent, tone, context);
    } catch (primaryError) {
      if (!env.OPENROUTER_FALLBACK_MODEL) {
        throw primaryError;
      }

      console.warn(
        `[AI Provider] Primary model (${env.OPENROUTER_MODEL}) failed, trying fallback (${env.OPENROUTER_FALLBACK_MODEL}):`,
        primaryError
      );

      try {
        return await this.callOpenRouter(env.OPENROUTER_FALLBACK_MODEL, postContent, tone, context);
      } catch (fallbackError) {
        // Surface the fallback error, since it reflects the most recent failure,
        // but keep the primary error visible in the log above for diagnosis.
        throw fallbackError;
      }
    }
  }

  private async callOpenRouter(
    model: string,
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): Promise<IGeneratedComment> {
    const systemPrompt = this.buildSystemPrompt(tone);
    const userPrompt = this.buildUserPrompt(postContent, context);
    const endpoint = `${env.OPENROUTER_BASE_URL.replace(/\/$/, "")}/chat/completions`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < env.OPENROUTER_MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env.OPENROUTER_TIMEOUT_MS);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            // Optional but recommended by OpenRouter for analytics/rankings.
            // Safe to leave blank if env vars are unset.
            ...(env.OPENROUTER_SITE_URL ? { "HTTP-Referer": env.OPENROUTER_SITE_URL } : {}),
            ...(env.OPENROUTER_SITE_NAME ? { "X-Title": env.OPENROUTER_SITE_NAME } : {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ] satisfies OpenRouterMessage[],
            temperature: this.getTemperatureForTone(tone),
            max_tokens: MAX_RESPONSE_TOKENS,
            stream: false,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(
            `OpenRouter API error (${response.status}) [${model}]: ${this.extractErrorMessage(errorText)}`
          );
          if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < env.OPENROUTER_MAX_RETRIES - 1) {
            await this.delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
            continue;
          }
          throw lastError;
        }

        const data = (await response.json()) as OpenRouterChatResponse;
        const text = data.choices?.[0]?.message?.content?.trim();

        if (!text) {
          throw new Error(`OpenRouter returned an empty response [${model}]`);
        }

        return {
          text: this.normalizeComment(text),
          tone,
          tokensUsed: data.usage?.total_tokens ?? 0,
        };
      } catch (error) {
        const normalizedError =
          error instanceof Error
            ? error.name === "AbortError"
              ? new Error(`OpenRouter request timed out after ${env.OPENROUTER_TIMEOUT_MS}ms [${model}]`)
              : error
            : new Error(String(error));

        lastError = normalizedError;

        if (attempt < env.OPENROUTER_MAX_RETRIES - 1 && this.isRetryableError(normalizedError)) {
          await this.delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
          continue;
        }

        throw normalizedError;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError || new Error(`Failed to generate comment after retries [${model}]`);
  }

  private normalizeComment(text: string): string {
    const collapsed = text
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/\s*(?:[—–]|--)\s*/g, ", ")
      .replace(/,\s*,/g, ",")
      .replace(/\s+([.,])/g, "$1");
    const words = collapsed.split(/\s+/);
    if (words.length <= MAX_WORD_COUNT) return collapsed;
    return words.slice(0, MAX_WORD_COUNT).join(" ").trim();
  }

  private isRetryableError(error: Error): boolean {
    return /timed out|network|fetch failed|ECONNRESET|EAI_AGAIN|ETIMEDOUT/i.test(error.message);
  }

  private extractErrorMessage(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return "Unknown error";
    try {
      const parsed = JSON.parse(trimmed) as OpenRouterChatResponse;
      return parsed.error?.message || trimmed.slice(0, 200);
    } catch {
      return trimmed.slice(0, 200);
    }
  }

  private generateMock(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): IGeneratedComment {
    const snippet = postContent.slice(0, 60).replace(/\s+/g, " ");
    const author = context?.author ?? "the author";

    const templates: Record<CommentTone, string[]> = {
      professional: [
        `This is a strong point, especially around "${snippet}". It makes the practical implications worth digging into.`,
        `I like the clarity here. The execution angle behind this is where the real value usually shows up.`,
        `Well framed. The part that stands out most is how this connects strategy with measurable outcomes.`,
      ],
      "thought-leadership": [
        `This gets at an important shift in how people are thinking about "${snippet}". Curious how you see it evolving next.`,
        `There’s a deeper pattern here that a lot of teams miss. Your framing brings it into focus nicely.`,
        `This is the kind of perspective that moves the conversation forward. What do you think changes first in practice?`,
      ],
      friendly: [
        `Really enjoyed this take. The way you explained "${snippet}" made it easy to connect with.`,
        `This resonated with me. It’s refreshing to see the idea laid out this clearly.`,
        `Appreciate you sharing this. It sparked a couple of useful thoughts on my side.`,
      ],
      networking: [
        `${author}, this is a thoughtful perspective. Would be great to stay connected and keep learning from ideas like this.`,
        `This is exactly the kind of conversation I like following. Would love to exchange notes sometime.`,
        `Really valuable insight here. Happy to connect and continue the conversation around this space.`,
      ],
      "industry-expert": [
        `Strong point. The technical tradeoff here is often underestimated, and you captured it well.`,
        `This aligns with what many teams are seeing in practice. The real challenge is usually in implementation discipline.`,
        `Good breakdown. The operational implications are where this becomes especially interesting.`,
      ],
      funny: [
        `This is the kind of post that makes me pause mid-scroll in a good way. Solid take.`,
        `Exactly the kind of insight that saves people from learning the hard way later.`,
        `This is both practical and refreshingly readable, which is rarer than it should be.`,
      ],
    };

    const options = templates["professional"];
    return {
      text: options[Math.floor(Math.random() * options.length)],
      tone,
      tokensUsed: 0,
    };
  }

  private getTemperatureForTone(tone: CommentTone): number {
    switch (tone) {
      case "funny":
        return 0.8;
      case "thought-leadership":
        return 0.75;
      case "friendly":
        return 0.7;
      case "networking":
        return 0.65;
      case "industry-expert":
        return 0.55;
      case "professional":
      default:
        return 0.6;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiProviderService = new AiProviderService();