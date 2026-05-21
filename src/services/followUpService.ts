// ============================================================
// Follow-Up Interpretation Service
// ============================================================
// Supports three modes:
//   1. LOCAL   — default, template-based generator (no API)
//   2. AI      — calls /api/follow-up (same-origin)
//   3. AI EXT  — calls NEXT_PUBLIC_FOLLOW_UP_API_URL (external)
//
// IMPORTANT: Do NOT put AI API keys in frontend code.
// NEXT_PUBLIC_* variables are visible in the browser.
// The actual AI provider key must only exist in the backend.
//
// For GitHub Pages (no backend), set:
//   NEXT_PUBLIC_USE_AI_FOLLOW_UP=true
//   NEXT_PUBLIC_FOLLOW_UP_API_URL=https://your-backend.vercel.app/api/follow-up
// ============================================================

import type { TarotCard } from "@/data/tarotCards";
import type { QuestionType } from "@/lib/tarot";
import { generateFollowUpInterpretation } from "@/lib/generateFollowUpInterpretation";
import { canUseAI, incrementAIUsage } from "@/lib/usageLimit";

export type FollowUpInput = {
  card: TarotCard;
  questionType?: QuestionType;
  spreadPosition?: string;
  followUpQuestion: string;
  readingContext?: {
    allCards?: TarotCard[];
    spreadType?: string;
    originalQuestion?: string;
    cards?: Array<{
      chineseName?: string;
      name?: string;
      keywords?: string[];
      position?: string;
      orientation?: string;
    }>;
    followUpHistory?: Array<{
      question: string;
      answer: string;
      source?: string;
    }>;
  };
};

export type FollowUpResponse = {
  answer: string;
  source: "local" | "ai";
  error?: string;
};

/**
 * Generate a follow-up interpretation.
 *
 * Currently defaults to LOCAL template-based generation.
 * When NEXT_PUBLIC_USE_AI_FOLLOW_UP=true, attempts to call
 * the backend /api/follow-up endpoint with graceful fallback.
 */
export async function generateFollowUpResponse(
  input: FollowUpInput
): Promise<FollowUpResponse> {
  const useAI = process.env.NEXT_PUBLIC_USE_AI_FOLLOW_UP === "true";

  if (useAI) {
    // Check daily usage limit
    if (!canUseAI()) {
      // Limit reached — fall back to local without calling backend
      const fallback = generateFollowUpInterpretation({
        card: input.card,
        questionType: input.questionType,
        followUpQuestion: input.followUpQuestion,
      });
      return {
        answer: fallback,
        source: "local",
        error: "daily-limit-reached",
      };
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_FOLLOW_UP_API_URL || "/api/follow-up";

    try {
      console.log("Follow-up request payload:", {
        cardName: input.card.name,
        questionType: input.questionType,
        followUpQuestion: input.followUpQuestion,
        readingContext: input.readingContext,
      });

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card: {
            name: input.card.name,
            chineseName: input.card.chineseName,
            keywords: input.card.keywords,
            upright: input.card.upright,
            advice: input.card.advice,
            shadow: input.card.shadow,
            reflectionQuestion: input.card.reflectionQuestion,
            coreMeaning: input.card.coreMeaning,
          },
          questionType: input.questionType,
          spreadPosition: input.spreadPosition,
          followUpQuestion: input.followUpQuestion,
          readingContext: {
            ...input.readingContext,
            originalQuestion: input.readingContext?.originalQuestion || "",
          },
        }),
      });

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);

      const data = await res.json();

      if (!data.answer) throw new Error("Backend response missing answer");

      // Only increment on successful AI response
      incrementAIUsage();

      return { answer: data.answer, source: "ai" };
    } catch {
      // Backend unavailable — fall back to local (don't increment)
      const fallback = generateFollowUpInterpretation({
        card: input.card,
        questionType: input.questionType,
        followUpQuestion: input.followUpQuestion,
      });
      return {
        answer: fallback,
        source: "local",
        error: "AI backend unavailable, using local fallback",
      };
    }
  }

  // Default: local generation
  const answer = generateFollowUpInterpretation({
    card: input.card,
    questionType: input.questionType,
    followUpQuestion: input.followUpQuestion,
  });
  return { answer, source: "local" };
}
