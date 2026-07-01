const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://tarot-ai-backend.vercel.app";

// ── Token ──

export interface AgoraTokenData {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
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

// ── Usage ──

export interface VoiceUsageResponse {
  dailyLimitSeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
  hasActiveSession: boolean;
  sessionExpiresAt: string | null;
}

export interface VoiceApiError {
  code?: string;
  error?: string;
  message?: string;
  remainingSeconds?: number;
  detail?: string;
}

export async function fetchVoiceUsage(
  deviceId: string,
): Promise<VoiceUsageResponse> {
  const url = `${BACKEND_URL}/api/voice/usage?deviceId=${encodeURIComponent(deviceId)}`;
  const res = await fetch(url);

  if (!res.ok) {
    let parsed: VoiceApiError | null = null;
    try {
      parsed = await res.json();
    } catch {
      // not JSON
    }

    if (parsed?.code) {
      const err = new Error(parsed.error || parsed.message || "Usage check failed") as Error & {
        code: string;
        remainingSeconds?: number;
      };
      err.code = parsed.code;
      err.remainingSeconds = parsed.remainingSeconds;
      throw err;
    }

    throw new Error(`Usage endpoint returned ${res.status}`);
  }

  return res.json();
}

// ── Invite ──

export interface InviteAgentContext {
  deviceId?: string;
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

export interface VoiceInviteResponse {
  agent_id: string;
  create_ts: number;
  state: string;
  sessionId?: string;
  dailyLimitSeconds?: number;
  usedSeconds?: number;
  remainingSeconds?: number;
  sessionExpiresAt?: string;
  maxSessionSeconds?: number;
  channel?: string;
}

export async function inviteAgent(
  channelName: string,
  requesterId: string,
  context?: InviteAgentContext,
): Promise<VoiceInviteResponse> {
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
    let parsed: VoiceApiError | null = null;
    try {
      parsed = await res.json();
    } catch {
      // not JSON
    }

    if (parsed?.code) {
      const err = new Error(parsed.error || parsed.message || "Invite failed") as Error & {
        code: string;
        remainingSeconds?: number;
      };
      err.code = parsed.code;
      err.remainingSeconds = parsed.remainingSeconds;
      throw err;
    }

    const body = parsed ? JSON.stringify(parsed) : await res.text().catch(() => "");
    throw new Error(`Invite agent returned ${res.status}: ${body}`);
  }

  return res.json();
}

// ── Stop ──

export interface VoiceStopResponse {
  success: boolean;
  durationSeconds?: number;
  usedSeconds?: number;
  remainingSeconds?: number;
}

export async function stopAgent(
  params: {
    deviceId: string;
    sessionId: string;
    agentId: string;
    channel: string;
  },
): Promise<VoiceStopResponse> {
  const url = `${BACKEND_URL}/api/voice/stop`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: params.deviceId,
      sessionId: params.sessionId,
      agent_id: params.agentId,
      channel: params.channel,
    }),
  });

  if (!res.ok) {
    let parsed: VoiceApiError | null = null;
    try {
      parsed = await res.json();
    } catch {
      // not JSON
    }

    if (parsed?.code) {
      console.error("Stop agent error:", parsed.code, parsed.error || parsed.message);
    } else {
      const body = parsed ? JSON.stringify(parsed) : await res.text().catch(() => "");
      console.error("Stop agent error:", body);
    }

    // Return a minimal failure response so callers can proceed
    return { success: false };
  }

  return res.json();
}

// ── Beacon stop for beforeunload ──

export function beaconStopAgent(params: {
  deviceId: string;
  sessionId: string;
  agentId: string;
  channel: string;
}): void {
  const url = `${BACKEND_URL}/api/voice/stop`;
  const body = JSON.stringify({
    deviceId: params.deviceId,
    sessionId: params.sessionId,
    agent_id: params.agentId,
    channel: params.channel,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
  } else {
    // Best-effort keepalive fetch
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export function getBackendUrl(): string {
  return BACKEND_URL;
}

// Re-export AgentResponse for backward compatibility
export interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}
