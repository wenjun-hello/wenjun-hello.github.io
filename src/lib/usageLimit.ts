const STORAGE_KEY = "tarot_ai_followup_usage";
const DAILY_LIMIT = 3;

type UsageData = {
  date: string;
  count: number;
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function read(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), count: 0 };
    const data: UsageData = JSON.parse(raw);
    if (data.date !== today()) return { date: today(), count: 0 };
    return data;
  } catch {
    return { date: today(), count: 0 };
  }
}

function write(data: UsageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/** Check if user can still use AI follow-up today. */
export function canUseAI(): boolean {
  return read().count < DAILY_LIMIT;
}

/** Get remaining AI follow-up count for today. */
export function getRemainingAI(): number {
  return Math.max(0, DAILY_LIMIT - read().count);
}

/** Increment AI usage count. Call only after a successful AI response. */
export function incrementAIUsage(): void {
  const data = read();
  data.count += 1;
  write(data);
}
