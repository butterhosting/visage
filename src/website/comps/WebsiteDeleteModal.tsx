import { useState } from "react";
import { Modal } from "./Modal";

type Props = {
  hostname: string;
  close: () => void;
  confirm: () => void;
};
export function WebsiteDeleteModal({ hostname, close, confirm }: Props) {
  const [input, setInput] = useState("");
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={close} className="p-6">
      <div className="flex flex-col gap-5">
        <p className="text-c-dark/60">This will permanently delete all analytics data and cannot be undone.</p>
        <p className="text-c-dark/60">
          Please type <code className="text-black">{hostname}</code> to confirm.
        </p>
        {/* TODO: annoying auto-focus on mobile */}
        <input
          autoFocus={false}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="px-3 py-2 rounded-lg border border-black/10 text-sm text-c-dark focus:outline-none focus:border-c-primary"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={close}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={input !== hostname}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
