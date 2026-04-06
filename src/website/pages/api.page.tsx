import { ReactNode, useState } from "react";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const tabs = ["EXAMPLE", "FIELDS", "FILTERS", "PAGINATION", "TOKENS"] as const;

export function apiPage() {
  useDocumentTitle("API | Visage");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("EXAMPLE");

  return (
    <Skeleton className="grid grid-cols-1 gap-5">
      <Paper>
        {/* Endpoint header */}
        <div className="p-8 pb-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-c-primary/10 text-c-primary text-xs font-bold tracking-wide">GET</span>
            <code className="text-xl font-extrabold text-c-dark">/api/stats</code>
          </div>
          <p className="mt-8 text-c-dark/60">
            This endpoint can be used for querying various stats for a given website. The only mandatory parameter is{" "}
            <code className="font-bold">?website=xxx</code> for referencing a specific website by its hostname or ID. Apart from that, there
            are 3 categories of parambeters.
          </p>
          <ul className="mt-4 pl-4 text-c-dark/60 list-disc list-inside break-all">
            <li>
              <span className="font-bold">Fields:</span> this specifies a comma separated list of fields to include in the response, like{" "}
              <code className="font-bold">?fields=visitorsTotal,pageDistribution</code>
            </li>
            <li>
              <span className="font-bold">Filters:</span> this allows filtering the response on various properties such as{" "}
              <code className="font-bold">?screen=mobile</code>
            </li>
            <li>
              <span className="font-bold">Pagination:</span> these make it possible to paginate distribution data via properties like{" "}
              {/*<code className="font-bold">?sourceDistributionLimit=10&sourceDistributionOffset=20</code>*/}
            </li>
          </ul>
          <p className="mt-4 text-c-dark/60">Using the API requires an access token: these can be managed below.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/10 mt-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-5 py-3 text-xs font-bold tracking-wide cursor-pointer transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-c-primary text-c-primary"
                  : "border-b-2 border-transparent text-c-dark/50 hover:text-c-dark/70"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-8">
          {activeTab === "EXAMPLE" && <ExampleTab />}
          {activeTab === "FIELDS" && <FieldsTab />}
          {activeTab === "FILTERS" && <FiltersTab />}
          {activeTab === "PAGINATION" && <PaginationTab />}
          {activeTab === "TOKENS" && <TokensTab />}
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
        <SectionHeading>EXAMPLE REQUEST</SectionHeading>
        <CodeBlock>
          {[
            `curl "${origin}/api/stats?\\`,
            `  website=example.com&\\`,
            `  fields=visitorsTotal,pageviewsTotal,pageDistribution&\\`,
            `  from=2026-01-01T00:00:00Z&\\`,
            `  to=2026-04-01T00:00:00Z"`,
          ].join("\n")}
        </CodeBlock>
      </div>
      <div>
        <SectionHeading>EXAMPLE RESPONSE</SectionHeading>
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

function FieldsTab() {
  return (
    <div className="flex flex-col gap-2">
      <FieldGroup label="Aggregates" returnType="number">
        <Field name="visitorsTotal">Total unique visitors in the given time range.</Field>
        <Field name="pageviewsTotal">Total pageviews in the given time range.</Field>
        <Field name="pagetimeMedian">Median time on page in seconds (only pages viewed for 5+ seconds).</Field>
        <Field name="livePageviewsTotal">Number of pageviews in the last 10 minutes.</Field>
      </FieldGroup>

      <FieldGroup label="Time Series" returnType="TimeSeries">
        <Field name="visitorsTimeSeries">Unique visitors over time.</Field>
        <Field name="pageviewsTimeSeries">Pageviews over time.</Field>
        <Field name="pagetimeTimeSeries">Median time on page over time.</Field>
      </FieldGroup>
      <div className="mb-4 -mt-1">
        <p className="text-xs text-c-dark/40 mb-3">The time unit is automatically chosen based on the date range:</p>
        <div className="flex gap-6 text-xs text-c-dark/40">
          <span>
            <code className="text-c-dark/60">hour</code> &mdash; under 7 days
          </span>
          <span>
            <code className="text-c-dark/60">day</code> &mdash; under 7 months
          </span>
          <span>
            <code className="text-c-dark/60">month</code> &mdash; 7 months or more
          </span>
        </div>
      </div>
      <CodeBlock variant="compact">
        {JSON.stringify(
          {
            tUnit: "month",
            yUnit: "visitor",
            data: [
              { t: "2026-01-01T00:00:00Z", y: 312 },
              { t: "2026-02-01T00:00:00Z", y: 0 },
              { t: "2026-03-01T00:00:00Z", y: 487 },
            ],
          },
          null,
          2,
        )}
      </CodeBlock>

      <div className="my-4 border-t border-black/5" />

      <FieldGroup label="Distributions" returnType="Distribution">
        <Field name="pageDistribution">Top pages by pageview count.</Field>
        <Field name="sourceDistribution">
          Traffic sources (referrers). A <code className="text-c-primary">null</code> value indicates direct traffic.
        </Field>
        <Field name="screenDistribution">
          Device categories: <code className="text-c-dark/60">mobile</code>, <code className="text-c-dark/60">tablet</code>, or{" "}
          <code className="text-c-dark/60">desktop</code>.
        </Field>
        <Field name="browserDistribution">Browser names.</Field>
        <Field name="osDistribution">Operating system names.</Field>
        <Field name="countryDistribution">Country codes (ISO 3166-1 alpha-2).</Field>
        <Field name="cityDistribution">City names.</Field>
      </FieldGroup>
      <CodeBlock variant="compact">
        {JSON.stringify(
          {
            limit: 10,
            offset: 0,
            hasMore: true,
            data: [
              { value: "google.com", count: 1803 },
              { value: null, count: 1291 },
            ],
          },
          null,
          2,
        )}
      </CodeBlock>
    </div>
  );
}

function FiltersTab() {
  return (
    <div>
      <p className="text-c-dark/60 mb-5 leading-relaxed">
        Narrow results to a specific segment. All filters are optional and can be combined. Use{" "}
        <code className="text-c-primary">@null</code> as the value to filter on entries with no data (e.g. direct traffic for sources).
      </p>
      <div className="divide-y divide-black/5">
        <Param name="from" type="ISO 8601">
          Start of the time range. Example: <code className="text-c-dark/60">2026-01-01T00:00:00Z</code>
        </Param>
        <Param name="to" type="ISO 8601">
          End of the time range.
        </Param>
        <Param name="page" type="string">
          Filter by URL path, e.g. <code className="text-c-dark/60">/blog/my-post</code>
        </Param>
        <Param name="source" type="string | @null">
          Filter by traffic source.
        </Param>
        <Param name="screen" type="string">
          Filter by screen category: <code className="text-c-dark/60">mobile</code>, <code className="text-c-dark/60">tablet</code>, or{" "}
          <code className="text-c-dark/60">desktop</code>.
        </Param>
        <Param name="browser" type="string | @null">
          Filter by browser name.
        </Param>
        <Param name="os" type="string | @null">
          Filter by operating system.
        </Param>
        <Param name="country" type="string | @null">
          Filter by ISO country code.
        </Param>
        <Param name="city" type="string | @null">
          Filter by city name.
        </Param>
      </div>
    </div>
  );
}

function PaginationTab() {
  return (
    <div>
      <p className="text-c-dark/60 mb-5 leading-relaxed">
        Each distribution returns 10 results by default. Use <code className="text-c-primary">hasMore</code> in the response to determine if
        more results are available, then paginate with the limit/offset parameters below.
      </p>
      <div className="divide-y divide-black/5">
        <Param name="{field}Limit" type="number">
          Number of results to return. Default: <code className="text-c-dark/60">10</code>
        </Param>
        <Param name="{field}Offset" type="number">
          Number of results to skip. Default: <code className="text-c-dark/60">0</code>
        </Param>
      </div>
      <p className="text-xs text-c-dark/40 mt-5 leading-relaxed">
        Where <code className="text-c-dark/60">{"{field}"}</code> is one of:{" "}
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
            <code className="text-c-dark/60">{f}</code>
            {i < arr.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>
      <div className="mt-6">
        <SectionHeading>EXAMPLE</SectionHeading>
        <CodeBlock variant="compact">{`/api/stats?website=example.com&fields=sourceDistribution&sourceDistributionLimit=5&sourceDistributionOffset=10`}</CodeBlock>
      </div>
    </div>
  );
}

function TokensTab() {
  return (
    <div>
      <p className="text-c-dark/60 mb-5 leading-relaxed">
        Access tokens are required to authenticate with the API. Include the token as a Bearer token in the Authorization header.
      </p>
      <CodeBlock variant="compact">{`curl -H "Authorization: Bearer YOUR_TOKEN" "${window.location.origin}/api/stats?..."`}</CodeBlock>
      <div className="mt-8">
        <SectionHeading>YOUR TOKENS</SectionHeading>
        <p className="text-c-dark/40 text-sm">Token management coming soon.</p>
        {/* TODO: tokens */}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-bold tracking-wide text-c-dark/50 mb-4">{children}</h2>;
}

function CodeBlock({ children, variant }: { children: string; variant?: "compact" }) {
  return (
    <pre className={`bg-c-dark text-c-light rounded-xl leading-relaxed overflow-x-auto ${variant === "compact" ? "p-4 text-xs" : "p-5"}`}>
      <code>{children}</code>
    </pre>
  );
}

function Param({ name, type, required, children }: { name: string; type: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="py-3 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <code className="font-bold text-c-primary">{name}</code>
        <span className="text-xs text-c-dark/30">{type}</span>
        {required && <span className="text-[10px] font-bold tracking-wide text-red-400">REQUIRED</span>}
      </div>
      <p className="text-c-dark/60">{children}</p>
    </div>
  );
}

function FieldGroup({ label, returnType, children }: { label: string; returnType: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-bold text-c-dark">{label}</h3>
        <span className="text-xs text-c-dark/30">returns {returnType}</span>
      </div>
      <div className="divide-y divide-black/5">{children}</div>
    </div>
  );
}

function Field({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="py-2.5 flex items-baseline gap-3">
      <code className="text-c-dark/80 shrink-0">{name}</code>
      <p className="text-c-dark/50">{children}</p>
    </div>
  );
}
