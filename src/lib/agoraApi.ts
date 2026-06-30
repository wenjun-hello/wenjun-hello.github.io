const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://tarot-ai-backend.vercel.app";

export interface AgoraTokenData {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}

export interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}

export async function fetchAgoraToken(
  channel?: string,
  uid?: string,
): Promise<AgoraTokenData> {
  const params = new URLSearchParams();
  if (channel) params.set("channel", channel);
  if (uid) params.set("uid", uid);

  const url = `${BACKEND_URL}/api/voice/token${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token endpoint returned ${res.status}: ${body}`);
  }

  return res.json();
}

export interface InviteAgentContext {
  originalQuestion?: string;
  questionType?: string;
  spreadType?: string;
  cards?: Array<{
    name: string;
    chineseName?: string;
    orientation?: "upright" | "reversed";
    isReversed?: boolean;
    keywords?: string[];
    coreMeaning?: string;
    upright?: string;
    reversed?: string;
    advice?: string;
    shadow?: string;
  }>;
  interpretation?: string;
  positions?: string[];
  systemPrompt?: string;
  greetingMessage?: string;
}

export async function inviteAgent(
  channelName: string,
  requesterId: string,
  context?: InviteAgentContext,
): Promise<AgentResponse> {
  const url = `${BACKEND_URL}/api/voice/invite`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel_name: channelName,
      requester_id: requesterId,
      ...context,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Invite agent returned ${res.status}: ${body}`);
  }

  return res.json();
}

export async function stopAgent(agentId: string): Promise<void> {
  const url = `${BACKEND_URL}/api/voice/stop`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Stop agent error:", body);
  }
}

export function getBackendUrl(): string {
  return BACKEND_URL;
}
