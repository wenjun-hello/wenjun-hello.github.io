import type { CardWithOrientation } from "@/components/reading/GestureFanDeck";

function singleCardText(card: CardWithOrientation): string {
  const orientation = card.isReversed ? "逆位" : "正位";
  const keywords = card.keywords?.length
    ? card.keywords.join("，")
    : "";

  const parts: string[] = [];

  parts.push(`你抽到的是${card.chineseName}，${orientation}。`);

  if (keywords) {
    parts.push(`这张牌的关键词是：${keywords}。`);
  }

  if (card.coreMeaning) {
    parts.push(`牌面的核心提醒是：${card.coreMeaning}`);
  }

  if (card.advice) {
    parts.push(`可以尝试的下一步是：${card.advice}`);
  }

  if (card.reflectionQuestion) {
    parts.push(`最后留给自己的问题是：${card.reflectionQuestion}`);
  }

  return parts.join("\n");
}

function threeCardText(cards: CardWithOrientation[]): string {
  const parts: string[] = [];

  parts.push(`你抽了三张牌。`);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const orientation = card.isReversed ? "逆位" : "正位";
    const label = ["第一张牌", "第二张牌", "第三张牌"][i];
    parts.push(
      `${label}：${card.chineseName}，${orientation}。${card.coreMeaning ? card.coreMeaning.split("。")[0] + "。" : ""}`
    );
  }

  // Overall interpretation
  if (cards.length >= 3) {
    const c0 = cards[0], c1 = cards[1], c2 = cards[2];
    const kw0 = c0.keywords?.slice(0, 2).join("与") || "";
    const kw1 = c1.keywords?.slice(0, 2).join("与") || "";
    parts.push(
      `综合来看，你的牌阵从${c0.chineseName}开始，它提醒你关注${kw0}。在中间的是${c1.chineseName}，指向${kw1}，照亮了你问题的核心。前方的路由${c2.chineseName}指引：${c2.advice || "请参考牌面详细解读。"}这些牌并不代表一个固定的未来，更像是一面镜子，邀请你用更清醒的眼光、更柔和的节奏去看待自己正在面对的事情。`
    );
  }

  return parts.join("\n");
}

export function buildReadingText(
  cards: CardWithOrientation[],
  spreadType: "one" | "three"
): string {
  if (spreadType === "three" && cards.length >= 3) {
    return threeCardText(cards);
  }
  return singleCardText(cards[0]);
}
