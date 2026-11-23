'use client';

import { Alert, Button, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { formatMoney, salaryChangePct, todayIso } from '@/lib/format';
import { useChangeSalary } from '@/lib/hooks';
import type { EmployeeDetail } from '@/lib/types';

const REASONS = ['Annual review', 'Promotion', 'Market adjustment', 'Pay equity adjustment', 'Role change', 'Correction'];

export function SalaryChangeForm({ employee, onDone }: { employee: EmployeeDetail; onDone: () => void }) {
  const change = useChangeSalary(employee.id);
  const [newSalary, setNewSalary] = useState<number | ''>(employee.salary);
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [reason, setReason] = useState<string | null>('Annual review');
  const [error, setError] = useState<string | null>(null);

  const delta = typeof newSalary === 'number' ? salaryChangePct(employee.salary, newSalary) : null;

  async function submit() {
    setError(null);
    try {
      await change.mutateAsync({ newSalary: Number(newSalary), effectiveDate, reason: reason ?? '' });
      notifications.show({ color: 'green', message: `Salary updated to ${formatMoney(Number(newSalary), employee.currency)}` });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <Stack gap="sm">
        {error && <Alert color="red">{error}</Alert>}
        <NumberInput
          label={`New annual salary (${employee.currency})`}
          required
          min={1}
          thousandSeparator=","
          allowDecimal={false}
          value={newSalary}
          onChange={(v) => setNewSalary(typeof v === 'number' ? v : '')}
          rightSectionWidth={80}
          rightSection={delta ? <Text size="xs" c={delta.startsWith('-') ? 'red' : 'green'}>{delta}</Text> : null}
        />
        <Group grow>
          <TextInput label="Effective date" type="date" required value={effectiveDate} onChange={(e) => setEffectiveDate(e.currentTarget.value)} />
          <Select label="Reason" required data={REASONS} value={reason} onChange={setReason} />
        </Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>Cancel</Button>
          <Button type="submit" loading={change.isPending}>Save salary change</Button>
        </Group>
      </Stack>
    </form>
  );
}
