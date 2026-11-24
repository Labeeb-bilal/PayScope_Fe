import type {
  AssistantStatus, Benchmark, CountryInsight, DepartmentInsight, Distribution, Employee, EmployeeDetail, EmployeeInput, EmployeeQuery,
  LevelInsight, Meta, Page, PayEquity, Summary,
} from './types';
import { env } from './env';

export const API_BASE = env.apiUrl;

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error?.message ?? `Request failed (${res.status})`, body?.error?.code);
  return body as T;
}

export const api = {
  meta: () => request<Meta>('/meta'),
  listEmployees: (q: EmployeeQuery) => request<Page<Employee>>(`/employees${toQueryString(q)}`),
  exportUrl: (q: Partial<EmployeeQuery>) => {
    const { search, country, department, jobTitle, level } = q;
    return `${API_BASE}/api/employees/export.csv${toQueryString({ search, country, department, jobTitle, level })}`;
  },
  getEmployee: (id: number) => request<EmployeeDetail>(`/employees/${id}`),
  createEmployee: (input: EmployeeInput) => request<EmployeeDetail>('/employees', { method: 'POST', body: JSON.stringify(input) }),
  updateEmployee: (id: number, input: Partial<EmployeeInput>) =>
    request<EmployeeDetail>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteEmployee: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),
  changeSalary: (id: number, input: { newSalary: number; effectiveDate: string; reason: string }) =>
    request<EmployeeDetail>(`/employees/${id}/salary-changes`, { method: 'POST', body: JSON.stringify(input) }),

  summary: () => request<Summary>('/insights/summary'),
  byCountry: () => request<CountryInsight[]>('/insights/by-country'),
  byDepartment: () => request<DepartmentInsight[]>('/insights/by-department'),
  byLevel: () => request<LevelInsight[]>('/insights/by-level'),
  distribution: (country?: string) => request<Distribution>(`/insights/distribution${toQueryString({ country })}`),
  benchmark: (q: { jobTitle: string; level?: string; country?: string }) => request<Benchmark>(`/insights/benchmark${toQueryString(q)}`),
  payEquity: (q: { threshold?: number; country?: string; department?: string }) =>
    request<PayEquity>(`/insights/pay-equity${toQueryString(q)}`),

  assistantStatus: () => request<AssistantStatus>('/assistant/status'),
};
