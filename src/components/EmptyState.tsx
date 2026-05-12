import { SearchX } from "lucide-react";

export function EmptyState({ title = "No data", detail }: { title?: string; detail?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
      <SearchX className="mb-3 h-8 w-8 text-slate-400" />
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {detail ? <p className="mt-1 max-w-xl text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}
