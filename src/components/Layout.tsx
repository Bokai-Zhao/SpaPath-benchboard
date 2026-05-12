import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import type { PageId } from "../types";

export function Layout({
  children,
  activePage,
  onNavigate,
  generatedAt,
}: {
  children: ReactNode;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  generatedAt?: string;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar activePage={activePage} onNavigate={onNavigate} generatedAt={generatedAt} />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-4 text-xs text-slate-500">
        SpaPath-Bench dashboard. Data are preprocessed from rank_scores_merged.parquet, pfmc_metrics_11.parquet, and
        pfmc_all_labels.parquet.
      </footer>
    </div>
  );
}
