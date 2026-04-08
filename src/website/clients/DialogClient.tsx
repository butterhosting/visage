import { Website } from "@/models/Website";
import { WebsiteRM } from "@/models/WebsiteRM";
import { PeriodModal } from "../comps/dashboard/PeriodModal";
import { DialogManager } from "../comps/DialogManager";
import { WebsiteDeleteModal } from "../comps/WebsiteDeleteModal";
import { WebsiteExportModal } from "../comps/WebsiteExportModal";
import { WebsiteModal } from "../comps/WebsiteModal";
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

  public websiteExport(website: Website): Promise<"cancel" | "done"> {
    type Result = Awaited<ReturnType<typeof this.websiteExport>>;
    const { promise, resolve: internalResolve } = Promise.withResolvers<Result>();
    const resolve = (result: Result) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(
      <WebsiteExportModal website={website} close={() => resolve("cancel")} done={() => resolve("done")} />,
    );
    return promise;
  }

  public websiteCreateOrUpdate(existing?: Website): Promise<"cancel" | WebsiteRM> {
    type Result = Awaited<ReturnType<typeof this.websiteCreateOrUpdate>>;
    const { promise, resolve: internalResolve } = Promise.withResolvers<Result>();
    const resolve = (result: Result) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(
      <WebsiteModal existing={existing} close={() => resolve("cancel")} done={(website) => resolve(website)} />,
    );
    return promise;
  }

  public websiteDelete(website: Website): Promise<"cancel" | WebsiteRM> {
    type Result = Awaited<ReturnType<typeof this.websiteDelete>>;
    const { promise, resolve: internalResolve } = Promise.withResolvers<Result>();
    const resolve = (result: Result) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(
      <WebsiteDeleteModal website={website} close={() => resolve("cancel")} done={(website) => resolve(website)} />,
    );
    return promise;
  }
}
