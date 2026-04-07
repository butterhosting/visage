import { Artifact as Artifact } from "@/models/Artifact";
import { Modal } from "./Modal";

type Props = {
  hostname: string;
  close: () => void;
  download: (artifact: Artifact.Enum) => void;
};
export function DownloadModal({ hostname, close, download }: Props) {
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={close} className="p-6">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">Download data</h2>
        <div className="mt-4 flex flex-col gap-2">
          {Object.values(Artifact.Enum).map((artifact) => (
            <button
              onClick={() => download(artifact)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-black/10 hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors text-left"
            >
              <span className="font-mono text-c-dark">{Artifact.filename(artifact, hostname)}</span>
              <span className="text-xs text-c-dark/40 ml-auto">
                {artifact === Artifact.Enum.analytics ? "Normal traffic" : "Bot traffic"}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={close}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
