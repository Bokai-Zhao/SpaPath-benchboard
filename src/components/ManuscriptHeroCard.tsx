import type { ReactNode } from "react";
import { Code2, FileText, Link as LinkIcon } from "lucide-react";
import type { PaperMetadata } from "../types";
import { Badge } from "./Badge";

function resolveFigureSrc(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
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
    <section className="grid gap-4 rounded-lg border border-blue-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
      <div className="flex min-h-[260px] flex-col justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">SpaPath-Bench manuscript</h2>
            <Badge tone="violet">{metadata.status ?? "pending_publication"}</Badge>
          </div>
          <p className="text-xl font-semibold text-slate-900">{metadata.title}</p>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            {metadata.subtitle ?? "Benchmarking pathology foundation models for spatial domain understanding"}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <ManuscriptLink href={metadata.paper_url} label="Read paper" icon={<FileText className="h-4 w-4" />} />
            <ManuscriptLink href={metadata.preprint_url} label="Preprint" icon={<LinkIcon className="h-4 w-4" />} />
            <ManuscriptLink href={metadata.code_url} label="Code" icon={<Code2 className="h-4 w-4" />} />
            {!hasLinks ? <Badge tone="amber">Paper link pending</Badge> : null}
          </div>
          <div className="mt-4 rounded-md border border-line bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Citation</p>
            <p className="mt-1 text-sm text-slate-700">
              {metadata.citation_text ?? "Citation will be added after the manuscript becomes publicly available."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-violet-50">
        {metadata.main_figure ? (
          <img
            src={resolveFigureSrc(metadata.main_figure)}
            alt={`${metadata.title} main figure`}
            className="h-full max-h-[320px] w-full object-contain"
          />
        ) : (
          <div className="px-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">Main figure will be added after publication.</p>
          </div>
        )}
      </div>
    </section>
  );
}
