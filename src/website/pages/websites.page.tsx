import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { WebsiteCard } from "../comps/WebsiteCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function websitesPage() {
  useDocumentTitle("Websites | Visage");
  return (
    <Skeleton className="grid grid-cols-3 gap-5">
      <WebsiteCard />
      <WebsiteCard />
      <WebsiteCard />
      <WebsiteCard />
      <WebsiteCard />
      <WebsiteCard />
      <WebsiteCard />
    </Skeleton>
  );
}
