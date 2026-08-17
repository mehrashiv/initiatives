export interface KpiDelta {
  display: string;
  direction: "up" | "down";
}

export interface KpiData {
  id: string;
  label: string;
  value: string;
  delta: KpiDelta | null;
  goodDirection: "up" | "down";
  trend?: string;
  caption: string;
}

export interface PeriodKpiData {
  id: string;
  label: string;
  value: string;
  delta: KpiDelta | null;
  goodDirection: "up" | "down";
}

export interface ProjectHealthSegment {
  key: "on_track" | "delayed" | "stalled" | "done";
  label: string;
  count: number;
  pct: number;
  color: string;
}

export interface ProjectHealthData {
  activeProjectsTotal: number;
  onTrackPct: number;
  completionPct: number;
  segments: ProjectHealthSegment[];
}

export interface VelocityBar {
  label: string;
  completed: number;
  started: number;
}

export interface OnTimePoint {
  label: string;
  value: number;
}

export interface RiskItem {
  name: string;
  sub: string;
  tag: string;
}

export interface RiskData {
  delayedCount: number;
  delayed: RiskItem[];
  stalled: RiskItem[];
  blockedCount: number;
  blockers: RiskItem[];
  overdueCount: number;
}

export interface CategoryMixItem {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export interface TeamMember {
  name: string;
  initials: string;
  flag: string | null;
  flagTone: "danger" | "warning";
  active: number;
  loadPct: number;
  loadColor: string;
  done: number;
  overdue: number;
  blocked: number;
  onTime: string;
  onTimeColor: string;
}

export interface ForwardItem {
  name: string;
  sub: string;
  dateLabel: string;
  tone: string;
  days: number;
}

export interface LookingAheadForward {
  b30: number;
  b60: number;
  b90: number;
  items: ForwardItem[];
}

export interface CompareRow {
  metric: string;
  cur: string;
  prev: string;
  delta: string;
  color: string;
}
