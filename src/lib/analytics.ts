const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type GtagFn = (cmd: "config" | "event", target: string, params?: Record<string, any>) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  return (window as any).gtag || null;
}

export function pageview(path: string): void {
  if (!GA_ID) return;
  const gtag = getGtag();
  if (!gtag) {
    if (process.env.NODE_ENV === "development") console.log("[GA pageview]", path);
    return;
  }
  gtag("config", GA_ID, { page_path: path });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, any>
): void {
  if (!GA_ID) return;
  const gtag = getGtag();
  if (!gtag) {
    if (process.env.NODE_ENV === "development") console.log("[GA event]", eventName, params);
    return;
  }
  gtag("event", eventName, params);
}
