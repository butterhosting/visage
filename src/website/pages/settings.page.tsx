import { DialogClient } from "../clients/DialogClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Website } from "@/models/Website";

export function settingsPage() {
  useDocumentTitle("Settings | Visage");
  const websiteClient = useRegistry(WebsiteClient);
  const dialogClient = useRegistry(DialogClient);
  const {
    data: websites,
    setData: setWebsites,
    getData: getWebsites,
  } = useYesQuery({
    queryFn: () => websiteClient.query(),
  });

  async function performExport(website: Website) {
    await dialogClient.websiteExport(website);
  }

  async function performUpdate(website: Website) {
    const result = await dialogClient.websiteCreateOrUpdate(website);
    if (typeof result === "object") {
      setWebsites((getWebsites() || []).map((w) => (w.id === result.id ? result : w)));
    }
  }

  async function performDelete(website: Website) {
    const result = await dialogClient.websiteDelete(website);
    console.log({ result });
    if (typeof result === "object") {
      setWebsites((getWebsites() || []).filter((w) => w.id !== result.id));
    }
  }

  return (
    <Skeleton>
      <Paper>
        {websites?.map((website) => (
          <div key={website.id} className="flex sm:flex-col items-center sm:items-start gap-4 px-6 py-4">
            <span className="flex-1 font-bold">{website.hostname}</span>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => performExport(website)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-c-accent hover:text-c-dark-full hover:border-c-accent/30 hover:bg-c-accent/5 cursor-pointer transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => performUpdate(website)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-c-dark-half hover:text-c-dark-full hover:border-c-accent/30 hover:bg-c-accent/5 cursor-pointer transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => performDelete(website)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-black/10 text-c-error/80 hover:text-c-error hover:border-c-error hover:c-error-50 cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {websites?.length === 0 && (
          <div className="px-6 py-12 text-center">
            <span className="text-sm font-bold text-c-dark-half tracking-wide">NO WEBSITES</span>
          </div>
        )}
      </Paper>
    </Skeleton>
  );
}
