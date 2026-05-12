import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading dashboard data" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-soft">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
    </div>
  );
}
