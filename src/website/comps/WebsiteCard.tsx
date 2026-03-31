import { Website } from "@/models/Website";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Paper } from "./Paper";

type Props = {
  website: Website;
};

const MOCK_DATA = [
  { v: 11200 },
  { v: 11000 },
  { v: 7200 },
  { v: 7100 },
  { v: 9800 },
  { v: 11500 },
  { v: 11800 },
  { v: 12000 },
  { v: 11200 },
  { v: 10800 },
  { v: 8200 },
  { v: 7200 },
  { v: 7100 },
  { v: 9500 },
  { v: 11500 },
  { v: 11800 },
  { v: 11200 },
  { v: 10200 },
  { v: 7000 },
  { v: 6800 },
  { v: 11200 },
  { v: 11500 },
  { v: 11000 },
  { v: 10800 },
  { v: 10200 },
  { v: 7200 },
  { v: 6200 },
];

export function WebsiteCard({ website }: Props) {
  return (
    <Paper className="overflow-hidden hover:shadow-lg">
      <div className="px-5 pt-5 pb-3">
        <div className="text-sm font-semibold text-c-dark tracking-wide">{website.hostname}</div>
      </div>
      <div className="h-30 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`miniGradient-${website.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4647d2" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4647d2" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <Area
              className="cursor-pointer"
              type="linear"
              dataKey="v"
              stroke="#4647d2"
              strokeWidth={1.5}
              fill={`url(#miniGradient-${website.id})`}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-5 pb-4 pt-2 flex items-center gap-5 text-sm text-c-dark/50">
        <div>
          <span className="font-semibold text-c-dark">476k</span> visits
        </div>
        <div>
          <span className="font-semibold text-c-dark">1.9M</span> pageviews
        </div>
        <div className="ml-auto text-xs text-c-dark/40">30d</div>
      </div>
    </Paper>
  );
}
