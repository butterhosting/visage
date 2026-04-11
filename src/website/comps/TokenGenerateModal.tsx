import { TokenRM } from "@/models/TokenRM";
import { WebsiteRM } from "@/models/WebsiteRM";
import { useState } from "react";
import { TokenClient } from "../clients/TokenClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Modal } from "./Modal";

type Props = {
  close: () => void;
  done: (token: TokenRM) => void;
};
export function TokenGenerateModal({ close, done }: Props) {
  const tokenClient = useRegistry(TokenClient);
  const websiteClient = useRegistry(WebsiteClient);
  const { data: websites } = useYesQuery({ queryFn: () => websiteClient.query() });

  const [scope, setScope] = useState<"all" | "specific">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<TokenRM | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleWebsite(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    try {
      setError(undefined);
      setBusy(true);
      const websites = scope === "all" ? ("*" as const) : [...selectedIds];
      const token = await tokenClient.generate(websites);
      setGeneratedToken(token);
    } catch (e) {
      setError(JSON.stringify(e, null, 2));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = scope === "all" || selectedIds.size > 0;

  const handleCloseRequest = () => {
    if (generatedToken) {
      done(generatedToken);
    }
    if (!busy) {
      close();
    }
  };

  if (generatedToken) {
    return (
      <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={handleCloseRequest} className="p-6">
        <div className="flex flex-col gap-5">
          <p className="text-c-dark/60">Please find your access token below.</p>
          <div className="relative group">
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedToken.value!);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="absolute top-1/2 -translate-y-1/2 right-2.5 z-10 p-1.5 rounded-md bg-white/10 text-c-dark/30 hover:text-c-dark/70 hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            >
              {copied ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
            </button>
            <code className="block px-3 py-2.5 rounded-lg bg-black/4 font-mono text-c-dark break-all select-all">
              {generatedToken.value}
            </code>
          </div>
          <p className="text-c-dark/60">
            When interacting with the API, use it in the Authorization header either as a bearer token or as a basic auth password:
          </p>
          <ul className="text-c-dark/60 list list-disc list-inside">
            <li>
              <code className="px-1.5 py-0.5 rounded-md text-c-primary bg-c-dark/6 text-[0.92em]">Authorization: Bearer TOKEN</code>
            </li>
            <li>
              <code className="px-1.5 py-0.5 rounded-md text-c-primary bg-c-dark/6 text-[0.92em]">Authorization: Basic b64(:TOKEN)</code>
            </li>
          </ul>
          <div className="flex justify-end">
            <button
              onClick={() => done(generatedToken)}
              className="px-4 py-2 rounded-lg font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={handleCloseRequest} className="p-6">
      <div className="flex flex-col gap-5">
        <p className="text-c-dark/60">Which websites should this token have access to?</p>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={scope === "all"} onChange={() => setScope("all")} className="accent-c-primary" />
            <span className="text-c-dark">All websites</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={scope === "specific"} onChange={() => setScope("specific")} className="accent-c-primary" />
            <span className="text-c-dark">Specific websites</span>
          </label>

          {scope === "specific" && (
            <div className="ml-6 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {websites?.map((w: WebsiteRM) => (
                <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(w.id)}
                    onChange={() => toggleWebsite(w.id)}
                    className="accent-c-primary"
                  />
                  <span className="text-c-dark">{w.hostname}</span>
                </label>
              ))}
              {websites?.length === 0 && <span className="text-c-dark/40">No websites found</span>}
            </div>
          )}
        </div>

        {error && <pre className="text-red-500 whitespace-pre-wrap">{error}</pre>}
        <div className="flex justify-end gap-3">
          <button
            onClick={close}
            disabled={busy}
            className="px-4 py-2 rounded-lg font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canSubmit || busy}
            className="px-4 py-2 rounded-lg font-semibold bg-c-primary text-white cursor-pointer hover:bg-c-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate
          </button>
        </div>
      </div>
    </Modal>
  );
}
