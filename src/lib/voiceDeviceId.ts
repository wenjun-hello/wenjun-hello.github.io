const STORAGE_KEY = "royal_arcana_device_id";

function fallbackUUID(): string {
  // crypto.randomUUID fallback using crypto.getRandomValues
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  // Set version 4 bits
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = Array.from(arr, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

export function getOrCreateVoiceDeviceId(): string {
  if (typeof window === "undefined") return "";

  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (id && id.length >= 8) return id;

    id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : fallbackUUID();

    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (e.g. private browsing in some browsers)
    return typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : fallbackUUID();
  }
}

export function resetVoiceDeviceId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
