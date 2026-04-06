import { PeriodModal } from "../comps/dashboard/PeriodModal";
import { DialogManager } from "../comps/DialogManager";
import { Period } from "../femodels/Period";

export class DialogClient {
  private _manager: DialogManager.Api | null = null;

  private get manager() {
    if (!this._manager) throw new Error(`Must initialize the ${DialogClient.name} before use`);
    return this._manager;
  }

  public initialize(manager: DialogManager.Api | null) {
    this._manager = manager;
  }

  public pickPeriodRange(defaultPeriodRange: Period.Range = {}): Promise<"cancel" | Period.Range> {
    type Result = Awaited<ReturnType<typeof this.pickPeriodRange>>;
    const { promise, resolve: internalResolve } = Promise.withResolvers<Result>();
    const resolve = (result: Result) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(
      <PeriodModal
        defaultPeriodRange={defaultPeriodRange}
        close={() => resolve("cancel")}
        apply={(from, to) => {
          resolve({
            from: from.toZonedDateTime("UTC").toInstant(),
            to: to.toZonedDateTime("UTC").add({ days: 1 }).toInstant(),
          });
        }}
      />,
    );
    return promise;
  }
}
