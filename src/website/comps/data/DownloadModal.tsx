import { Modal } from "../Modal";

type Props = {
  hostname: string;
  close: () => void;
  download: (type: "analytics" | "bots") => void;
};
export function DownloadModal({ hostname, close, download }: Props) {
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={close} className="p-6">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-c-dark">Download data</h2>
        <p className="text-sm text-c-dark/60">
          Choose which data to download for <span className="font-bold text-c-dark">{hostname}</span>
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => download("analytics")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-black/10 hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors text-left"
          >
            <span className="text-sm font-semibold text-c-dark">{hostname}.analytics.json</span>
            <span className="text-xs text-c-dark/40 ml-auto">Normal traffic</span>
          </button>
          <button
            onClick={() => download("bots")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-black/10 hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors text-left"
          >
            <span className="text-sm font-semibold text-c-dark">{hostname}.bots.json</span>
            <span className="text-xs text-c-dark/40 ml-auto">Bot traffic</span>
          </button>
        </div>
        <div className="flex justify-end">
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
