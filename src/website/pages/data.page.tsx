import { DialogClient } from "../clients/DialogClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";

export function dataPage() {
  useDocumentTitle("Data | Visage");
  const websiteClient = useRegistry(WebsiteClient);
  const dialogClient = useRegistry(DialogClient);
  const { data: websites } = useYesQuery({
    queryFn: () => websiteClient.query(),
  });

  async function handleDownload(hostname: string) {
    const result = await dialogClient.pickDownload(hostname);
    if (result === "cancel") return;
    // TODO: call download endpoint
    console.log(`Download ${hostname}.${result}.json`);
  }

  async function handleDelete(hostname: string) {
    const result = await dialogClient.confirmDelete(hostname);
    if (result === "cancel") return;
    // TODO: call delete endpoint
    console.log(`Delete ${hostname}`);
  }

  return (
    <Skeleton className="grid grid-cols-1 gap-5">
      <Paper className="divide-y divide-black/5">
        {websites?.map((website) => (
          <div key={website.id} className="flex items-center gap-4 px-6 py-4">
            <div className="flex-1 min-w-0">
              <span className="font-bold text-c-dark">{website.hostname}</span>
            </div>
            <button
              onClick={() => handleDownload(website.hostname)}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-c-dark/60 hover:text-c-dark hover:border-c-primary/30 hover:bg-c-primary/5 cursor-pointer transition-colors"
            >
              Download
            </button>
            <button
              onClick={() => handleDelete(website.hostname)}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-red-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
        {websites?.length === 0 && (
          <div className="px-6 py-12 text-center">
            <span className="text-sm font-bold text-c-dark/20 tracking-wide">NO WEBSITES</span>
          </div>
        )}
      </Paper>
    </Skeleton>
  );
}
