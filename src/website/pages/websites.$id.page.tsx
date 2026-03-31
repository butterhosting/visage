import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function websites$idPage() {
  useDocumentTitle("example.com | Websites | Visage");
  return (
    <Skeleton className="grid grid-cols-3 gap-5">
      <Paper className="col-span-full">
        <h1>example.com website</h1>
      </Paper>
    </Skeleton>
  );
}
