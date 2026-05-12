import { AlertTriangle } from "lucide-react";

export function ErrorState({ title = "Data could not be loaded", path, detail }: { title?: string; path?: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {path ? <p className="mt-3 text-sm">Missing file: <code>{path}</code></p> : null}
      {detail ? <p className="mt-2 text-sm">{detail}</p> : null}
      <pre className="mt-4 overflow-auto rounded-md bg-white p-3 text-xs text-slate-800">
python scripts/prepare_dashboard_data.py --rank-scores PATH --metrics PATH --labels PATH --out public/data
      </pre>
    </div>
  );
}
