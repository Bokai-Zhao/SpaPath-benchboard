import type { ReactNode } from "react";

const tones = {
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-left text-xs font-medium leading-snug ${tones[tone]}`}>{children}</span>;
}
