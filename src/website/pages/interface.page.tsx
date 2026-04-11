import { TokenRM } from "@/models/TokenRM";
import { Temporal } from "@js-temporal/polyfill";
import { ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { codeToHtml } from "shiki";
import { DialogClient } from "../clients/DialogClient";
import { TokenClient } from "../clients/TokenClient";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useRegistry } from "../hooks/useRegistry";
import { useYesQuery } from "../hooks/useYesQuery";

enum Tab {
  example = "example",
  reference = "reference",
  tokens = "tokens",
}

export function interfacePage() {
  useDocumentTitle("API | Visage");

  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as Tab;
  const activeTab = Object.values(Tab).includes(tabParam) ? tabParam : Tab.example;
  const setActiveTab = (tab: Tab) => setParams(tab === Tab.example ? {} : { tab }, { replace: true });

  return (
    <Skeleton>
      <Paper>
        {/* Endpoint header */}
        <div className="p-8 pb-0 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-c-primary/10 text-c-primary font-bold tracking-wide">GET</span>
            <code className="text-xl font-extrabold text-c-dark">/api/stats</code>
          </div>
          <p className="text-c-dark/60">
            This endpoint can be used for querying website stats like visitor totals, screen size distributions and other fields. It
            requires an access token to interact with, which can be generated and managed below.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap justify-center border-b border-black/10">
          {Object.values(Tab).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-5 py-3 text-xs font-bold tracking-wide cursor-pointer transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-c-primary text-c-primary"
                  : "border-b-2 border-transparent text-c-dark/50 hover:text-c-dark/70"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-8">
          {activeTab === Tab.example && <ExampleTab />}
          {activeTab === Tab.reference && <ReferenceTab />}
          {activeTab === Tab.tokens && <TokensTab />}
        </div>
      </Paper>
    </Skeleton>
  );
}

function ExampleTab() {
  const origin = window.location.origin;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading>REQUEST</SectionHeading>
        <CodeBlock lang="bash">
          {`
curl ${origin}/api/stats \\
  --user :$TOKEN \\
  --url-query website=www.example.com \\
  --url-query fields=visitorsTotal,pageviewsTotal,pageDistribution \\
  --url-query country=US \\
  --url-query from=2026-01-01T00:00:00Z \\
  --url-query to=2026-03-01T00:00:00Z
          `.trim()}
        </CodeBlock>
      </div>
      <div>
        <SectionHeading>RESPONSE</SectionHeading>
        <CodeBlock>
          {JSON.stringify(
            {
              visitorsTotal: 1420,
              pageviewsTotal: 3514,
              pageDistribution: {
                limit: 10,
                offset: 0,
                hasMore: false,
                data: [
                  { value: "/", count: 1803 },
                  { value: "/login", count: 1291 },
                  { value: "/about", count: 420 },
                ],
              },
            },
            null,
            2,
          )}
        </CodeBlock>
      </div>
    </div>
  );
}

