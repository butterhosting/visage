import { Prettify } from "@/helpers/Prettify";
import { WebsiteRM } from "@/models/WebsiteRM";
import { Paper } from "./Paper";
import { TimeSeriesChart } from "./dashboard/TimeSeriesChart";

type Props = {
  website: WebsiteRM;
};
export function WebsiteCard({ website }: Props) {
  return (
    <Paper className="overflow-hidden hover:shadow-lg">
      <div className="px-5 pt-5 pb-3">
        <div className="text-sm font-semibold text-c-dark tracking-wide">{website.hostname}</div>
      </div>
      <div className="h-30 pointer-events-none">
        <TimeSeriesChart timeSeries={website.visitorsTimeSeries30d} gradientId={`miniGradient-${website.id}`} minimal height="100%" />
      </div>
      <div className="px-5 pb-4 pt-2 flex items-center gap-5 text-sm text-c-dark/50">
        <div>
          <span className="font-semibold text-c-dark">{Prettify.number(website.visitorsTotal)}</span> visitors
        </div>
        <div className="ml-auto text-xs text-c-dark/40">last 30d</div>
      </div>
    </Paper>
  );
}
