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

export function dataPage() {
  useDocumentTitle("Data | Visage");
  const websiteClient = useRegistry(WebsiteClient);
  const dialogClient = useRegistry(DialogClient);
  const { data: websites, setData: setWebsites } = useYesQuery({
    queryFn: () => websiteClient.query(),
  });
  const [busyId, setBusyId] = useState<string>();

  async function download(hostname: string, id: string) {
    const result = await dialogClient.pickDownload(hostname);
    if (result === "cancel") return;
    setBusyId(id);
    try {
      await websiteClient.download(hostname, result as Artifact.Enum);
    } finally {
      setBusyId(undefined);
    }
  }

  async function handleDelete(hostname: string, id: string) {
    const result = await dialogClient.confirmDelete(hostname);
    if (result === "cancel") return;
    setBusyId(id);
    try {
      await websiteClient.delete(hostname);
      setWebsites(websites?.filter((w) => w.id !== id));
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <Skeleton className="grid grid-cols-1 gap-5">
      <Paper className="divide-y divide-black/5">
        {websites?.map((website) => {
          const isBusy = busyId === website.id;
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
                    onClick={() => download(website.hostname, website.id)}
                    disabled={!!busyId}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-c-dark/60 hover:text-c-dark hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(website.hostname, website.id)}
                    disabled={!!busyId}
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
