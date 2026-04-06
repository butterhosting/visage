import { useState } from "react";
import { Modal } from "./Modal";

type Props = {
  close: () => void;
  create: (hostname: string) => void;
};
export function CreateWebsiteModal({ close, create }: Props) {
  const [hostname, setHostname] = useState("");
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={close} className="p-6">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-c-dark">Add website</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-c-dark/50 tracking-wide">HOSTNAME</span>
          <input
            type="text"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="example.com"
            className="px-3 py-2 rounded-lg border border-black/10 text-sm text-c-dark focus:outline-none focus:border-c-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && hostname.trim()) create(hostname.trim());
            }}
          />
        </label>
        <div className="flex justify-end gap-3">
          <button
            onClick={close}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => create(hostname.trim())}
            disabled={!hostname.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-c-primary text-white cursor-pointer hover:bg-c-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
}
