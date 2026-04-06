import { useState } from "react";
import { Modal } from "../Modal";

type Props = {
  hostname: string;
  close: () => void;
  confirm: () => void;
};
export function DeleteModal({ hostname, close, confirm }: Props) {
  const [input, setInput] = useState("");
  const matches = input === hostname;
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={close} className="p-6">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-c-dark">Delete website</h2>
        <p className="text-sm text-c-dark/60">
          This will permanently delete <span className="font-bold text-c-dark">{hostname}</span> and all of its analytics data. This action
          cannot be undone.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-c-dark/50 tracking-wide">
            TYPE <span className="text-c-dark">{hostname}</span> TO CONFIRM
          </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="px-3 py-2 rounded-lg border border-black/10 text-sm text-c-dark focus:outline-none focus:border-c-primary"
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
            onClick={confirm}
            disabled={!matches}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
