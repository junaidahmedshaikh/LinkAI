import { env } from "../config/env";
import type { CommentTone, IGeneratedComment } from "@linkai/types";

const TONE_INSTRUCTIONS: Record<CommentTone, string> = {
  professional: "Write a concise, professional LinkedIn comment that adds business value.",
  friendly: "Write a warm, approachable comment that feels genuine and conversational.",
  insightful: "Write a thoughtful comment that shares a unique perspective or insight.",
  supportive: "Write an encouraging, supportive comment that celebrates the author.",
  witty: "Write a clever, light comment with subtle humor — keep it appropriate for LinkedIn.",
};

class AiProviderService {
  async generateComment(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string }
  ): Promise<IGeneratedComment> {
    if (env.OPENAI_API_KEY) {
      return this.generateWithOpenAI(postContent, tone, context);
    }
    return this.generateMock(postContent, tone, context);
  }

  private async generateWithOpenAI(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string; userHeadline?: string }
  ): Promise<IGeneratedComment> {
    const systemPrompt = `You are a LinkedIn engagement assistant. ${TONE_INSTRUCTIONS[tone]} 
Keep comments under 280 characters. No hashtags unless natural. No emojis unless tone is friendly or witty.
Return ONLY the comment text, nothing else.`;

    const userPrompt = [
      context?.userName ? `Commenter: ${context.userName}${context.userHeadline ? ` (${context.userHeadline})` : ""}` : "",
      context?.author ? `Post author: ${context.author}` : "",
      `Post:\n${postContent.slice(0, 2000)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: tone === "witty" ? 0.9 : 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI provider error: ${err.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty AI response");

    return { text: text.slice(0, 500), tone };
  }

  private generateMock(
    postContent: string,
    tone: CommentTone,
    context?: { author?: string; userName?: string }
  ): IGeneratedComment {
    const snippet = postContent.slice(0, 80).replace(/\s+/g, " ");
    const author = context?.author ?? "the author";
    const templates: Record<CommentTone, string[]> = {
      professional: [
        `Great perspective on "${snippet}…" — this aligns well with trends we're seeing in the industry.`,
        `Solid point, ${author}. The clarity here makes a strong case for thoughtful leadership.`,
      ],
      friendly: [
        `Love this, ${author}! "${snippet}…" really resonated with me. Thanks for sharing!`,
        `This made my day — appreciate you putting this out there!`,
      ],
      insightful: [
        `The nuance in "${snippet}…" is easy to miss. Curious how you see this evolving over the next year.`,
        `This connects to a broader shift — would love to hear more about your experience here.`,
      ],
      supportive: [
        `Well said, ${author}! Keep sharing — this kind of content makes LinkedIn better for everyone.`,
        `Proud to see posts like this. You're doing important work.`,
      ],
      witty: [
        `Saving this post for the next time someone asks me to "just add a quick comment." Well played, ${author}.`,
        `"${snippet}…" — finally, a feed post that doesn't require three paragraphs of context. Chef's kiss.`,
      ],
    };
    const options = templates[tone];
    const text = options[Math.floor(Math.random() * options.length)];
    return { text, tone };
  }
}

export const aiProviderService = new AiProviderService();
