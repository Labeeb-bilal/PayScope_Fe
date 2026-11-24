'use client';

import { Alert, Button, Group, Modal, NumberInput, Select, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { useCreateEmployee, useMeta, useUpdateEmployee } from '@/lib/hooks';
import { todayIso } from '@/lib/format';
import type { EmployeeDetail, EmployeeInput, Level } from '@/lib/types';

interface Props {
  opened: boolean;
  onClose: () => void;
  employee?: EmployeeDetail;
  onSaved?: (e: EmployeeDetail) => void;
}

type FormState = Omit<EmployeeInput, 'salary'> & { salary: number | '' };

const emptyForm: FormState = {
  firstName: '', lastName: '', email: '', jobTitle: '', level: 'L1', department: '', countryCode: '', salary: '', hireDate: todayIso(),
};

export function EmployeeFormModal({ opened, onClose, employee, onSaved }: Props) {
  const { data: meta } = useMeta();
  const create = useCreateEmployee();
  const update = useUpdateEmployee(employee?.id ?? 0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) return;
    setError(null);
    setForm(employee ? { ...employee, salary: employee.salary } : { ...emptyForm, hireDate: todayIso() });
  }, [opened, employee]);

  const isEdit = Boolean(employee);
  const relocating = isEdit && form.countryCode !== employee!.countryCode;
  const showSalary = !isEdit || relocating;
  const currency = meta?.countries.find((c) => c.code === form.countryCode)?.currency;
  const jobTitles = useMemo(
    () => meta?.departments.find((d) => d.name === form.department)?.jobTitles ?? [],
    [meta, form.department],
  );
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setError(null);
    try {
      let saved: EmployeeDetail;
      if (isEdit) {
        const { salary, ...profile } = form;
        saved = await update.mutateAsync(relocating ? { ...profile, salary: Number(salary) } : profile);
      } else {
        saved = await create.mutateAsync({ ...form, salary: Number(form.salary) });
      }
      notifications.show({ color: 'green', message: isEdit ? 'Employee updated' : `${saved.firstName} ${saved.lastName} added (${saved.employeeCode})` });
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit employee' : 'Add employee'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <SimpleGrid cols={2}>
            <TextInput label="First name" required value={form.firstName} onChange={(e) => set('firstName', e.currentTarget.value)} />
            <TextInput label="Last name" required value={form.lastName} onChange={(e) => set('lastName', e.currentTarget.value)} />
          </SimpleGrid>
          <TextInput label="Work email" type="email" required value={form.email} onChange={(e) => set('email', e.currentTarget.value)} />
          <SimpleGrid cols={2}>
            <Select
              label="Department"
              required
              searchable
              data={meta?.departments.map((d) => d.name) ?? []}
              value={form.department || null}
              onChange={(v) => setForm((f) => ({ ...f, department: v ?? '', jobTitle: '' }))}
            />
            <Select
              label="Job title"
              required
              searchable
              disabled={!form.department}
              data={jobTitles}
              value={form.jobTitle || null}
              onChange={(v) => set('jobTitle', v ?? '')}
            />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <Select
              label="Level"
              required
              data={meta?.levels.map((l) => ({ value: l.code, label: `${l.code} · ${l.label}` })) ?? []}
              value={form.level}
              onChange={(v) => set('level', (v ?? 'L1') as Level)}
            />
            <Select
              label="Country"
              required
              searchable
              data={meta?.countries.map((c) => ({ value: c.code, label: `${c.name} (${c.currency})` })) ?? []}
              value={form.countryCode || null}
              onChange={(v) => set('countryCode', v ?? '')}
            />
          </SimpleGrid>
          {relocating && (
            <Alert color="yellow" title="Relocation">
              Moving countries changes the salary currency to {currency}. Enter the new annual salary. It will be recorded in the salary history.
            </Alert>
          )}
          <SimpleGrid cols={2}>
            {showSalary && (
              <NumberInput
                label={`Annual base salary${currency ? ` (${currency})` : ''}`}
                required
                min={1}
                thousandSeparator=","
                allowDecimal={false}
                value={form.salary}
                onChange={(v) => set('salary', typeof v === 'number' ? v : '')}
              />
            )}
            <TextInput label="Hire date" type="date" required value={form.hireDate} onChange={(e) => set('hireDate', e.currentTarget.value)} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={pending}>{isEdit ? 'Save changes' : 'Add employee'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
