import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function dataPage() {
  useDocumentTitle("Data | Visage");
  return <h1>Data</h1>;
}
