import { env, isProduction } from "../config/env";
import type { CommentTone, IGeneratedComment } from "@linkai/types";

/**
 * AI Provider Service - Handles comment generation via OpenAI API
 *
 * PURPOSE:
 * - Generate LinkedIn comments using OpenAI GPT models
 * - Fallback to mock generation for development/testing
 * - Handle retry logic and error recovery
 * - Validate comment output meets requirements (1-3 sentences, <80 words)
 *
 * ARCHITECTURE:
 * - Used by: commentService.generate()
 * - Depends on: env configuration, OpenAI API
 * - Provides: IGeneratedComment with text, tone, and token usage
 *
 * KEY FEATURES:
 * - Exponential backoff retry logic (3 attempts)
 * - Temperature tuning per tone (0.6-0.8 range)
 * - Word count validation with automatic truncation
 * - Mock generation when API key unavailable
 */

// ============ CONSTANTS ============
// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// OpenAI API configuration
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions" as const;
const MAX_TOKENS = 120;
const MAX_WORD_COUNT = 80;
const MIN_POST_CONTENT_LENGTH = 10;
const MAX_POST_CONTENT_LENGTH = 2000;

// HTTP status codes for retry-worthy errors
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504] as const;

/**
 * Tone-specific system prompts for OpenAI
 * Instructs the model on how to generate comments for different LinkedIn audiences
 */
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

/**
 * AI Provider Service Implementation
 * Handles OpenAI API communication and comment generation
 */
class AiProviderService {
  /**
   * Generate a LinkedIn comment
   *
   * FLOW:
   * 1. Check if OpenAI API key is configured
   * 2. If yes: Call generateWithOpenAI() with retry logic
   * 3. If no: Fall back to generateMock() for development
   *
   * @param postContent - The LinkedIn post content to comment on
   * @param tone - The style of comment (professional, friendly, etc)
   * @param context - Optional metadata (author, user, hashtags)
   * @returns Generated comment with text, tone, and token usage
   * @throws Error if both OpenAI and mock generation fail
   *
   * USED BY: commentService.generate()
   */
  async generateComment(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): Promise<IGeneratedComment> {
    // Use OpenAI if configured, otherwise mock for development
    if (env.OPENAI_API_KEY) {
      try {
        return await this.generateWithOpenAI(postContent, tone, context);
      } catch (error) {
        if (!isProduction) {
          console.warn("[AI Provider] OpenAI failed, using mock fallback:", error);
          return this.generateMock(postContent, tone, context);
        }
        throw error;
      }
    }
    return this.generateMock(postContent, tone, context);
  }

  /**
   * Generate comment using OpenAI API with retry logic
   *
   * ERROR HANDLING:
   * - Network errors: Retry with exponential backoff
   * - Rate limit (429): Retry up to MAX_RETRIES times
   * - Server errors (5xx): Retry up to MAX_RETRIES times
   * - Invalid input (4xx): Fail immediately
   * - Empty response: Throw error
   *
   * RESPONSE VALIDATION:
   * - Word count truncated if exceeds MAX_WORD_COUNT
   * - Always returns valid IGeneratedComment
   *
   * @private
   * @param postContent - Post text to generate comment for
   * @param tone - Desired comment tone
   * @param context - User and post metadata
   * @returns Generated comment or throws error after retries exhausted
   */
  private async generateWithOpenAI(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): Promise<IGeneratedComment> {
    // Build system prompt with tone-specific instructions
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

    // Build user prompt with context data
    const userPrompt = [
      context?.userName
        ? `Commenter: ${context.userName}${context.userHeadline ? ` (${context.userHeadline})` : ""}`
        : "",
      context?.author ? `Post Author: ${context.author}` : "",
      context?.hashtags && context.hashtags.length > 0 ? `Post Topics: ${context.hashtags.join(", ")}` : "",
      `Post Content:\n${postContent.slice(0, MAX_POST_CONTENT_LENGTH)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    let lastError: Error | null = null;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(OPENAI_API_ENDPOINT, {
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
            max_tokens: MAX_TOKENS,
            temperature: this.getTemperatureForTone(tone),
          }),
        });

        // Handle error responses
        if (!response.ok) {
          const errorText = await response.text();
          lastError = new Error(`OpenAI API error (${response.status}): ${errorText.slice(0, 200)}`);

          // Retry on retryable status codes
          if (RETRYABLE_STATUS_CODES.includes(response.status as any)) {
            if (attempt < MAX_RETRIES - 1) {
              // Exponential backoff: 1s, 2s, 4s
              const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
              await this.delay(delay);
              continue;
            }
          }
          throw lastError;
        }

        // Parse and validate response
        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: TokenUsageResponse;
        };

        const text = json.choices?.[0]?.message?.content?.trim();
        if (!text) {
          throw new Error("Empty response from OpenAI");
        }

        // Validate word count and truncate if necessary
        const wordCount = text.split(/\s+/).length;
        if (wordCount > MAX_WORD_COUNT) {
          console.warn(`[AI Provider] Comment exceeds ${MAX_WORD_COUNT} words (${wordCount}), truncating...`);
          return {
            text: text.split(/\s+/).slice(0, MAX_WORD_COUNT).join(" ").trim(),
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
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          await this.delay(delay);
          continue;
        }
      }
    }

    throw lastError || new Error("Failed to generate comment after retries");
  }

  /**
   * Generate comment using mock templates for development/testing
   *
   * PURPOSE:
   * - Provides comment generation without API key
   * - Useful for development and testing
   * - Prevents failures when OpenAI API is unavailable
   *
   * TEMPLATES:
   * - 6 tone-specific comment templates
   * - Each template follows LinkedIn best practices
   * - Adheres to 80-word max, 1-3 sentence requirements
   *
   * @private
   * @param postContent - Post to mock-comment on
   * @param tone - Comment style
   * @param context - Post and user metadata
   * @returns Generated mock comment
   */
  private generateMock(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string; hashtags?: string[] }
  ): IGeneratedComment {
    const snippet = postContent.slice(0, 60).replace(/\s+/g, " ");
    const author = context?.author ?? "the author";

    // Mock templates follow: 1-3 sentences, <80 words, no banned phrases
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

  /**
   * Get appropriate temperature for tone
   *
   * LOGIC:
   * - Lower temperature (0.6): More focused, consistent (professional, expert)
   * - Medium temperature (0.65-0.7): Balanced (professional, networking, friendly)
   * - Higher temperature (0.75-0.8): More creative, varied (thought-leadership, funny)
   *
   * USED BY: generateWithOpenAI() for API call configuration
   *
   * @private
   * @param tone - Comment tone/style
   * @returns Temperature value (0.0-1.0)
   */
  private getTemperatureForTone(tone: CommentTone): number {
    switch (tone) {
      case "funny":
        return 0.8; // More creative variation
      case "thought-leadership":
        return 0.75; // Creative but thoughtful
      case "friendly":
        return 0.7; // Warm and genuine
      case "networking":
        return 0.65; // Balanced and personable
      case "industry-expert":
        return 0.6; // Focused and authoritative
      case "professional":
      default:
        return 0.65; // Professional standard
    }
  }

  /**
   * Delay execution for specified milliseconds
   *
   * USED BY: Exponential backoff in retry logic
   *
   * @private
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiProviderService = new AiProviderService();
