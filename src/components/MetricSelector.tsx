import type { MetricInfo } from "../types";

export function MetricSelector({
  metrics,
  value,
  onChange,
}: {
  metrics: MetricInfo[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      Metric
      <select className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink" value={value} onChange={(event) => onChange(event.target.value)}>
        <option>All metrics</option>
        <option>Main metric only</option>
        {metrics.map((metric) => (
          <option key={metric.metric_id} value={metric.metric_id}>
            {metric.short_name ?? metric.metric_id} - {metric.display_name ?? metric.metric_id}
          </option>
        ))}
      </select>
    </label>
  );
}
