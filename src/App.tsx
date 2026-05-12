import { useEffect, useMemo, useState } from "react";
import { DEFAULT_FILTERS, PAGES } from "./config";
import type { DashboardData, PageId } from "./types";
import { loadDashboardData, DataLoadError } from "./lib/loadData";
import { Layout } from "./components/Layout";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { OverviewPage } from "./pages/OverviewPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { HeatmapPage } from "./pages/HeatmapPage";
import { DatasetPage } from "./pages/DatasetPage";
import { FeaturePage } from "./pages/FeaturePage";
import { SpatialGalleryPage } from "./pages/SpatialGalleryPage";
import { ComparePage } from "./pages/ComparePage";
import { MetricAgreementPage } from "./pages/MetricAgreementPage";
import { MethodologyPage } from "./pages/MethodologyPage";

function pageFromHash(): PageId {
  const candidate = window.location.hash.replace("#/", "") as PageId;
  return PAGES.some((page) => page.id === candidate) ? candidate : "overview";
}

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [activePage, setActivePage] = useState<PageId>(pageFromHash());

  useEffect(() => {
    loadDashboardData()
      .then((loaded) => {
        if (!loaded.manifest.metrics.some((metric) => metric.metric_id === DEFAULT_FILTERS.selectedMetric)) {
          DEFAULT_FILTERS.selectedMetric = loaded.manifest.metrics[0]?.metric_id ?? "All metrics";
        }
        setData(loaded);
      })
      .catch((caught: Error) => setError(caught));
  }, []);

  useEffect(() => {
    const onHashChange = () => setActivePage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (page: PageId) => {
    window.location.hash = `/${page}`;
    setActivePage(page);
  };

  const page = useMemo(() => {
    if (!data) return null;
    switch (activePage) {
      case "leaderboard":
        return <LeaderboardPage data={data} />;
      case "heatmap":
        return <HeatmapPage data={data} />;
      case "datasets":
        return <DatasetPage data={data} />;
      case "features":
        return <FeaturePage data={data} />;
      case "spatial":
        return <SpatialGalleryPage data={data} />;
      case "compare":
        return <ComparePage data={data} />;
      case "agreement":
        return <MetricAgreementPage data={data} />;
      case "methodology":
        return <MethodologyPage />;
      default:
        return <OverviewPage data={data} />;
    }
  }, [activePage, data]);

  if (error) {
    const path = error instanceof DataLoadError ? error.path : undefined;
    return (
      <div className="min-h-screen bg-paper p-6">
        <ErrorState path={path} detail={error.message} />
      </div>
    );
  }

  if (!data) return <LoadingState />;

  return (
    <Layout activePage={activePage} onNavigate={navigate} generatedAt={data.manifest.generated_at}>
      {page}
    </Layout>
  );
}

export default App;
