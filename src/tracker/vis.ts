import { BrowserTrackingEvent } from "@/models/BrowserTrackingEvent";

const ingestionEndpoint = new URL("i", document.currentScript?.getAttribute("src") as string);
const originalPushState = history.pushState.bind(history);
const originalReplaceState = history.replaceState.bind(history);
const clientSideBotDetection = "{{CLIENT_SIDE_BOT_DETECTION}}" as "T" | "F";
const skipLocalhostCollection = "{{SKIP_LOCALHOST_COLLECTION}}" as "T" | "F";

let spaCount: number = 0;
let cpi: string;
let startTime: number;
let msHidden: number;
let hiddenSince: number | null;

function resetPage(): void {
  cpi = crypto.randomUUID();
  startTime = Date.now();
  msHidden = 0;
  hiddenSince = null;
}
resetPage();

function shouldSkipRequest(): boolean {
  if (skipLocalhostCollection === "T" && window.location.hostname === "localhost") {
    console.warn("[Visage] Skipping analytics on `localhost`");
    return true;
  }
  return false;
}

function getNavigationType(): BrowserTrackingEvent.Start["nt"] {
  try {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return entry?.type;
  } catch {
    return undefined;
  }
}

function detectBot(): true | undefined {
  if (clientSideBotDetection === "T") {
    const w = window as any;
    const isBot =
      navigator.webdriver ||
      !!w.__nightmare ||
      !!w.callPhantom ||
      !!w._phantom ||
      !!w.phantom ||
      !!w.__polypane ||
      !!w._bot ||
      Math.random() === Math.random();
    if (isBot) {
      return true;
    }
  }
}

function submitStart(): void {
  if (shouldSkipRequest()) {
    return;
  }
  const event: BrowserTrackingEvent.Start = {
    t: "s",
    cpi,
    u: window.location.href,
    r: document.referrer || undefined,
    sc: spaCount,
    nt: spaCount === 0 ? getNavigationType() : "navigate",
    b: detectBot(),
    ua: navigator.userAgent,
    sw: screen.width,
    sh: screen.height,
    vw: window.innerWidth,
    vh: window.innerHeight,
    l: navigator.language || undefined,
  };
  navigator.sendBeacon(ingestionEndpoint, JSON.stringify(event));
  spaCount++;
}

function submitEnd(): void {
  if (shouldSkipRequest()) {
    return;
  }
  if (hiddenSince !== null) {
    msHidden += Date.now() - hiddenSince;
    hiddenSince = null;
  }
  const event: BrowserTrackingEvent.End = {
    t: "e",
    cpi,
    dms: Math.max(0, Date.now() - startTime - msHidden),
  };
  navigator.sendBeacon(ingestionEndpoint, JSON.stringify(event));
}

function navigate(): void {
  submitEnd();
  resetPage();
  submitStart();
}

// Track hidden time
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hiddenSince = Date.now();
  } else if (hiddenSince !== null) {
    msHidden += Date.now() - hiddenSince;
    hiddenSince = null;
  }
});

// Submit on page load / unload
submitStart();
window.addEventListener("pagehide", () => submitEnd());

// Submit on SPA push / replace / back / forward
history.pushState = (...args) => {
  originalPushState(...args);
  navigate();
};
history.replaceState = (...args) => {
  originalReplaceState(...args);
  navigate();
};
window.addEventListener("popstate", () => navigate());
