// Mirrors the backend response shapes. Kept small and explicit so the UI fails at compile time if the API changes.

export type Level = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  level: Level;
  department: string;
  countryCode: string;
  countryName: string;
  salary: number;
  currency: string;
  salaryUsd: number;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryChange {
  id: number;
  previousSalary: number | null;
  newSalary: number;
  currency: string;
  effectiveDate: string;
  reason: string;
  createdAt: string;
}

export type EmployeeDetail = Employee & { salaryHistory: SalaryChange[] };

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type SortField = 'name' | 'salaryUsd' | 'hireDate' | 'jobTitle' | 'country' | 'department' | 'employeeCode';

export interface EmployeeQuery {
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  level?: Level;
  sort: SortField;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface Meta {
  countries: { code: string; name: string; currency: string; usdRate: number }[];
  levels: { code: Level; label: string }[];
  departments: { name: string; jobTitles: string[] }[];
}

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  level: Level;
  department: string;
  countryCode: string;
  salary: number;
  hireDate: string;
}

export interface SummaryStats {
  count: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  mean: number;
  total: number;
}

export interface Summary {
  headcount: number;
  totalPayrollUsd: number;
  medianSalaryUsd: number;
  meanSalaryUsd: number;
  countries: number;
  departments: number;
}

export interface CountryInsight {
  countryCode: string;
  countryName: string;
  currency: string;
  headcount: number;
  local: SummaryStats;
  medianUsd: number;
  totalUsd: number;
}

export interface DepartmentInsight {
  department: string;
  headcount: number;
  medianUsd: number;
  meanUsd: number;
  totalUsd: number;
  payrollShare: number;
}

export interface LevelInsight {
  level: Level;
  headcount: number;
  medianUsd: number;
  p25Usd: number;
  p75Usd: number;
}

export interface Distribution {
  currency: string;
  buckets: { from: number; to: number | null; count: number }[];
}

export interface Benchmark {
  jobTitle: string;
  headcount: number;
  items: (SummaryStats & { countryCode: string; countryName: string; currency: string; level: Level; medianUsd: number })[];
}

export interface PayEquityItem {
  id: number;
  employeeCode: string;
  name: string;
  jobTitle: string;
  level: Level;
  department: string;
  countryCode: string;
  currency: string;
  salary: number;
  peerMedian: number;
  peerCount: number;
  ratio: number;
  gapToMedian: number;
  gapToMedianUsd: number;
}

export interface PayEquity {
  threshold: number;
  totalFlagged: number;
  totalGapUsd: number;
  items: PayEquityItem[];
}

// ── AI assistant ──────────────────────────────────────

export interface AssistantStatus {
  enabled: boolean;
  model: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** A tool the assistant ran to answer: shown as a badge so HR can see where numbers came from. */
export interface ToolUse {
  name: string;
  args: Record<string, unknown>;
  ok: boolean;
}

export type AssistantStreamEvent =
  | ({ type: 'tool_call' } & ToolUse)
  | { type: 'text_delta'; text: string }
  | { type: 'done'; answer: string; toolsUsed: ToolUse[] }
  | { type: 'error'; code: string; message: string };
