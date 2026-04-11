import { TokenRM } from "@/models/TokenRM";
import { useState } from "react";
import { TokenClient } from "../clients/TokenClient";
import { useRegistry } from "../hooks/useRegistry";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

type Props = {
  token: TokenRM;
  close: () => void;
  done: (token: TokenRM) => void;
};
export function TokenDeleteModal({ token, close, done }: Props) {
  const tokenClient = useRegistry(TokenClient);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    try {
      setError(undefined);
      setBusy(true);
      done(await tokenClient.delete(token.id));
    } catch (e) {
      setError(JSON.stringify(e, null, 2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={() => !busy && close()} className="p-6">
      <div className="flex flex-col gap-5">
        <p className="text-c-dark-half">
          This will permanently delete token <code className="font-bold">{token.id}</code>. Any applications using this token will lose
          access immediately.
        </p>
        {error && <pre className="text-c-error whitespace-pre-wrap">{error}</pre>}
        {busy ? (
          <div className="flex justify-end">
            <Spinner />
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg font-semibold text-c-dark-half hover:text-c-dark-full cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg font-semibold bg-c-error text-white cursor-pointer hover:bg-c-error transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
