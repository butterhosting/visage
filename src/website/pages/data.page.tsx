import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function dataPage() {
  useDocumentTitle("Data | Visage");
  return (
    <Skeleton>
      <h1>Data</h1>;
    </Skeleton>
  );
}
