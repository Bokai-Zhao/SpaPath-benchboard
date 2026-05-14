import type { DashboardData } from "../types";

export function MethodologyPage({ data }: { data: DashboardData }) {
  return (
    <article className="prose prose-slate max-w-none rounded-lg border border-line bg-white p-6 shadow-sm">
      <h1>SpaPath-Bench Methodology</h1>
      <p>
        SpaPath-Bench evaluates whether pathology foundation model features encode tissue spatial organization when used with
        spatial domain identification and clustering readouts.
      </p>
      <h2>Pipeline Definition</h2>
      <p>
        A benchmark pipeline is <code>feature + spatial_method + cluster_method</code>. The dashboard derives every dataset,
        feature, metric, method cluster, and pipeline identifier from the prepared data.
      </p>
      <h2>Ranking Semantics</h2>
      <p>
        <code>global_rank_score</code> is loaded from <code>rank_scores_merged.parquet</code>. The dashboard does not recompute it
        from raw metrics and does not replace it with a simple raw-value rank. The manuscript defines this score with
        one-sided Wilcoxon signed-rank tests under matched SDI method, clustering readout, and seed configurations.
      </p>
      <p>
        <code>dataset_rank_score</code> is computed only within each <code>dataset + metric_id</code> group from raw values in
        <code>pfmc_metrics_11.parquet</code>. PAS and CHAOS are lower-is-better; ASW, ARI, NMI, HOM, and COM are higher-is-better.
        Ties use average rank, and missing values are skipped.
      </p>
      <h2>Metric Semantics</h2>
      <p>
        The dashboard reads the 11 precomputed raw metrics from <code>pfmc_metrics_11.parquet</code> and the precomputed global
        rank scores from <code>rank_scores_merged.parquet</code>. It does not recompute PAS, CHAOS, ASW, ARI, NMI, HOM, or COM
        from labels or embeddings.
      </p>
      <p>
        Reference-free metrics evaluate intrinsic spatial coherence. HVG-referenced metrics compare morphology-derived domains
        with HVG-derived pseudo-reference domains, primarily for unlabeled non-DLPFC slides. GT-referenced metrics compare with
        expert anatomical labels, primarily for DLPFC slides.
      </p>
      <p>HVG is a transcriptomic baseline/reference, not a pathology foundation model.</p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Name</th>
              <th>Reference</th>
              <th>Direction</th>
              <th>Main for</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {data.manifest.metrics.map((metric) => (
              <tr key={metric.metric_id}>
                <td>
                  <code>{metric.metric_id}</code>
                </td>
                <td>{metric.display_name}</td>
                <td>{metric.reference_type}</td>
                <td>{metric.higher_is_better ? "higher is better" : "lower is better"}</td>
                <td>{metric.main_for.join(", ")}</td>
                <td>{metric.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Reference Protocol</h2>
      <p>
        For DLPFC expert-annotated slides, the reference is the manual layer annotation and the cluster number follows the
        number of expert domains. For unlabeled HE-ST slides, K is selected by ASW over K = 4 to 12; the HVG pseudo-reference is
        built by applying the same spatial domain identification and clustering pipeline to the top 2000 highly variable genes.
      </p>
      <h2>Paper-Aligned Headline Findings</h2>
      <p>
        The dashboard follows the manuscript conclusions: H-Optimus-1 is the top pathology model under the HVG-referenced
        transcriptomic proxy, MUSK is the top pathology model under expert DLPFC annotations, and CCST + Leiden is treated as
        the optimal spatial representation and clustering setting for Fig.2C/Fig.2D-style views.
      </p>
      <p>
        Some exploratory dashboard aggregates average across metric families that the paper reports separately. Those views are
        useful for browsing but should not be read as replacing the reference-specific conclusions above.
      </p>
      <h2>References</h2>
      <p>
        DLPFC datasets use ground truth layer labels for GT-referenced metrics such as ARI_gt and NMI_gt. Non-DLPFC datasets
        primarily use HVG pseudo-reference metrics such as ARI_hvg and NMI_hvg. PAS, CHAOS, and ASW are unsupervised spatial
        coherence metrics.
      </p>
      <h2>Spatial Gallery</h2>
      <p>
        Spatial labels are loaded only for <code>Result_seed0 + ccst + leiden</code>. The preprocessing script splits
        <code>pfmc_all_labels.parquet</code> into small JSON files by <code>dataset + feature</code>, each containing x, y, label,
        and optional gt_label. The y-axis is inverted in the frontend plotting layer.
      </p>
      <h2>Updating Data</h2>
      <p>
        Replace the three parquet files, rerun <code>scripts/prepare_dashboard_data.py</code>, commit <code>public/data/</code>,
        then rebuild or push to GitHub Pages.
      </p>
    </article>
  );
}
