import type { ReactNode } from "react";
import { BarChart3, Database, FileText, GitBranch, Layers, MapPinned, RefreshCw } from "lucide-react";
import type { DashboardData } from "../types";
import { Badge } from "../components/Badge";
import { datasetTypeDisplayName } from "../lib/formatting";

function StatCard({ label, value, detail }: { label: string; value: ReactNode; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function MethodCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">{icon}</div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

function PipelineStep({ index, title, text }: { index: number; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{index}</span>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

export function MethodologyPage({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-blue-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="blue">Benchmark protocol</Badge>
          <Badge tone="violet">Paper-aligned dashboard</Badge>
        </div>
        <h1 className="text-2xl font-semibold text-ink">SpaPath-Bench Methodology</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          SpaPath-Bench evaluates whether pathology foundation model features encode tissue spatial organization when paired
          with spatial domain identification modules, controlled clustering readouts, and reference-specific metrics.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Datasets" value={data.manifest.datasets.length} detail="DLPFC and Other 10x slides" />
        <StatCard label="Feature representations" value={data.manifest.features.length} detail={`${data.manifest.pathology_features.length} pathology/image features plus HVG`} />
        <StatCard label="Method clusters" value={data.manifest.method_clusters.length} detail="Spatial representation and clustering pairs" />
        <StatCard label="Metrics" value={data.manifest.metrics.length} detail="Reference-free, HVG-referenced, and GT-referenced readouts" />
      </div>

      <MethodCard icon={<GitBranch className="h-5 w-5" />} title="Pipeline Definition">
        <p>
          A benchmark pipeline is <code className="rounded bg-slate-100 px-1">feature + spatial_method + cluster_method</code>.
          The dashboard derives dataset, feature, metric, method-cluster, and pipeline identifiers from the prepared data files
          rather than recomputing benchmark results in the browser.
        </p>
      </MethodCard>

      <div className="grid gap-3 lg:grid-cols-5">
        <PipelineStep index={1} title="Histology sampling" text="Extract spot-aligned H&E image patches for each spatial transcriptomics spot." />
        <PipelineStep index={2} title="PFM encoding" text="Encode patches with pathology foundation models and baseline image encoders." />
        <PipelineStep index={3} title="Spatial representation" text="Use PCA settings or spatial domain identification modules to produce latent embeddings." />
        <PipelineStep index={4} title="Partition readout" text="Apply controlled clustering readouts such as K-means, Leiden, and Louvain." />
        <PipelineStep index={5} title="Metrics and ranking" text="Evaluate spatial coherence and reference agreement, then report benchmark rank scores." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MethodCard icon={<BarChart3 className="h-5 w-5" />} title="Ranking Semantics">
          <p>
            <code className="rounded bg-slate-100 px-1">global_rank_score</code> is loaded from
            <code className="rounded bg-slate-100 px-1">rank_scores_merged.parquet</code>. The dashboard does not recompute it
            from raw metric values and does not replace it with a simple ordinal rank.
          </p>
          <p>
            <code className="rounded bg-slate-100 px-1">dataset_rank_score</code> is computed only within each
            <code className="rounded bg-slate-100 px-1">dataset + metric_id</code> group from raw values in
            <code className="rounded bg-slate-100 px-1">pfmc_metrics_11.parquet</code>. PAS and CHAOS are lower-is-better;
            ASW, ARI, NMI, HOM, and COM are higher-is-better.
          </p>
        </MethodCard>

        <MethodCard icon={<Layers className="h-5 w-5" />} title="Reference Protocol">
          <p>
            DLPFC slides use expert layer annotations for GT-referenced metrics. Other 10x slides primarily use HVG
            pseudo-reference metrics, where HVG domains provide a transcriptomic proxy for unlabeled tissue sections.
          </p>
          <p>
            HVG is a transcriptomic baseline/reference, not a pathology foundation model. Reference-free metrics evaluate
            intrinsic spatial coherence without an external label reference.
          </p>
        </MethodCard>
      </div>

      <MethodCard icon={<FileText className="h-5 w-5" />} title="Metric Semantics">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="border-b border-line px-3 py-2 font-semibold">Metric</th>
                <th className="border-b border-line px-3 py-2 font-semibold">Name</th>
                <th className="border-b border-line px-3 py-2 font-semibold">Reference</th>
                <th className="border-b border-line px-3 py-2 font-semibold">Direction</th>
                <th className="border-b border-line px-3 py-2 font-semibold">Main for</th>
                <th className="border-b border-line px-3 py-2 font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {data.manifest.metrics.map((metric) => (
                <tr key={metric.metric_id}>
                  <td className="border-b border-line px-3 py-2 font-medium text-ink">{metric.metric_id}</td>
                  <td className="border-b border-line px-3 py-2 text-slate-700">{metric.display_name}</td>
                  <td className="border-b border-line px-3 py-2 text-slate-700">{metric.reference_type}</td>
                  <td className="border-b border-line px-3 py-2 text-slate-700">{metric.higher_is_better ? "higher is better" : "lower is better"}</td>
                  <td className="border-b border-line px-3 py-2 text-slate-700">{metric.main_for.map(datasetTypeDisplayName).join(", ")}</td>
                  <td className="border-b border-line px-3 py-2 text-slate-700">{metric.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MethodCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <MethodCard icon={<MapPinned className="h-5 w-5" />} title="Paper-Aligned Headline Findings">
          <p>
            The dashboard follows the manuscript conclusions: H-Optimus-1 is the top pathology model under the
            HVG-referenced transcriptomic proxy, MUSK is the top pathology model under expert DLPFC annotations, and
            CCST + Leiden is treated as the optimal spatial representation and clustering setting for Fig.2C/Fig.2D-style
            views.
          </p>
          <p>
            Exploratory dashboard aggregates average across metric families that the paper reports separately. They are useful
            for browsing but should not be read as replacing the reference-specific manuscript conclusions.
          </p>
        </MethodCard>

        <MethodCard icon={<Database className="h-5 w-5" />} title="Spatial Gallery and Data Files">
          <p>
            Spatial labels are loaded only for <code className="rounded bg-slate-100 px-1">Result_seed0 + ccst + leiden</code>.
            The preprocessing script splits <code className="rounded bg-slate-100 px-1">pfmc_all_labels.parquet</code> into small
            JSON files by <code className="rounded bg-slate-100 px-1">dataset + feature</code>, each containing x, y, label, and
            optional gt_label.
          </p>
          <p>
            To update the static dashboard data, replace the parquet inputs, rerun
            <code className="rounded bg-slate-100 px-1">scripts/prepare_dashboard_data.py</code>, commit
            <code className="rounded bg-slate-100 px-1">public/data/</code>, then rebuild the site.
          </p>
        </MethodCard>
      </div>

      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-4 text-sm text-slate-700 shadow-sm">
        <RefreshCw className="h-5 w-5 text-blue-700" />
        <span>
          Data refreshes are static and versioned with the repository; the browser application only reads prepared CSV/JSON
          derivatives.
        </span>
      </section>
    </div>
  );
}
