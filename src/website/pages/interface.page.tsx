import { useSearchParams } from "react-router";
import { ExampleTab } from "../comps/interface/ExampleTab";
import { ReferenceTab } from "../comps/interface/ReferenceTab";
import { TokensTab } from "../comps/interface/TokensTab";
import { Paper } from "../comps/Paper";
import { Skeleton } from "../comps/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

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
            <span className="px-2.5 py-1 rounded-lg bg-c-accent/10 text-c-accent font-bold tracking-wide">GET</span>
            <code className="text-xl font-extrabold text-c-darkgray">/api/stats</code>
          </div>
          <p className="text-c-darkgray/60">
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
                  ? "border-b-2 border-c-accent text-c-accent"
                  : "border-b-2 border-transparent text-c-darkgray/50 hover:text-c-darkgray/70"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-8 overflow-x-auto">
          {activeTab === Tab.example && <ExampleTab />}
          {activeTab === Tab.reference && <ReferenceTab />}
          {activeTab === Tab.tokens && <TokensTab />}
        </div>
      </Paper>
    </Skeleton>
  );
}
