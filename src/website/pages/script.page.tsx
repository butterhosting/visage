import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function scriptPage() {
  useDocumentTitle("Script | Visage");
  return <h1>Script</h1>;
}
