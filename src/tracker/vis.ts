import { BrowserTrackingEvent } from "@/models/BrowserTrackingEvent";

let spaCount = 0;
let pageId = crypto.randomUUID();
let startTime = Date.now();
let msHidden = 0;
let hiddenSince: number | null = null;

const originalPushState = history.pushState.bind(history);
const originalReplaceState = history.replaceState.bind(history);

function submitStart(): void {
  const event: BrowserTrackingEvent.Start = {
    type: "start",
    pageId,
    url: window.location.href,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    locale: navigator.language || undefined,
    spaCount,
  };
  navigator.sendBeacon("{{INGESTION_ENDPOINT}}", JSON.stringify(event));
  spaCount++;
}

function submitEnd(): void {
  if (hiddenSince !== null) {
    msHidden += Date.now() - hiddenSince;
    hiddenSince = null;
  }
  const event: BrowserTrackingEvent.End = {
    type: "end",
    pageId,
    durationMs: Math.max(0, Date.now() - startTime - msHidden),
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
