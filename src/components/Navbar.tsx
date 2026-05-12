import { BarChart3, Github, Menu } from "lucide-react";
import { PAGES } from "../config";
import type { PageId } from "../types";

export function Navbar({
  activePage,
  onNavigate,
  generatedAt,
}: {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  generatedAt?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="rounded-md p-2 text-slate-500 lg:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <button className="flex shrink-0 items-center gap-2" onClick={() => onNavigate("overview")}>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
            <BarChart3 className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-ink">SpaPath-Bench</span>
        </button>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => onNavigate(page.id)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                activePage === page.id ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              }`}
            >
              {page.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 text-xs text-slate-500 md:flex">
          {generatedAt ? <span>Updated {new Date(generatedAt).toLocaleDateString()}</span> : null}
          <a className="inline-flex items-center gap-1 hover:text-brand" href="#" aria-label="GitHub repository">
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <button className="font-medium text-brand" onClick={() => onNavigate("methodology")}>
            Methodology
          </button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
        {PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => onNavigate(page.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
              activePage === page.id ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>
    </header>
  );
}
