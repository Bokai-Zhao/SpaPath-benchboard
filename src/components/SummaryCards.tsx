import type { ReactNode } from "react";
import { asText } from "../lib/formatting";

export function SummaryCards({ cards }: { cards: Array<{ label: string; value: ReactNode; detail?: ReactNode }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
          <div className="mt-2 min-h-8 text-2xl font-semibold text-ink">{typeof card.value === "number" ? asText(card.value) : card.value}</div>
          {card.detail ? <p className="mt-1 text-xs text-slate-500">{card.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}
