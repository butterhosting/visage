import { Website } from "@/models/Website";
import { Temporal } from "@js-temporal/polyfill";
import { Link } from "react-router";
import { Skeleton } from "../comps/Skeleton";
import { WebsiteCard } from "../comps/WebsiteCard";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Route } from "../Route";

export function websitesPage() {
  useDocumentTitle("Websites | Visage");
  const websites: Website[] = [
    {
      id: "bd668786-55bf-45af-9d44-116142aea97f",
      object: "website",
      created: Temporal.Now.instant(),
      hostname: "www.example.com",
    },
    {
      id: "ef33e6d6-c3de-43be-9a72-8aea26ddf13f",
      object: "website",
      created: Temporal.Now.instant(),
      hostname: "www.google.com",
    },
    {
      id: "5c265941-a612-4db0-9e59-592ba5fec4c0",
      object: "website",
      created: Temporal.Now.instant(),
      hostname: "www.netflix.com",
    },
    {
      id: "b4b7a250-4b6e-4462-ba80-a0c665920ea0",
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
