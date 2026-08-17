"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/shared/page-container";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodKpiCard } from "@/components/dashboard/period-kpi-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { ProjectHealthCard } from "@/components/dashboard/project-health-card";
import { VelocityChart } from "@/components/dashboard/velocity-chart";
import { OnTimeTrendChart } from "@/components/dashboard/on-time-trend-chart";
import { RiskCard } from "@/components/dashboard/risk-card";
import { CategoryMixCard } from "@/components/dashboard/category-mix-card";
import { TeamPerformanceTable } from "@/components/dashboard/team-performance-table";
import { ComingDueCard } from "@/components/dashboard/coming-due-card";
import { PeriodComparisonCard } from "@/components/dashboard/period-comparison-card";
import type { FilterDropdownOption } from "@/components/dashboard/filter-dropdown";
import {
  getGranularityBuckets,
  getQuarterEndDate,
  getQuarterLabel,
  getQuarterStartDate,
  getRecentQuarterLabels,
} from "@/lib/dates";
import {
  computeCategoryMix,
  computeLookingAhead,
  computeOnTimeTrend,
  computePeriodComparisonRows,
  computePeriodKpis,
  computeProjectHealthList,
  computeProjectHealthSummary,
  computeRightNowKpis,
  computeRiskData,
  computeTeamPerformance,
  computeVelocityBars,
  matchDashboardScope,
  type RawActivityRow,
  type RawInitiativeRow,
  type RawProjectRow,
  type RawTaskRow,
} from "@/lib/dashboard-aggregates";

interface DashboardViewProps {
  initiatives: { id: string; name: string }[];
  people: { id: string; name: string }[];
  categories: string[];
  rawInitiatives: RawInitiativeRow[];
  rawProjects: RawProjectRow[];
  rawTasks: RawTaskRow[];
  rawActivities: RawActivityRow[];
}

type Granularity = "Week" | "Month" | "Quarter";

