import type { ReactNode } from "react";
import { Code2, FileText, Link as LinkIcon } from "lucide-react";
import type { PaperMetadata } from "../types";
import { Badge } from "./Badge";

function resolveFigureSrc(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

function statusLabel(status: string | null | undefined): string {
  return (status ?? "pending_publication").replace(/_/g, " ");
}

function ManuscriptLink({
  href,
  label,
  icon,
}: {
  href: string | null | undefined;
  label: string;
  icon: ReactNode;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
    >
      {icon}
      {label}
    </a>
  );
}

export function ManuscriptHeroCard({ metadata }: { metadata: PaperMetadata }) {
  const hasLinks = Boolean(metadata.paper_url || metadata.preprint_url || metadata.code_url);
  return (
    <section className="overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
      <div className="flex items-center justify-center border-b border-line bg-white p-3">
        {metadata.main_figure ? (
          <img
            src={resolveFigureSrc(metadata.main_figure)}
            alt={`${metadata.title} main figure`}
            className="max-h-[520px] w-full object-contain"
          />
        ) : (
          <div className="min-h-[260px] px-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">Main figure will be added after publication.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">SpaPath-Bench manuscript</h2>
            <Badge tone="violet">{statusLabel(metadata.status)}</Badge>
          </div>
          <p className="text-xl font-semibold text-slate-900">{metadata.title}</p>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {metadata.subtitle ?? "Benchmarking pathology foundation models for spatial domain understanding"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {metadata.citation_text ?? "Citation will be added after the manuscript becomes publicly available."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <ManuscriptLink href={metadata.paper_url} label="Read paper" icon={<FileText className="h-4 w-4" />} />
          <ManuscriptLink href={metadata.preprint_url} label="arXiv: xx" icon={<LinkIcon className="h-4 w-4" />} />
          <ManuscriptLink href={metadata.code_url} label="Code" icon={<Code2 className="h-4 w-4" />} />
          {!hasLinks ? <Badge tone="amber">Paper link pending</Badge> : null}
        </div>
      </div>
    </section>
  );
}
