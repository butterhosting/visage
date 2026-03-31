import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function apiPage() {
  useDocumentTitle("API | Visage");
  return <h1>API</h1>;
}
