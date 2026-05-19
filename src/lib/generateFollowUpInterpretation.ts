import type { TarotCard } from "@/data/tarotCards";
import type { QuestionType } from "@/lib/tarot";

type Input = {
  card: TarotCard;
  questionType?: QuestionType;
  followUpQuestion: string;
};

/* ==============================
   SUGGESTED QUESTIONS BY TYPE
   ============================== */
export function getSuggestedQuestions(questionType?: QuestionType): string[] {
  switch (questionType) {
    case "love":
      return [
        "这段关系里我最需要看清什么？",
        "对方的状态给我什么提醒？",
        "我应该靠近还是保持距离？",
        "这段关系真正的阻碍是什么？",
        "我怎样做才不会失去自己？",
      ];
    case "career":
      return [
        "我现在最应该优先处理什么？",
        "这件事的机会在哪里？",
        "我需要避开什么风险？",
        "我应该继续推进还是调整方向？",
        "下一步最实际的行动是什么？",
      ];
    case "fortune":
      return [
        "我最近的状态真正想提醒我什么？",
        "我现在最容易忽略什么？",
        "我需要先照顾哪一部分自己？",
        "这段时间我应该慢下来还是行动？",
        "我可以怎样让自己更稳定？",
      ];
    case "growth":
      return [
        "我内心真正害怕的是什么？",
        "我正在经历怎样的转变？",
        "我可以如何找回力量？",
        "我现在最需要放下什么？",
        "这张牌想让我看见哪一部分自己？",
      ];
    case "yesno":
      return [
        "这件事更偏向支持还是阻碍？",
        "我为什么会犹豫？",
        "如果选择继续，我需要注意什么？",
        "如果选择放下，我需要面对什么？",
        "现在最清醒的判断是什么？",
      ];
    default:
      return [
        "我现在最需要看见什么？",
        "这张牌给我的行动建议是什么？",
        "这件事背后的真正阻碍是什么？",
        "我应该坚持还是放下？",
        "如果继续下去，我最需要注意什么？",
      ];
  }
}

/* ==============================
   INTENT DETECTION
   ============================== */
function detectIntent(q: string): "action" | "relationship" | "decision" | "obstacle" | "warning" | "future" | "general" {
  if (/怎么办|怎么做|下一步|行动|做什么|如何做/.test(q)) return "action";
  if (/他|她|对方|喜欢|联系|回复|消息|态度/.test(q)) return "relationship";
  if (/坚持|放下|继续|结束|放弃|离开|选择|走不走/.test(q)) return "decision";
  if (/阻碍|问题|卡住|为什么|困难|原因|障碍/.test(q)) return "obstacle";
  if (/注意|风险|小心|避免|谨慎/.test(q)) return "warning";
  if (/未来|结果|会不会|可能|以后|最终/.test(q)) return "future";
  return "general";
}

/* ==============================
   QUESTION TYPE ANGLES
   ============================== */
