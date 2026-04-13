import { Prettify } from "@/helpers/Prettify";
import { TokenRM } from "@/models/TokenRM";
import { DialogClient } from "@/website/clients/DialogClient";
import { TokenClient } from "@/website/clients/TokenClient";
import { WebsiteClient } from "@/website/clients/WebsiteClient";
import { Button } from "@/website/comps/Button";
import { useRegistry } from "@/website/hooks/useRegistry";
import { useYesQuery } from "@/website/hooks/useYesQuery";
import clsx from "clsx";

export function TokensTab() {
  const tokenClient = useRegistry(TokenClient);
  const websiteClient = useRegistry(WebsiteClient);
  const dialogClient = useRegistry(DialogClient);
  const { O_VISAGE_TIMEZONE } = useRegistry("env");

  const { data: tokens, setData: setTokens, getData: getTokens } = useYesQuery({ queryFn: () => tokenClient.list() });
  const { data: websites } = useYesQuery({ queryFn: () => websiteClient.query() });

  async function handleGenerate() {
    const result = await dialogClient.tokenCreate();
    if (typeof result === "object") {
      setTokens([result, ...(getTokens() || [])]);
    }
  }

  async function handleDelete(token: TokenRM) {
    const result = await dialogClient.tokenDelete(token);
    if (typeof result === "object") {
      setTokens((getTokens() || []).filter((t) => t.id !== result.id));
    }
  }

  function formatScope(websiteIds: string[] | "*") {
    if (websiteIds === "*") return "All websites";
    const hostnameMap = new Map(websites?.map((w) => [w.id, w.hostname]));
    return websiteIds.map((id) => hostnameMap.get(id) ?? id).join(", ");
  }

  return (
    <div>
      {tokens && tokens.length > 0 && (
        <div className="rounded-xl border border-black/6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/2 text-left font-bold text-c-dark-half tracking-wide">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Scope</th>
                <th className="px-5 py-3">Last used ({O_VISAGE_TIMEZONE})</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-5 py-3">
                    <code className="font-bold">{token.id}</code>
                  </td>
                  <td className="px-5 py-3 text-c-dark-half">{formatScope(token.websiteIds)}</td>
                  <td className="px-5 py-3 text-c-dark-half">
                    {token.lastUsed
                      ? Prettify.timestamp(token.lastUsed, O_VISAGE_TIMEZONE, {
                          yearFmt: "present",
                          monthFmt: "full",
                          secondFmt: "present",
                        })
                      : "Never"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" theme="error" onClick={() => handleDelete(token)} className="px-0 py-0">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={clsx("flex justify-center", tokens?.length && "mt-6")}>
        <Button onClick={handleGenerate}>Generate token</Button>
      </div>
    </div>
  );
}
