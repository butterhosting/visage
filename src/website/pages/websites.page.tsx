import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function websitesPage() {
  useDocumentTitle("Websites | Visage");
  return (
    <Skeleton>
      <Paper>
        <h1>Websites</h1>
      </Paper>
    </Skeleton>
  );
}
