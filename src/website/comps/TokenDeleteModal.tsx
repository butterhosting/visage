import { TokenRM } from "@/models/TokenRM";
import { useState } from "react";
import { TokenClient } from "../clients/TokenClient";
import { useRegistry } from "../hooks/useRegistry";
import { Button } from "./Button";
import { Modal } from "./Modal";

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
        <div className="flex justify-end gap-3">
          <Button variant="ghost" theme="neutral" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button theme="error" onClick={handleDelete} loading={busy}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
