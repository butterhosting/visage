import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function apiPage() {
  useDocumentTitle("API | Visage");
  return (
    <Skeleton>
      <h1>API</h1>;
    </Skeleton>
  );
}
