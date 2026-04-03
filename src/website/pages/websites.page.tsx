import { Link } from "react-router";
import { WebsiteClient } from "../clients/WebsiteClient";
import { Skeleton } from "../comps/Skeleton";
import { WebsiteCard } from "../comps/WebsiteCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";
import { Route } from "../Route";

export function websitesPage() {
  useDocumentTitle("Websites | Visage");
  const websiteClient = useRegistry(WebsiteClient);
  const { data: websites } = useYesQuery({
    queryFn: () => websiteClient.query(),
  });

  return (
    <Skeleton className="grid grid-cols-3 gap-5">
      {websites?.map((website) => (
        <Link key={website.id} to={Route.websites(website.id)}>
          <WebsiteCard website={website} />
        </Link>
      ))}
    </Skeleton>
  );
}
