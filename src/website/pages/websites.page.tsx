import { Link, useNavigate } from "react-router";
import { DialogClient } from "../clients/DialogClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { WebsiteCard } from "../comps/WebsiteCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Route } from "../Route";

export function websitesPage() {
  useDocumentTitle("Websites | Visage");
  const navigate = useNavigate();
  const websiteClient = useRegistry(WebsiteClient);
  const dialogClient = useRegistry(DialogClient);
  const { data: websites } = useYesQuery({
    queryFn: () => websiteClient.query(),
  });

  async function handleCreate() {
    const result = await dialogClient.createWebsite();
    if (result === "cancel") return;
    const website = await websiteClient.create(result);
    navigate(Route.websites(website.hostname));
  }

  return (
    <Skeleton className="grid grid-cols-3 sm:grid-cols-1 md:grid-cols-2 gap-5">
      {websites?.map((website) => (
        <Link key={website.id} to={Route.websites(website.hostname)}>
          <WebsiteCard website={website} />
        </Link>
      ))}
      <button onClick={handleCreate} className="cursor-pointer">
        <Paper className="flex items-center justify-center h-full min-h-48 hover:shadow-lg hover:border-c-primary/30 transition-shadow">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-c-dark/30">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Paper>
      </button>
    </Skeleton>
  );
}
