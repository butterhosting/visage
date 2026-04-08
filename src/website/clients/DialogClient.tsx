import { Artifact } from "@/models/Artifact";
import { PeriodModal } from "../comps/dashboard/PeriodModal";
import { DeleteModal } from "../comps/DeleteModal";
import { ExportModal } from "../comps/ExportModal";
import { CreateWebsiteModal } from "../comps/CreateWebsiteModal";
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

  public pickExportArtifact(hostname: string): Promise<"cancel" | Artifact.Enum> {
    type Result = Awaited<ReturnType<typeof this.pickExportArtifact>>;
    const { promise, resolve: internalResolve } = Promise.withResolvers<Result>();
    const resolve = (result: Result) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(
      <ExportModal hostname={hostname} close={() => resolve("cancel")} onSelect={(type) => resolve(type)} />,
    );
    return promise;
  }

  public createWebsite(): Promise<"cancel" | string> {
    type Result = Awaited<ReturnType<typeof this.createWebsite>>;
    const { promise, resolve: internalResolve } = Promise.withResolvers<Result>();
    const resolve = (result: Result) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(<CreateWebsiteModal close={() => resolve("cancel")} create={(hostname) => resolve(hostname)} />);
    return promise;
  }

  public confirmDelete(hostname: string): Promise<"cancel" | "confirm"> {
    type Result = Awaited<ReturnType<typeof this.confirmDelete>>;
    const { promise, resolve: internalResolve } = Promise.withResolvers<Result>();
    const resolve = (result: Result) => {
      internalResolve(result);
      this.manager.remove({ token });
    };
    const { token } = this.manager.insert(
      <DeleteModal hostname={hostname} close={() => resolve("cancel")} confirm={() => resolve("confirm")} />,
    );
    return promise;
  }
}
