import { Link, useNavigate } from "react-router";
import { DialogClient } from "../clients/DialogClient";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { WebsiteCard } from "../comps/WebsiteCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Icon } from "../images/Icon";
import { Route } from "../Route";

export function websitesPage() {
  useDocumentTitle("Websites | Visage");
  const navigate = useNavigate();
  const websiteClient = useRegistry(WebsiteClient);
  const dialogClient = useRegistry(DialogClient);
  const { data: websites = [] } = useYesQuery({
    queryFn: () => websiteClient.query(),
  });

  async function handleCreate() {
    const result = await dialogClient.websiteCreateOrUpdate();
    if (result === "cancel") return;
    navigate(Route.websites(result.hostname));
  }

  return (
    <Skeleton className="grid grid-cols-3 sm:grid-cols-1 md:grid-cols-2 grid-rows-[200px] auto-rows-[200px] gap-5 content-start">
      {[...websites, "new" as const].map((website) => {
        if (typeof website === "object") {
          return (
            <Link key={website.id} to={Route.websites(website.hostname)} className="h-full">
              <WebsiteCard className="hover:shadow-xl h-full" website={website} />
            </Link>
          );
        }
        return (
          <button key="new" onClick={handleCreate} className="group cursor-pointer">
            <Paper className="h-full flex flex-col items-center justify-center gap-3 group-hover:shadow-xl text-c-dark-half group-hover:text-c-accent transition-colors">
              <Icon.Plus className="size-8" />
              <span className="text-sm">add website</span>
            </Paper>
          </button>
        );
      })}
    </Skeleton>
  );
}
