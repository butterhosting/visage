import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function websites$idPage() {
  useDocumentTitle("example.com | Websites | Visage");
  return <h1>example.com website</h1>;
}
