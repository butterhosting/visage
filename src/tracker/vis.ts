import { BrowserTrackingEvent } from "@/models/BrowserTrackingEvent";

const originalPushState = history.pushState.bind(history);
const originalReplaceState = history.replaceState.bind(history);
const skipLocalhostCollection = "{{SKIP_LOCALHOST_COLLECTION}}" as "true" | "false";

let spaCount = 0;
let pageId = crypto.randomUUID();
let startTime = Date.now();
let msHidden = 0;
let hiddenSince: number | null = null;

function shouldSkipRequest(): boolean {
  if (skipLocalhostCollection === "true" && window.location.hostname === "localhost") {
    console.warn("[Visage] Skipping analytics collection on `localhost`");
    return true;
  }
  return false;
}

function submitStart(): void {
  if (shouldSkipRequest()) {
    return;
  }
  const event: BrowserTrackingEvent.Start = {
    t: "s",
    pi: pageId,
    u: window.location.href,
    r: document.referrer || undefined,
    ua: navigator.userAgent,
    sw: screen.width,
    sh: screen.height,
    vw: window.innerWidth,
    vh: window.innerHeight,
    l: navigator.language || undefined,
    sc: spaCount,
  };
  navigator.sendBeacon("{{INGESTION_ENDPOINT}}", JSON.stringify(event));
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
    pi: pageId,
    d: Math.max(0, Date.now() - startTime - msHidden),
  };
  navigator.sendBeacon("{{INGESTION_ENDPOINT}}", JSON.stringify(event));
}

function resetPage(): void {
  pageId = crypto.randomUUID();
  startTime = Date.now();
  msHidden = 0;
  hiddenSince = null;
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
