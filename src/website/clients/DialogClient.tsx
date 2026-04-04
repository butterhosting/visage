import { Temporal } from "@js-temporal/polyfill";
import { useState } from "react";
import { DialogManager } from "../comps/DialogManager";
import { Modal } from "../comps/Modal";

type PickDateTimeRangeResult =
  | "cancel"
  | {
      from?: Temporal.Instant;
      to?: Temporal.Instant;
    };

function DateRangeForm({ onApply, onCancel }: { onApply: (from: string, to: string) => void; onCancel: () => void }) {
  const today = Temporal.Now.plainDateISO().toString();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-c-dark">Custom date range</h2>
      <div className="flex gap-4">
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs font-bold text-c-dark/50 tracking-wide">FROM</span>
          <input
            type="date"
            max={to || today}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border border-black/10 text-sm text-c-dark focus:outline-none focus:border-c-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs font-bold text-c-dark/50 tracking-wide">TO</span>
          <input
            type="date"
            min={from}
            max={today}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-black/10 text-sm text-c-dark focus:outline-none focus:border-c-primary"
          />
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onApply(from, to)}
          disabled={!from || !to}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-c-primary text-white cursor-pointer hover:bg-c-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export class DialogClient {
  private _manager: DialogManager.Api | null = null;

  private get manager() {
    if (!this._manager) throw new Error(`Must initialize the ${DialogClient.name} before use`);
    return this._manager;
  }

  public initialize(manager: DialogManager.Api | null) {
    this._manager = manager;
  }

  public pickDateTimeRange(): Promise<PickDateTimeRangeResult> {
    const { promise, resolve: internalResolve } = Promise.withResolvers<PickDateTimeRangeResult>();
    const resolve = (result: PickDateTimeRangeResult) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(
      <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={() => resolve("cancel")} className="p-6">
        <DateRangeForm
          onCancel={() => resolve("cancel")}
          onApply={(from, to) => {
            const fromDate = Temporal.PlainDate.from(from);
            const toDate = Temporal.PlainDate.from(to);
            resolve({
              from: fromDate.toZonedDateTime("UTC").toInstant(),
              to: toDate.toZonedDateTime("UTC").add({ days: 1 }).toInstant(),
            });
          }}
        />
      </Modal>,
    );
    return promise;
  }
}