export function DashboardView({
  initiatives,
  people,
  categories,
  rawInitiatives,
  rawProjects,
  rawTasks,
  rawActivities,
}: DashboardViewProps) {
  const today = useMemo(() => new Date(), []);
  const quarterOptions: FilterDropdownOption[] = useMemo(
    () =>
      getRecentQuarterLabels(today, 5).map((label, i) => ({
        id: label,
        label: i === 0 ? `This quarter (${label})` : i === 1 ? `Last quarter (${label})` : label,
      })),
    [today],
  );
  const initiativeOptions: FilterDropdownOption[] = useMemo(
    () => [{ id: "all", label: "All initiatives" }, ...initiatives.map((i) => ({ id: i.id, label: i.name }))],
    [initiatives],
  );
  const ownerOptions: FilterDropdownOption[] = useMemo(
    () => [{ id: "all", label: "All owners" }, ...people.map((p) => ({ id: p.id, label: p.name }))],
    [people],
  );

  const [quarter, setQuarter] = useState(getQuarterLabel(today));
  const [vsPrevious, setVsPrevious] = useState("previous");
  const [initiativeFilter, setInitiativeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<Granularity>("Week");

  // Each lens is a named preset over the filter-bar's own fields (not a
  // separate aggregate/grouping concept) — clicking one merges its values
  // into whatever's already selected, same as the design mock's dashLens().
  // "active" is derived from current state, not a separately-tracked click,
  // so the highlight can't go stale after a manual filter change.
  const lensPresets = useMemo(
    () => [
      {
        label: "Delayed & at risk",
        match: () => quarter === quarterOptions[0]?.id && initiativeFilter === "all" && ownerFilter === "all" && activeCategory === null,
        apply: () => {
          if (quarterOptions[0]) setQuarter(quarterOptions[0].id);
          setInitiativeFilter("all");
          setOwnerFilter("all");
          setActiveCategory(null);
        },
      },
      {
        label: "Team load now",
        match: () => initiativeFilter === "all" && ownerFilter === "all" && activeCategory === null,
        apply: () => {
          setInitiativeFilter("all");
          setOwnerFilter("all");
          setActiveCategory(null);
        },
      },
      {
        label: "Quarter review",
        match: () => quarter === quarterOptions[1]?.id && vsPrevious === "previous" && granularity === "Quarter",
        apply: () => {
          if (quarterOptions[1]) setQuarter(quarterOptions[1].id);
          setVsPrevious("previous");
          setGranularity("Quarter");
        },
      },
    ],
    [quarter, quarterOptions, initiativeFilter, ownerFilter, activeCategory, vsPrevious, granularity],
  );
  const lenses = lensPresets.map(({ label, match, apply }) => ({ label, active: match(), apply }));

  // The selected quarter's own window — bounded by today if it's the current
  // quarter, otherwise the full quarter. The comparison window is the
  // quarter immediately before it (not "before today"), so picking a past
  // quarter in the dropdown compares against the right neighbor.
  const currentWindow = useMemo(() => {
    const start = getQuarterStartDate(quarter);
    const quarterEnd = getQuarterEndDate(quarter);
    const end = today < quarterEnd ? today : quarterEnd;
    return { start, end };
  }, [quarter, today]);
  const prevWindow = useMemo(() => {
    const start = new Date(currentWindow.start.getFullYear(), currentWindow.start.getMonth() - 3, 1);
    return { start, end: currentWindow.start };
  }, [currentWindow]);
  const prevQuarterLabel = useMemo(() => getQuarterLabel(prevWindow.start), [prevWindow]);
  const inPeriodSubtitle = vsPrevious === "previous" ? `${quarter} · compared to ${prevQuarterLabel}` : quarter;

  const filters = useMemo(
    () => ({ initiativeId: initiativeFilter, ownerId: ownerFilter, category: activeCategory }),
    [initiativeFilter, ownerFilter, activeCategory],
  );
  const scoped = useMemo(
    () => matchDashboardScope(rawInitiatives, rawProjects, rawTasks, filters),
    [rawInitiatives, rawProjects, rawTasks, filters],
  );
  const scopedActivities = useMemo(() => {
    const taskIds = new Set(scoped.tasks.map((t) => t.id));
    return rawActivities.filter((a) => taskIds.has(a.task_id));
  }, [rawActivities, scoped.tasks]);

  const rightNowKpis = useMemo(() => {
    const kpis = computeRightNowKpis(rawInitiatives, rawProjects, rawTasks, filters, getQuarterStartDate(quarter), today);
    if (vsPrevious === "none") return kpis.map((kpi) => ({ ...kpi, delta: null }));
    return kpis;
  }, [rawInitiatives, rawProjects, rawTasks, filters, quarter, vsPrevious, today]);

  const periodKpis = useMemo(() => {
    const kpis = computePeriodKpis(scoped.tasks, scoped.projects, currentWindow, prevWindow);
    if (vsPrevious === "none") return kpis.map((kpi) => ({ ...kpi, delta: null }));
    return kpis;
  }, [scoped, currentWindow, prevWindow, vsPrevious]);

  const healthList = useMemo(
    () => computeProjectHealthList(scoped.projects, scoped.tasks, scopedActivities, scoped.initiatives, today),
    [scoped, scopedActivities, today],
  );
  const projectHealth = useMemo(() => computeProjectHealthSummary(healthList), [healthList]);

  const velocityBuckets = useMemo(() => getGranularityBuckets(granularity, today), [granularity, today]);
  const velocityBars = useMemo(() => computeVelocityBars(scoped.tasks, velocityBuckets), [scoped.tasks, velocityBuckets]);
  const onTimeBuckets = useMemo(
    () => (granularity === "Week" ? getGranularityBuckets("Month", today) : velocityBuckets),
    [granularity, velocityBuckets, today],
  );
  const onTimeTrend = useMemo(() => computeOnTimeTrend(scoped.tasks, onTimeBuckets), [scoped.tasks, onTimeBuckets]);

  const riskData = useMemo(() => computeRiskData(healthList, scoped.tasks, today), [healthList, scoped.tasks, today]);
  const categoryMix = useMemo(
    () => computeCategoryMix(scoped.tasks, scoped.projects, scoped.initiatives),
    [scoped],
  );
  const teamPerformance = useMemo(() => computeTeamPerformance(scoped.tasks, people, today), [scoped.tasks, people, today]);
  const lookingAhead = useMemo(
    () => computeLookingAhead(scoped.tasks, scoped.projects, scoped.initiatives, people, today),
    [scoped, people, today],
  );
  const comparisonRows = useMemo(() => {
    const rows = computePeriodComparisonRows(scoped.initiatives, scoped.projects, scoped.tasks, currentWindow, prevWindow, today);
    if (vsPrevious === "none") return rows.map((row) => ({ ...row, delta: "—", color: "var(--color-text-faint)" }));
    return rows;
  }, [scoped, currentWindow, prevWindow, today, vsPrevious]);

  return (
    <PageContainer>
      <div className="mb-5.5">
        <div className="mb-1.5 text-sm font-bold uppercase tracking-wide text-accent">Portfolio</div>
        <h1 className="mb-1.25 text-2xl font-semi tracking-tight text-text-primary">Executive dashboard</h1>
        <p className="text-base text-text-secondary">
          The one-line status of every initiative — right now, over time, and what&apos;s coming up.
        </p>
      </div>

      <FilterBar
        quarterOptions={quarterOptions}
        quarter={quarter}
        onQuarterChange={setQuarter}
        vsPrevious={vsPrevious}
        onVsPreviousChange={setVsPrevious}
        initiativeOptions={initiativeOptions}
        initiativeFilter={initiativeFilter}
        onInitiativeFilterChange={setInitiativeFilter}
        ownerOptions={ownerOptions}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        lenses={lenses}
      />

      <SectionHeader dotColor="var(--color-success)" label="Right now" subtitle="Live portfolio snapshot" />
      <div className="flex flex-wrap gap-4">
        {rightNowKpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <SectionHeader dotColor="var(--color-accent)" label="In period" subtitle={inPeriodSubtitle} />
      <div className="flex flex-wrap gap-4">
        {periodKpis.map((kpi) => (
          <PeriodKpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4.5 lg:grid-cols-2">
        <ProjectHealthCard data={projectHealth} />
        <VelocityChart
          data={velocityBars}
          granularity={granularity}
          onGranularityChange={setGranularity}
          hasData={scoped.tasks.length > 0}
        />
      </div>

      <div className="mt-4.5">
        <OnTimeTrendChart data={onTimeTrend} hasData={scoped.tasks.length > 0} />
      </div>

      <SectionHeader dotColor="var(--color-danger)" label="Risk & red flags" subtitle="What needs attention now" />
      <div className="grid grid-cols-1 gap-4.5 md:grid-cols-3">
        <RiskCard
          title="Delayed projects"
          count={riskData.delayedCount}
          tone="danger"
          dotColor="var(--color-danger)"
          items={riskData.delayed}
          emptyMessage="No delayed projects match this filter."
        />
        <RiskCard
          title="Stalled (30d+ quiet)"
          count={riskData.stalled.length}
          tone="warning"
          dotColor="var(--color-warning)"
          items={riskData.stalled}
          emptyMessage="Every project moved in the last 30 days."
        />
        <RiskCard
          title="Oldest blockers"
          count={riskData.blockedCount}
          tone="danger"
          dotColor="var(--color-danger)"
          items={riskData.blockers}
          footer={{ label: "Overdue tasks", value: riskData.overdueCount }}
          emptyMessage="No blocked tasks match this filter."
        />
      </div>

      <SectionHeader dotColor="var(--color-violet)" label="Effort allocation" subtitle="Are we working on the right things?" />
      <CategoryMixCard items={categoryMix} />

      <SectionHeader dotColor="var(--color-accent)" label="Team performance" subtitle="Who's delivering, who's loaded" />
      <TeamPerformanceTable members={teamPerformance} />

      <SectionHeader dotColor="var(--color-warning)" label="Looking ahead" subtitle="Upcoming deadlines & period comparison" />
      <div className="mb-2 grid grid-cols-1 gap-4.5 lg:grid-cols-2">
        <ComingDueCard data={lookingAhead} />
        <PeriodComparisonCard rows={comparisonRows} rangeLabel={quarter} comparisonLabel={prevQuarterLabel} />
      </div>
    </PageContainer>
  );
}
