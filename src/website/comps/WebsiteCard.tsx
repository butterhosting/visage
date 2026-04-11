import { Prettify } from "@/helpers/Prettify";
import { WebsiteRM } from "@/models/WebsiteRM";
import { Paper } from "./Paper";
import { TimeSeriesChart } from "./dashboard/TimeSeriesChart";
import clsx from "clsx";

type Props = {
  website: WebsiteRM;
  className?: string;
};
export function WebsiteCard({ website, className }: Props) {
  return (
    <Paper className={clsx("overflow-hidden flex flex-col", className)}>
      <div className="px-5 pt-5 pb-3">
        <div className="text-sm font-semibold tracking-wide">{website.hostname}</div>
      </div>
      <div className="flex-1 min-h-0 pointer-events-none">
        <TimeSeriesChart timeSeries={website.visitorsTimeSeries30d} minimal height="100%" />
      </div>
      <div className="px-5 pb-4 pt-2 flex items-center gap-5 text-sm text-c-dark-half">
        <div>
          <span className="font-semibold">{Prettify.number(website.visitorsTotal30d)}</span> visitors
        </div>
        <div className="ml-auto text-xs text-c-dark-half">last 30d</div>
      </div>
    </Paper>
  );
}
