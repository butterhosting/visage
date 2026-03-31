import { Website } from "@/models/Website";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { WebsiteCard } from "../comps/WebsiteCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Temporal } from "@js-temporal/polyfill";
import { Link } from "react-router";
import { Route } from "../Route";

export function websitesPage() {
  useDocumentTitle("Websites | Visage");
  const websites: Website[] = [
    {
      id: crypto.randomUUID(),
      object: "website",
      created: Temporal.Now.instant(),
      hostname: "www.example.com",
    },
    {
      id: crypto.randomUUID(),
      object: "website",
      created: Temporal.Now.instant(),
      hostname: "www.google.com",
    },
    {
      id: crypto.randomUUID(),
      object: "website",
      created: Temporal.Now.instant(),
      hostname: "www.netflix.com",
    },
    {
      id: crypto.randomUUID(),
      object: "website",
      created: Temporal.Now.instant(),
      hostname: "www.youtube.com",
    },
  ];
  return (
    <Skeleton className="grid grid-cols-3 gap-5">
      {websites.map((website) => (
        <Link to={Route.websites(website.id)}>
          <WebsiteCard website={website} />
        </Link>
      ))}
    </Skeleton>
  );
}
