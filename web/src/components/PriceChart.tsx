import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Snapshot } from "../types";

interface Props {
  history: Snapshot[];
  currency: string;
}

export default function PriceChart({ history, currency }: Props) {
  const points = history
    .filter((s) => s.cheapestPrice !== null)
    .map((s) => ({
      date: new Date(s.fetchedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      price: s.cheapestPrice as number,
    }));

  if (points.length === 0) {
    return <div className="empty-state">No price history yet. Data appears after the first fetch run.</div>;
  }

  const cheapestEver = Math.min(...points.map((p) => p.price));

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="#8b93a7" fontSize={12} tickMargin={8} />
          <YAxis
            stroke="#8b93a7"
            fontSize={12}
            tickFormatter={(v: number) => `£${v}`}
            domain={["dataMin - 40", "dataMax + 40"]}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "#1b2130",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#e8ecf4",
            }}
            formatter={(value: number) => [`£${value} ${currency}`, "Cheapest"]}
          />
          <ReferenceLine
            y={cheapestEver}
            stroke="#34d399"
            strokeDasharray="4 4"
            label={{ value: `Cheapest ever £${cheapestEver}`, fill: "#34d399", fontSize: 11, position: "insideBottomRight" }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#60a5fa" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
