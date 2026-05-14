import { TarotCard } from "@/data/tarotCards";

export type QuestionType =
  | "love"
  | "career"
  | "fortune"
  | "growth"
  | "yesno"
  | "free";

export type SpreadType = "one" | "three";

export type QuestionTypeInfo = {
  id: QuestionType;
  name: string;
  description: string;
};

export const questionTypes: QuestionTypeInfo[] = [
  {
    id: "love",
    name: "感情关系",
    description:
      "适合观察关系中的情绪、距离、期待与相处模式。",
  },
  {
    id: "career",
    name: "事业与学业",
    description:
      "适合整理目标、压力、机会，以及下一步的行动方向。",
  },
  {
    id: "fortune",
    name: "近期状态",
    description:
      "适合了解你最近的整体能量、情绪变化与需要留意的地方。",
  },
  {
    id: "growth",
    name: "自我成长",
    description:
      "适合回看内在课题、隐藏阻碍，以及正在形成的力量。",
  },
  {
    id: "yesno",
    name: "是 / 否问题",
    description:
      "适合获得一种倾向性的提醒，但不代表绝对答案。",
  },
  {
    id: "free",
    name: "自由提问",
    description:
      "写下你此刻真正想问的问题，让牌面成为一次自我对话的入口。",
  },
];

export function drawSingleCard(cards: TarotCard[]): TarotCard {
  const index = Math.floor(Math.random() * cards.length);
  return { ...cards[index] };
}

export function drawMultipleCards(
  cards: TarotCard[],
  count: number
): TarotCard[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count).map((c) => ({ ...c }));
}

export function getMeaningByQuestionType(
  card: TarotCard,
  questionType: QuestionType
): string {
  switch (questionType) {
    case "love":
      return card.love;
    case "career":
      return card.career;
    case "fortune":
      return card.upright;
    case "growth":
      return card.innerGrowth;
    case "yesno":
      return card.yesNo;
    case "free":
      return card.upright;
    default:
      return card.upright;
  }
}

export function getSpreadPositions(
  questionType: QuestionType
): [string, string, string] {
  switch (questionType) {
    case "love":
      return ["你的内心", "对方的状态", "关系的可能走向"];
    case "career":
      return ["当前处境", "潜在机会", "下一步行动"];
    case "fortune":
      return ["当前能量", "近期变化", "需要留意的地方"];
    case "growth":
      return ["内在状态", "隐藏阻碍", "成长方向"];
    case "yesno":
      return ["支持因素", "阻碍因素", "整体倾向"];
    case "free":
      return ["问题核心", "隐藏影响", "可以尝试的方向"];
    default:
      return ["过去的影响", "当前状态", "可能的发展"];
  }
}