function ReferenceTab() {
  return (
    <div className="flex flex-col gap-12">
      {/* Website */}
      <div>
        <SectionHeading>WEBSITE</SectionHeading>
        <p className="text-c-dark/60 mb-5 leading-relaxed">
          Every request must reference a website. Pass its hostname or ID as a query parameter, for example{" "}
          <Code>?website=www.example.com</Code>
        </p>
        <div className="rounded-xl border border-black/6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/2 text-left font-bold text-c-dark/40 tracking-wide">
                <th className="px-5 py-3 w-56">Parameter</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="border-t border-black/6">
              <tr>
                <td className="px-5 py-4">
                  <code className="font-bold text-c-primary">website</code>
                  <span className="ml-2.5 px-1.5 py-0.5 rounded bg-red-400/10 text-[10px] font-bold tracking-wide text-red-400 align-middle">
                    REQUIRED
                  </span>
                </td>
                <td className="px-5 py-4 text-c-dark/60">Hostname or ID of the website to query</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Fields */}
      <div>
        <SectionHeading>FIELDS</SectionHeading>
        <p className="text-c-dark/60 mb-6 leading-relaxed">
          Specify which data to return using a comma-separated list, for example <Code>?fields=visitorsTotal,pageDistribution</Code>
        </p>

        <div className="rounded-xl border border-black/6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/2 text-left font-bold text-c-dark/40 tracking-wide">
                <th className="px-5 py-3 w-56">Field</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              <FilterRow name="visitorsTotal">Total visitors</FilterRow>
              <FilterRow name="pageviewsTotal">Total pageviews</FilterRow>
              <FilterRow name="pagetimeMedian">Median time on page (seconds)</FilterRow>
              <FilterRow name="livePageviewsTotal">Number of pageviews in the last few minutes (ignores all filter parameters)</FilterRow>
              <FilterRow name="visitorsTimeSeries">Unique visitors over time</FilterRow>
              <FilterRow name="pageviewsTimeSeries">Pageviews over time</FilterRow>
              <FilterRow name="pagetimeTimeSeries">Median pagetime over time</FilterRow>
              <FilterRow name="pageDistribution">Distribution of visited page URLs</FilterRow>
              <FilterRow name="sourceDistribution">Distribution of traffic sources (referrers)</FilterRow>
              <FilterRow name="screenDistribution">Distribution of device categories (mobile, tablet, or desktop)</FilterRow>
              <FilterRow name="browserDistribution">Distribution of browsers</FilterRow>
              <FilterRow name="osDistribution">Distribution of operating systems</FilterRow>
              <FilterRow name="countryDistribution">Distribution of country codes</FilterRow>
              <FilterRow name="cityDistribution">Distribution of city names</FilterRow>
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div>
        <SectionHeading>FILTERS</SectionHeading>
        <p className="text-c-dark/60 mb-5 leading-relaxed">
          Narrow results to a specific segment, for example <Code>?screen=tablet&country=US</Code>
        </p>
        <div className="rounded-xl border border-black/6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/2 text-left font-bold text-c-dark/40 tracking-wide">
                <th className="px-5 py-3 w-56">Parameter</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              <FilterRow name="from">Start of the time range</FilterRow>
              <FilterRow name="to">End of the time range</FilterRow>
              <FilterRow name="page">Filter by URL path</FilterRow>
              <FilterRow name="source">Filter by traffic source</FilterRow>
              <FilterRow name="screen">Filter by screen category</FilterRow>
              <FilterRow name="browser">Filter by browser name</FilterRow>
              <FilterRow name="os">Filter by operating system</FilterRow>
              <FilterRow name="country">Filter by ISO country code</FilterRow>
              <FilterRow name="city">Filter by city name</FilterRow>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div>
        <SectionHeading>PAGINATION</SectionHeading>
        <p className="text-c-dark/60 mb-5 leading-relaxed">
          Distribution fields are returned as paginated results and can be navigated via their matching limit/offset parameters, for example{" "}
          <Code>?pageDistributionOffset=20</Code>
        </p>
        <div className="rounded-xl border border-black/6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/2 text-left font-bold text-c-dark/40 tracking-wide">
                <th className="px-5 py-3 w-56">Parameter</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              <FilterRow name="{field}Limit">
                Max results to return (default: <Code>10</Code>)
              </FilterRow>
              <FilterRow name="{field}Offset">
                Results to skip (default: <Code>0</Code>)
              </FilterRow>
            </tbody>
          </table>
        </div>
        <p className="text-c-dark/60 mt-4 leading-relaxed">
          Here, <Code>{"{field}"}</Code> is one of:{" "}
          {[
            "pageDistribution",
            "sourceDistribution",
            "screenDistribution",
            "browserDistribution",
            "osDistribution",
            "countryDistribution",
            "cityDistribution",
          ].map((f, i, arr) => (
            <span key={f}>
              {i === arr.length - 1 && " or "}
              <Code>{f}</Code>
              {i < arr.length - 2 && ", "}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function TokensTab() {
  const tokenClient = useRegistry(TokenClient);
  const dialogClient = useRegistry(DialogClient);
  const { data: tokens, setData: setTokens, getData: getTokens } = useYesQuery({ queryFn: () => tokenClient.list() });

  async function handleGenerate() {
    const result = await dialogClient.tokenCreate();
    if (typeof result === "object") {
      setTokens([result, ...(getTokens() || [])]);
    }
  }

  async function handleRevoke(token: TokenRM) {
    const result = await dialogClient.tokenDelete(token);
    if (typeof result === "object") {
      setTokens((getTokens() || []).filter((t) => t.id !== result.id));
    }
  }

  function formatDate(instant: Temporal.Instant) {
    const zdt = instant.toZonedDateTimeISO("UTC");
    return `${zdt.year}-${String(zdt.month).padStart(2, "0")}-${String(zdt.day).padStart(2, "0")}`;
  }

  function formatScope(websites: string[] | "*") {
    if (websites === "*") return "All websites";
    return `${websites.length} website${websites.length !== 1 ? "s" : ""}`;
  }

  return (
    <div>
      {tokens && tokens.length > 0 && (
        <div className="rounded-xl border border-black/6 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/2 text-left font-bold text-c-dark/40 tracking-wide">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Scope</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Last used</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-5 py-3">
                    <code className="font-bold text-c-dark">{token.id}</code>
                  </td>
                  <td className="px-5 py-3 text-c-dark/60">{formatScope(token.websites)}</td>
                  <td className="px-5 py-3 text-c-dark/60">{formatDate(token.created)}</td>
                  <td className="px-5 py-3 text-c-dark/60">{token.lastUsed ? formatDate(token.lastUsed) : "Never"}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(token)}
                      className="text-sm font-semibold text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          onClick={handleGenerate}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-c-primary text-white cursor-pointer hover:bg-c-primary/90 transition-colors"
        >
          Generate token
        </button>
      </div>
    </div>
  );
}

function Code({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code className={`px-1.5 py-0.5 rounded-md text-c-primary bg-c-dark/6 text-[0.92em] text-nowrap ${className ?? ""}`}>{children}</code>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-bold tracking-wide mb-4">{children}</h2>;
}

function CodeBlock({ children, lang = "json", variant }: { children: string; lang?: string; variant?: "compact" }) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    codeToHtml(children, { lang, theme: "github-dark-default" }).then(setHtml);
  }, [children, lang]);
  return (
    <div className="relative group">
      <button
        onClick={() => {
          navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-md bg-white/10 text-white/50 hover:text-white/90 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>
      <div
        className={`[&_pre]:rounded-xl [&_pre]:leading-relaxed [&_pre]:overflow-x-auto ${variant === "compact" ? "[&_pre]:p-4 [&_pre]:text-xs" : "[&_pre]:p-5"}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function FilterRow({ name, children }: { name: string; children: ReactNode }) {
  return (
    <tr>
      <td className="px-5 py-3">
        <code className="font-bold text-c-primary">{name}</code>
      </td>
      <td className="px-5 py-3 text-c-dark/60">{children}</td>
    </tr>
  );
}
