'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { EmployeeInput, EmployeeQuery } from './types';

export const keys = {
  meta: ['meta'] as const,
  employees: (q: EmployeeQuery) => ['employees', q] as const,
  employee: (id: number) => ['employee', id] as const,
  insights: ['insights'] as const,
};

export function useMeta() {
  return useQuery({ queryKey: keys.meta, queryFn: api.meta, staleTime: Infinity });
}

export function useEmployees(q: EmployeeQuery) {
  return useQuery({ queryKey: keys.employees(q), queryFn: () => api.listEmployees(q), placeholderData: keepPreviousData });
}

export function useEmployee(id: number | null) {
  return useQuery({ queryKey: keys.employee(id ?? 0), queryFn: () => api.getEmployee(id!), enabled: id !== null });
}

function useInvalidateAfterWrite() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['employees'] });
    qc.invalidateQueries({ queryKey: ['employee'] });
    qc.invalidateQueries({ queryKey: keys.insights });
    qc.invalidateQueries({ queryKey: keys.meta });
  };
}

export function useCreateEmployee() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({ mutationFn: (input: EmployeeInput) => api.createEmployee(input), onSuccess: invalidate });
}

export function useUpdateEmployee(id: number) {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({ mutationFn: (input: Partial<EmployeeInput>) => api.updateEmployee(id, input), onSuccess: invalidate });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({ mutationFn: (id: number) => api.deleteEmployee(id), onSuccess: invalidate });
}

export function useChangeSalary(id: number) {
  const invalidate = useInvalidateAfterWrite();
  return useMutation({
    mutationFn: (input: { newSalary: number; effectiveDate: string; reason: string }) => api.changeSalary(id, input),
    onSuccess: invalidate,
  });
}

export function useInsight<T>(name: string, fn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: [...keys.insights, name], queryFn: fn, enabled });
}
