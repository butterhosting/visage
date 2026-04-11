import { Website } from "@/models/Website";
import { WebsiteRM } from "@/models/WebsiteRM";
import { useState } from "react";
import { WebsiteClient } from "../clients/WebsiteClient";
import { useRegistry } from "../hooks/useRegistry";
import { Modal } from "./Modal";

type Props = {
  existing?: Website;
  close: () => void;
  done: (website: WebsiteRM) => void;
};
export function WebsiteModal({ existing, close, done }: Props) {
  const websiteClient = useRegistry(WebsiteClient);
  const [hostname, setHostname] = useState(existing?.hostname ?? "");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!hostname.trim()) return;
    try {
      setError(undefined);
      setBusy(true);
      const website = existing
        ? await websiteClient.update(existing.hostname, { hostname: hostname.trim() })
        : await websiteClient.create(hostname.trim());
      done(website);
    } catch (e) {
      setError(JSON.stringify(e, null, 2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={() => !busy && close()} className="p-6">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">{existing ? "Update website" : "Add website"}</h2>
        <label className="flex flex-col gap-1.5">
          <input
            type="text"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="Enter hostname, e.g.: www.example.com"
            className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-c-accent"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </label>
        {error && <pre className="text-sm text-c-error whitespace-pre-wrap">{error}</pre>}
        <div className="flex justify-end gap-3">
          <button
            onClick={close}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark-half hover:text-c-dark-full cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!hostname.trim() || busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-c-accent text-white cursor-pointer hover:bg-c-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {existing ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
