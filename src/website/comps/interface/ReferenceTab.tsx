import { ReactNode } from "react";
import { CodeSnippet } from "./CodeSnippet";
import { SectionHeading } from "./SectionHeading";

export function ReferenceTab() {
  return (
    <div className="flex flex-col gap-12">
      {/* Website */}
      <div>
        <SectionHeading>WEBSITE</SectionHeading>
        <p className="text-c-dark/60 mb-5 leading-relaxed">
          Every request must reference a website. Pass its hostname or ID as a query parameter, for example{" "}
          <CodeSnippet>?website=www.example.com</CodeSnippet>
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
          Specify which data to return using a comma-separated list, for example{" "}
          <CodeSnippet>?fields=visitorsTotal,pageDistribution</CodeSnippet>
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
          Narrow results to a specific segment, for example <CodeSnippet>?screen=tablet&country=US</CodeSnippet>
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
          <CodeSnippet>?pageDistributionOffset=20</CodeSnippet>
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
                Max results to return (default: <CodeSnippet>10</CodeSnippet>)
              </FilterRow>
              <FilterRow name="{field}Offset">
                Results to skip (default: <CodeSnippet>0</CodeSnippet>)
              </FilterRow>
            </tbody>
          </table>
        </div>
        <p className="text-c-dark/60 mt-4 leading-relaxed">
          Here, <CodeSnippet>{"{field}"}</CodeSnippet> is one of:{" "}
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
              <CodeSnippet>{f}</CodeSnippet>
              {i < arr.length - 2 && ", "}
            </span>
          ))}
        </p>
      </div>
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
