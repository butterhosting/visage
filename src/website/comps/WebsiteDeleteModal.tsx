import { Website } from "@/models/Website";
import { useState } from "react";
import { WebsiteClient } from "../clients/WebsiteClient";
import { useRegistry } from "../hooks/useRegistry";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { WebsiteRM } from "@/models/WebsiteRM";

type Props = {
  website: Website;
  close: () => void;
  done: (website: WebsiteRM) => unknown;
};
export function WebsiteDeleteModal({ website, close, done }: Props) {
  const websiteClient = useRegistry(WebsiteClient);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    try {
      setError(undefined);
      setBusy(true);
      done(await websiteClient.delete(website.hostname));
    } catch (e) {
      setError(JSON.stringify(e, null, 2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={() => !busy && close()} className="p-6">
      <div className="flex flex-col gap-5">
        <p className="text-c-dark-half">This will permanently delete all analytics data and cannot be undone.</p>
        <p className="text-c-dark-half">
          Please type <code className="text-black">{website.hostname}</code> to confirm.
        </p>
        <input
          autoFocus={false}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-c-accent"
        />
        {error && <pre className="text-sm text-c-error whitespace-pre-wrap">{error}</pre>}
        {busy ? (
          <div className="flex justify-end">
            <Spinner />
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark-half hover:text-c-dark-full cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={input !== website.hostname}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-c-error text-white cursor-pointer hover:bg-c-error transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