const TYPE_FOCUS: Record<string, { lens: string[]; action: string[]; redirect: string }> = {
  love: {
    lens: [
      "它把注意力带回你自己的感受和边界上",
      "它邀请你先看见自己在这段关系里的位置",
      "它更关心你是怎样对待自己的，而不是对方怎样对待你",
      "它把问题从'对方怎么想'转向了'我需要什么'",
    ],
    action: [
      "试着把你的期待说清楚，而不是用沉默来等待答案",
      "给自己一个安静的时刻，问问自己：靠近是因为喜欢，还是因为害怕失去",
      "今天可以先做一件很小的事：在关系里说出一个你一直没敢说的感受",
    ],
    redirect: "比起猜测对方，更重要的是先看清自己的感受",
  },
  career: {
    lens: [
      "它把注意力放在你能掌控的部分，而不是外部的变数",
      "它提醒你回顾自己真正在意的方向，而不只是眼下压力最大的事",
      "它把问题从'怎么赢'转向了'什么值得我做'",
    ],
    action: [
      "把注意力放在今天能做的一件具体工作上，而不是反复推演未来",
      "试着列出你最需要优先处理的三件事，然后只做第一件",
      "问问自己：我现在的忙碌，是在靠近目标，还是只是在填满时间",
    ],
    redirect: "比起立刻找到最佳方案，更重要的是先回到你能踏实做好的那一小步",
  },
  fortune: {
    lens: [
      "它把注意力带回你身体和情绪的真实状态",
      "它提醒你：有些累不是不够努力，而是太久没有真正休息",
      "它邀请你留意最近反复出现的情绪，可能是一种被忽略的信号",
    ],
    action: [
      "今天留意一下：什么时候你觉得放松，什么时候你觉得累",
      "试着给自己一个不做任何决定的半天，只是感受，不急着解决",
      "把最近让你不安的事情写在纸上，不用分析，只是看见",
    ],
    redirect: "比起立刻知道答案，更重要的是先感受到自己的状态",
  },
  growth: {
    lens: [
      "它指向你内心正在发生的深层变化，可能还没有完全成形",
      "它邀请你看见那些反复出现的旧模式，不是要批评自己，而是为了更好地理解自己",
      "它把问题从'我该怎么变得更好'转向了'我现在真正需要什么'",
    ],
    action: [
      "试着对自己说一句：我可以暂时不用变得更好，我只需要看见自己",
      "找一个安静的时间，问自己：是什么一直在重复出现，而我一直在绕开它",
      "今天试着做一件不是为了成长、只是为了让自己舒服的事",
    ],
    redirect: "真正的改变往往从接纳开始，而不是从对抗开始",
  },
  yesno: {
    lens: [
      "它不是在替你选择，而是在帮你更清楚地看见选择背后的东西",
      "它提醒你：犹豫本身就是一种信号，值得被认真对待",
      "它把问题从'对不对'转向了'什么对我最重要'",
    ],
    action: [
      "先别急着做决定，试着写下选择背后的真正担心和期待",
      "问自己一件事：如果没有人会评价我的选择，我内心的倾向是什么",
      "试着把支持和阻碍的因素分开来看，而不是把它们混在一起",
    ],
    redirect: "选择本身没有绝对正确或错误，重要的是你用什么标准去决定",
  },
  free: {
    lens: [
      "它邀请你先看清楚自己真正在问什么",
      "它把注意力带回你的内心，而不是外部的答案",
      "它提醒你：每一个真诚的问题，都是你对自己的一次靠近",
    ],
    action: [
      "闭上眼睛，在心里再问一遍你写下的问题——然后等一等，听听心里有没有一个轻声的回答",
      "把你的问题写在纸上，在旁边画一个小圈，问问自己：除了答案，我还需要什么",
    ],
    redirect: "比起马上得到答案，更重要的是先理解自己为什么会问出这个问题",
  },
};

/* ==============================
   INTENT-SPECIFIC INSERTS
   ============================== */
const INTENT_INSERTS: Record<string, { bridge: string[]; caution: string }> = {
  action: {
    bridge: ["它指向的下一步，可能不是一个大动作，而是一个小小的调整"],
    caution: "不需要急着把所有事情都做完。有时候，只做一件事，就已经是往前走了。",
  },
  relationship: {
    bridge: ["它把注意力从'对方怎么想'转向了'我在这段关系里的感受'"],
    caution: "这不是在告诉你对方一定怎样想，而是邀请你先回到自己身上。",
  },
  decision: {
    bridge: ["它不是在替你选择，而是在帮你更清楚地看见每个选择背后你真正在意的是什么"],
    caution: "任何决定都不需要立刻做出。给自己一些时间和空间，答案会慢慢浮现。",
  },
  obstacle: {
    bridge: ["它邀请你先看见：真正的阻碍可能不在外面，而在你心里的某个假设"],
    caution: "有些阻碍不是需要被打破的，而是需要被理解——理解它为什么一直站在那里。",
  },
  warning: {
    bridge: ["它提醒你留意那些容易被忽略的信号"],
    caution: "留意不等于恐惧。把它看作一次更清醒的观察，而不是一次对危险的预警。",
  },
  future: {
    bridge: ["它不是在预测未来，而是邀请你回到当下——因为未来总是从此刻开始的"],
    caution: "比起远方的可能性，此刻你手上的选择更值得你的注意力。",
  },
  general: {
    bridge: ["它把问题从'外面会发生什么'转向了'我可以如何回应自己'"],
    caution: "这不是一个需要被快速解决的题目，而是一个可以慢慢被看见的过程。",
  },
};

