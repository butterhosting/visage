import { CodeBlock } from "./CodeBlock";
import { SectionHeading } from "./SectionHeading";

export function ExampleTab() {
  const origin = window.location.origin;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading>REQUEST</SectionHeading>
        <CodeBlock language="bash">
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
        <CodeBlock language="json">
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
