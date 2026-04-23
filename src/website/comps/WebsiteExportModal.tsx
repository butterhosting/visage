import { Artifact } from "@/models/Artifact";
import { Website } from "@/models/Website";
import clsx from "clsx";
import { useState } from "react";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Period } from "../../models/Period";
import { useRegistry } from "../hooks/useRegistry";
import { Button } from "./Button";
import { PeriodPicker } from "./dashboard/PeriodPicker";
import { Modal } from "./Modal";

type Props = {
  website: Website;
  close: () => void;
  done: () => void;
};
export function WebsiteExportModal({ website, close, done }: Props) {
  const websiteClient = useRegistry(WebsiteClient);
  const { O_VISAGE_TIMEZONE } = useRegistry("env");

  const [period, setPeriod] = useState(Period.forPreset(Period.Preset.all, O_VISAGE_TIMEZONE));
  const [artifact, setArtifact] = useState<Artifact.Enum>(Artifact.Enum.analytics);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    let objectUrl: string | undefined;
    try {
      setError(undefined);
      setBusy(true);
      const blob = await websiteClient.export(website.id, artifact, { from: period.from, to: period.to });
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
        <div className="flex flex-col gap-2">
          {Object.values(Artifact.Enum).map((option) => {
            const selected = option === artifact;
            return (
              <label
                key={option}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors",
                  selected ? "border-c-accent bg-c-accent/5" : "border-black/10 hover:border-c-accent/30 hover:bg-c-accent/5",
                )}
              >
                <input
                  type="radio"
                  checked={selected}
                  onChange={() => setArtifact(option)}
                  disabled={busy}
                  className="size-4 accent-c-accent"
                />
                <span className="font-mono">{Artifact.filename(option, website.hostname)}</span>
                <span className="text-xs text-c-dark-half ml-auto">
                  {option === Artifact.Enum.analytics ? "Normal traffic" : "Bot traffic"}
                </span>
              </label>
            );
          })}
        </div>
        {error && <pre className="text-sm text-c-error whitespace-pre-wrap">{error}</pre>}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" theme="neutral" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleExport} loading={busy}>
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
}
