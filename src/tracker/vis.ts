import { BrowserPayload } from "@/models/BrowserPayload";

let spaCount = 0;
const originalPushState = history.pushState.bind(history);
const originalReplaceState = history.replaceState.bind(history);

function createPayload(): BrowserPayload {
  return {
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
}

function submit(): void {
  const payload = createPayload();
  navigator.sendBeacon("{{INGESTION_ENDPOINT}}", JSON.stringify(payload));
  spaCount++;
}

// Submit on page load
submit();

// Submit on SPA push
history.pushState = (...args) => {
  originalPushState(...args);
  submit();
};

// Submit on SPA replace
history.replaceState = (...args) => {
  originalReplaceState(...args);
  submit();
};

// Submit on SPA back/forward
window.addEventListener("popstate", () => submit());
