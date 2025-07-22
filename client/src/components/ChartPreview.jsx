import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ChartPreview({ chartData }) {
  if (!chartData || chartData.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">📊 Auto Chart</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
