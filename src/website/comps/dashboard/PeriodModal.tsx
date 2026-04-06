import { Temporal } from "@js-temporal/polyfill";
import { useState } from "react";
import { Modal } from "../Modal";

type Props = {
  apply: (from: Temporal.PlainDate, to: Temporal.PlainDate) => unknown;
  close: () => unknown;
};
export function PeriodModal({ apply, close }: Props) {
  const today = Temporal.Now.plainDateISO();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={close} className="p-6">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-bold text-c-dark">Custom date range</h2>
        <div className="flex gap-4">
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-xs font-bold text-c-dark/50 tracking-wide">FROM</span>
            <input
              type="date"
              max={to.toString()}
              value={from.toString()}
              onChange={(e) => {
                try {
                  setFrom(Temporal.PlainDate.from(e.target.value));
                } catch (e) {
                  // ignore
                }
              }}
              className="px-3 py-2 rounded-lg border border-black/10 text-sm text-c-dark focus:outline-none focus:border-c-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-xs font-bold text-c-dark/50 tracking-wide">TO</span>
            <input
              type="date"
              min={from.toString()}
              // max={today.toString()}
              value={to.toString()}
              onChange={(e) => {
                try {
                  setTo(Temporal.PlainDate.from(e.target.value));
                } catch (e) {
                  // ignore
                }
              }}
              className="px-3 py-2 rounded-lg border border-black/10 text-sm text-c-dark focus:outline-none focus:border-c-primary"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={close}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-c-dark/50 hover:text-c-dark cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => apply(from, to)}
            disabled={!from || !to}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-c-primary text-white cursor-pointer hover:bg-c-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
}
