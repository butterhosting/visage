import { Artifact } from "@/models/Artifact";
import { Website } from "@/models/Website";
import { useState } from "react";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Period } from "../femodels/Period";
import { useRegistry } from "../hooks/useRegistry";
import { Button } from "./Button";
import { PeriodPicker } from "./dashboard/PeriodPicker";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

type Props = {
  website: Website;
  close: () => void;
  done: () => void;
};
export function WebsiteExportModal({ website, close, done }: Props) {
  const websiteClient = useRegistry(WebsiteClient);
  const [period, setPeriod] = useState(Period.forPreset(Period.Preset.all));
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
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={() => !busy && close()} className="p-6 overflow-visible">
      <div className="flex flex-col gap-5">
        <PeriodPicker period={period} onChange={setPeriod} className="self-start" />
        <div className="mt-4 flex flex-col gap-2">
          {Object.values(Artifact.Enum).map((artifact) => (
            <button
              key={artifact}
              onClick={() => handleSelect(artifact)}
              disabled={busy}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-black/10 hover:border-c-accent/30 hover:bg-c-accent/5 cursor-pointer transition-colors text-left disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="font-mono">{Artifact.filename(artifact, website.hostname)}</span>
              <span className="text-xs text-c-dark-half ml-auto">
                {artifact === Artifact.Enum.analytics ? "Normal traffic" : "Bot traffic"}
                {/* TODO: bit more consistent if we use buttons here as well ... now its just a floating "cancel" without any purple CTA button */}
              </span>
            </button>
          ))}
        </div>
        {error && <pre className="text-sm text-c-error whitespace-pre-wrap">{error}</pre>}
        {busy ? (
          <div className="mt-4 flex justify-end">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" theme="neutral" onClick={close}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
