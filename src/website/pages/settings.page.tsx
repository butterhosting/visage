import { Artifact } from "@/models/Artifact";
import { useState } from "react";
import { DialogClient } from "../clients/DialogClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { Spinner } from "../comps/Spinner";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Website } from "@/models/Website";

export function settingsPage() {
  useDocumentTitle("Data | Visage");
  const websiteClient = useRegistry(WebsiteClient);
  const dialogClient = useRegistry(DialogClient);
  const { data: websites, setData: setWebsites } = useYesQuery({
    queryFn: () => websiteClient.query(),
  });
  const [busyWebsiteId, setBusyWebsiteId] = useState<string>();

  async function performExport({ id, hostname }: Website) {
    const result = await dialogClient.pickExportArtifact(hostname);
    if (result === "cancel") return;
    setBusyWebsiteId(id);
    try {
      await websiteClient.export(hostname, result as Artifact.Enum);
    } finally {
      setBusyWebsiteId(undefined);
    }
  }

  async function performUpdate({ id, hostname }: Website) {
    throw new Error("TODO: Not implemented");
  }

  async function performDelete({ id, hostname }: Website) {
    const result = await dialogClient.confirmDelete(hostname);
    if (result === "cancel") return;
    setBusyWebsiteId(id);
    try {
      await websiteClient.delete(hostname);
      setWebsites(websites?.filter((w) => w.id !== id));
    } finally {
      setBusyWebsiteId(undefined);
    }
  }

  return (
    <Skeleton>
      <Paper>
        {websites?.map((website) => {
          const isBusy = busyWebsiteId === website.id;
          return (
            <div key={website.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <span className="font-bold text-c-dark">{website.hostname}</span>
              </div>
              {isBusy ? (
                <Spinner />
              ) : (
                <>
                  <button
                    onClick={() => performExport(website)}
                    disabled={!!busyWebsiteId}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-c-primary hover:text-c-dark hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => performUpdate(website)}
                    disabled={!!busyWebsiteId}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-c-dark/60 hover:text-c-dark hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => performDelete(website)}
                    disabled={!!busyWebsiteId}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-red-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          );
        })}
        {websites?.length === 0 && (
          <div className="px-6 py-12 text-center">
            <span className="text-sm font-bold text-c-dark/20 tracking-wide">NO WEBSITES</span>
          </div>
        )}
      </Paper>
    </Skeleton>
  );
}
