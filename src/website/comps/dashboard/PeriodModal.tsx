import { Period } from "@/website/femodels/Period";
import { Temporal } from "@js-temporal/polyfill";
import { useMemo, useState } from "react";
import { Button } from "../Button";
import { Modal } from "../Modal";

type Props = {
  defaultPeriodRange: Period.Range;
  apply: (from: Temporal.PlainDate, to: Temporal.PlainDate) => unknown;
  close: () => unknown;
};
export function PeriodModal({ defaultPeriodRange, apply, close }: Props) {
  const defaultState = useMemo(() => {
    const today = Temporal.Now.plainDateISO(); // TODO: timezone?
    const { from, to } = defaultPeriodRange;
    if (from && to) {
      const { fromDate, toDate } = Period.toDates({ fromInstant: from, toInstant: to });
      return {
        today,
        from: fromDate,
        to: toDate,
      };
    }
    return {
      today,
      from: today,
      to: today,
    };
  }, []);

  const [from, setFrom] = useState(defaultState.from);
  const [to, setTo] = useState(defaultState.to);
  return (
    <Modal isOpen issueCloseRequestWhenClickingBackdrop onCloseRequest={close} className="p-6">
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">Custom date range</h2>
        <div className="flex gap-4">
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-xs font-bold text-c-dark-half tracking-wide">FROM</span>
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
              className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-c-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-xs font-bold text-c-dark-half tracking-wide">TO</span>
            <input
              type="date"
              min={from.toString()}
              max={defaultState.today.toString()}
              value={to.toString()}
              onChange={(e) => {
                try {
                  setTo(Temporal.PlainDate.from(e.target.value));
                } catch (e) {
                  // ignore
                }
              }}
              className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:border-c-accent"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" theme="neutral" onClick={close}>
            Cancel
          </Button>
          <Button onClick={() => apply(from, to)} disabled={!from || !to}>
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}
