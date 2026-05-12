import { X } from "lucide-react";
import { asText } from "../lib/formatting";

export function DetailDrawer({ title, row, onClose }: { title: string; row: Record<string, unknown> | null; onClose: () => void }) {
  if (!row) return null;
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <button className="rounded-md p-2 hover:bg-slate-100" onClick={onClose} aria-label="Close details">
          <X className="h-5 w-5" />
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm">
        {Object.entries(row).map(([key, value]) => (
          <div key={key} className="rounded-md border border-line bg-slate-50 p-3">
            <dt className="text-xs font-semibold uppercase text-slate-500">{key}</dt>
            <dd className="mt-1 break-words text-slate-800">{asText(value)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
