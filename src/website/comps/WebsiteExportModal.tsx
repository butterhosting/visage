import { Artifact } from "@/models/Artifact";
import { Website } from "@/models/Website";
import { useState } from "react";
import { WebsiteClient } from "../clients/WebsiteClient";
import { useRegistry } from "../hooks/useRegistry";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";
import { object } from "zod/v3";

type Props = {
  website: Website;
  close: () => void;
  done: () => void;
};
export function WebsiteExportModal({ website, close, done }: Props) {
  const websiteClient = useRegistry(WebsiteClient);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleSelect(artifact: Artifact.Enum) {
    let objectUrl: string | undefined;
    try {
      setError(undefined);
      setBusy(true);
      const blob = await websiteClient.export(website.id, artifact);
      objectUrl = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement("a"), {
        href: objectUrl,
        download: Artifact.filename(artifact, website.hostname),
      });
      anchor.click();
      done();
    } catch (e) {
      setError(JSON.stringify(e, null, 2));
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setBusy(false);
    }
  }

  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={() => !busy && close()} className="p-6">
      <div className="flex flex-col gap-5">
        <div className="mt-4 flex flex-col gap-2">
          {Object.values(Artifact.Enum).map((artifact) => (
            <button
              key={artifact}
              onClick={() => handleSelect(artifact)}
              disabled={busy}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-black/10 hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors text-left disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="font-mono text-c-dark">{Artifact.filename(artifact, website.hostname)}</span>
              <span className="text-xs text-c-dark/40 ml-auto">
                {artifact === Artifact.Enum.analytics ? "Normal traffic" : "Bot traffic"}
              </span>
            </button>
          ))}
        </div>
        {error && <pre className="text-sm text-red-500 whitespace-pre-wrap">{error}</pre>}
        {busy ? (
          <div className="mt-4 flex justify-end">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4 flex justify-end">
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