/* ==============================
   TEMPLATE POOLS
   ============================== */
const ACKNOWLEDGMENTS = [
  "你问到的是",
  "你想继续理解的是",
  "你在追问的是",
];

const CARD_BRIDGES = [
  "如果把这个问题放在「{card}」这张牌里看，它更像是在提醒你：{lens}。",
  "结合「{card}」来看，{lens}。",
  "「{card}」这张牌面对这些问题时，通常会把注意力带回到一个方向：{lens}。",
  "在你的追问里，「{card}」似乎想对你说：{lens}。",
];

const KEYWORD_BRIDGES = [
  "这张牌的关键词里有{citation}，所以它把你的注意力引向了更深的层面——",
  "留意「{card}」中出现的{citation}，这正是此刻值得你多看一看的地方。",
  "「{card}」一直在传达{citation}的能量，而这份提醒刚好落在你的追问里——",
];

const CLOSINGS = [
  "也许你也可以问问自己：{q}",
  "或许你可以带着这个提问继续往前走：{q}",
  "最后，把这个问题轻轻地放在心里：{q}",
  "不用急着回答，只是把它放在那里：{q}",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCite(card: TarotCard): string {
  const pool = [...(card.keywords || [])];
  if (card.chineseName) pool.push(card.chineseName);
  const a = pool[Math.floor(Math.random() * pool.length)] || "";
  const b = pool[Math.floor(Math.random() * pool.length)] || "";
  return b !== a && b ? `「${a}」和「${b}」` : `「${a}」`;
}

/* ==============================
   MAIN GENERATOR
   ============================== */
export function generateFollowUpInterpretation(input: Input): string {
  const { card, questionType, followUpQuestion } = input;
  const q = followUpQuestion.trim();
  const intent = detectIntent(q);
  const typeInfo = TYPE_FOCUS[questionType || "free"] || TYPE_FOCUS.free;
  const intentInfo = INTENT_INSERTS[intent] || INTENT_INSERTS.general;

  const cardName = card.chineseName || card.name;
  const cite = pickCite(card);
  const lens = pick(typeInfo.lens);
  const action = pick(typeInfo.action);
  const bridge = pick(CARD_BRIDGES).replace("{card}", cardName).replace("{lens}", lens);
  const kwBridge = pick(KEYWORD_BRIDGES).replace("{card}", cardName).replace("{citation}", cite);
  const closing = pick(CLOSINGS);
  const closingQ = card.reflectionQuestion || card.shadow || "我现在真正需要的是什么？";
  const ack = pick(ACKNOWLEDGMENTS);

  const parts: string[] = [];

  // 1. Acknowledge
  parts.push(`${ack}："${q}"。`);

  // 2. Bridge
  parts.push("");
  parts.push(bridge);

  // 3. Intent-aware bridge
  parts.push("");
  parts.push(intentInfo.bridge[0]);

  // 4. Card keyword angle
  if (card.keywords && card.keywords.length >= 2) {
    parts.push("");
    parts.push(`${kwBridge}${intentInfo.bridge.length > 1 ? intentInfo.bridge[1] : typeInfo.redirect}。`);
  } else {
    parts.push("");
    parts.push(`${typeInfo.redirect}。`);
  }

  // 5. Intent-specific caution
  parts.push("");
  parts.push(intentInfo.caution);

  // 6. Card advice if available
  if (card.advice) {
    parts.push("");
    parts.push(`这张牌给你的直接提醒是：${card.advice}`);
  }

  // 7. Action
  parts.push("");
  parts.push(action);

  // 8. Closing question
  parts.push("");
  parts.push(closing.replace("{q}", closingQ));

  return parts.join("\n");
}
