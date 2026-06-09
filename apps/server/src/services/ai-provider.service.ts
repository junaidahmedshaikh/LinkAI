import { env } from "../config/env";
import type { CommentTone, IGeneratedComment } from "@linkai/types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const TONE_INSTRUCTIONS: Record<CommentTone, string> = {
  professional:
    "Write a concise, professional comment that adds substantive value and demonstrates relevant expertise. Reference a specific idea from the post.",
  "thought-leadership":
    "Write a thought-provoking comment with a unique insight or perspective. Challenge the author's thinking or add nuance. Reference specific details.",
  friendly:
    "Write a warm, genuine comment that feels conversational without being unprofessional. Show authentic interest in the topic and the author's perspective.",
  networking:
    "Write a comment that builds authentic rapport. Show genuine interest in the author's work. Ask a thoughtful question or propose collaboration.",
  "industry-expert":
    "Write a comment that showcases deep industry knowledge with relevant experience and credible insights. Reference the post's specific claims.",
  funny:
    "Write a clever, subtle comment with light humor. Keep it relevant to the post and appropriate for professional context.",
};

interface TokenUsageResponse {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

class AiProviderService {
  async generateComment(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): Promise<IGeneratedComment> {
    if (env.OPENAI_API_KEY) {
      return this.generateWithOpenAI(postContent, tone, context);
    }
    return this.generateMock(postContent, tone, context);
  }

  private async generateWithOpenAI(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): Promise<IGeneratedComment> {
    const systemPrompt = `You are a LinkedIn engagement assistant specializing in authentic, valuable comments.

CORE REQUIREMENTS:
- Write 1-3 sentences maximum
- Maximum 80 words total
- Reference a specific idea or detail from the post
- Add genuine value: new insight, observation, question, or perspective
- Sound like a real professional, not AI

TONE: ${TONE_INSTRUCTIONS[tone]}

STRICT PROHIBITIONS (Never include these):
❌ Generic phrases: "Great post", "Thanks for sharing", "Well said", "Totally agree", "Interesting perspective"
❌ Hashtags
❌ Emojis  
❌ Exclamation marks (unless tone is "funny")
❌ Disclaimers about being AI
❌ Repeating the post verbatim
❌ Overly promotional language

OUTPUT: Return ONLY the comment text. No explanations, no markdown, no extra text.`;

    const userPrompt = [
      context?.userName
        ? `Commenter: ${context.userName}${context.userHeadline ? ` (${context.userHeadline})` : ""}`
        : "",
      context?.author ? `Post Author: ${context.author}` : "",
      context?.hashtags && context.hashtags.length > 0 ? `Post Topics: ${context.hashtags.join(", ")}` : "",
      `Post Content:\n${postContent.slice(0, 2000)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 120,
            temperature: this.getTemperatureForTone(tone),
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          lastError = new Error(`OpenAI API error (${response.status}): ${error.slice(0, 200)}`);

          // Retry on 429 (rate limit) or 5xx errors
          if (response.status === 429 || response.status >= 500) {
            if (attempt < MAX_RETRIES - 1) {
              await this.delay(RETRY_DELAY_MS * (attempt + 1));
              continue;
            }
          }
          throw lastError;
        }

        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: TokenUsageResponse;
        };

        const text = json.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error("Empty response from OpenAI");
        }

        // Validate response meets requirements
        const wordCount = text.split(/\s+/).length;
        if (wordCount > 80) {
          console.warn(`[AI Provider] Comment exceeds 80 words (${wordCount}), truncating...`);
          return {
            text: text.split(/\s+/).slice(0, 80).join(" ").trim(),
            tone,
            tokensUsed: json.usage?.total_tokens || 0,
          };
        }

        return {
          text: text,
          tone,
          tokensUsed: json.usage?.total_tokens || 0,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES - 1) {
          await this.delay(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError || new Error("Failed to generate comment after retries");
  }

  private generateMock(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): IGeneratedComment {
    const snippet = postContent.slice(0, 60).replace(/\s+/g, " ");
    const author = context?.author ?? "the author";

    // Templates must follow: 1-3 sentences, <80 words, no banned phrases
    const templates: Record<CommentTone, string[]> = {
      professional: [
        `Your point about "${snippet}" aligns with what we're seeing in market trends. This deserves deeper exploration.`,
        `The approach you're describing here shows strong strategic thinking. Have you considered the operational implications?`,
        `This addresses a gap I've noticed. The execution roadmap you outlined could set a new standard.`,
      ],
      "thought-leadership": [
        `You're touching on something critical here. How do you see this evolving as market dynamics shift?`,
        `Most people miss this nuance. Your perspective on "${snippet}" opens an important angle.`,
        `This challenges conventional wisdom in the right way. What emerging patterns inform your view?`,
      ],
      friendly: [
        `This resonates deeply. Your take on "${snippet}" captures something I've been wrestling with too.`,
        `Appreciate you sharing this perspective. The clarity here is refreshing.`,
        `This sparked new thinking for me. Curious about your experience with implementation.`,
      ],
      networking: [
        `${author}, this aligns perfectly with work we're doing. Would love to explore potential synergies here.`,
        `Your insights on this topic are valuable. Would be great to continue this conversation.`,
        `This reflects deep experience. Would be interested in connecting around these challenges.`,
      ],
      "industry-expert": [
        `Spot on. The technical depth here often gets overlooked. Have you tracked adoption metrics across verticals?`,
        `You've identified the real lever here. Most practitioners miss the compliance implications.`,
        `This reflects current best practices. The framework you're suggesting aligns with emerging standards.`,
      ],
      funny: [
        `This is the exact energy I needed today. Your framing on "${snippet}" is perfect.`,
        `Literally the conversation I was having this morning. Saving this for reference.`,
        `This articulates what I couldn't quite put into words. Bookmarking immediately.`,
      ],
    };

    const options = templates[tone];
    const text = options[Math.floor(Math.random() * options.length)];

    return {
      text,
      tone,
      tokensUsed: 0, // Mock doesn't track tokens
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
        return 0.6;
      case "professional":
      default:
        return 0.65;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiProviderService = new AiProviderService();
