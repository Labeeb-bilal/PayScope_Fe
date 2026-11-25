'use client';

import { Alert, Badge, Group, SegmentedControl, Select, Table, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { formatCompactMoney, formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { useInsight, useMeta } from '@/lib/hooks';
import { Loading, Panel } from './Panels';

export function PayEquityPanel({ onOpenEmployee }: { onOpenEmployee: (id: number) => void }) {
  const { data: meta } = useMeta();
  const [threshold, setThreshold] = useState('0.8');
  const [country, setCountry] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const { data } = useInsight(`pay-equity-${threshold}-${country}-${department}`, () =>
    api.payEquity({ threshold: Number(threshold), country: country ?? undefined, department: department ?? undefined }),
  );

  return (
    <Panel
      title="Pay-equity flags"
      description="Employees paid below a share of their peer-group median (same title, level and country, ≥ 5 peers)."
      action={
        <Group gap="xs">
          <SegmentedControl size="xs" value={threshold} onChange={setThreshold}
            data={[{ value: '0.7', label: '< 70%' }, { value: '0.8', label: '< 80%' }, { value: '0.9', label: '< 90%' }]} />
          <Select size="xs" w={150} clearable placeholder="All countries"
            data={meta?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []} value={country} onChange={setCountry} />
          <Select size="xs" w={160} clearable placeholder="All departments"
            data={meta?.departments.map((d) => d.name) ?? []} value={department} onChange={setDepartment} />
        </Group>
      }
    >
      {!data ? <Loading /> : (
        <>
          <Alert color={data.totalFlagged ? 'orange' : 'green'} icon={<IconAlertTriangle size={18} />} mb="md">
            {data.totalFlagged
              ? <><b>{formatNumber(data.totalFlagged)}</b> employees are paid below {formatPercent(Number(threshold))} of their peer median.
                  Bringing them to the median would cost about <b>{formatCompactMoney(data.totalGapUsd)}</b> per year.</>
              : 'No one is below this threshold. 🎉'}
          </Alert>
          {data.items.length > 0 && (
            <Table.ScrollContainer minWidth={760} maxHeight={420}>
              <Table fz="sm" highlightOnHover stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Employee</Table.Th><Table.Th>Role</Table.Th><Table.Th>Country</Table.Th>
                    <Table.Th ta="right">Salary</Table.Th><Table.Th ta="right">Peer median</Table.Th>
                    <Table.Th ta="right">% of median</Table.Th><Table.Th ta="right">Gap / year</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.items.map((r) => (
                    <Table.Tr key={r.id} className="clickable-row" onClick={() => onOpenEmployee(r.id)}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{r.name}</Text>
                        <Text size="xs" c="dimmed" ff="monospace">{r.employeeCode}</Text>
                      </Table.Td>
                      <Table.Td>{r.jobTitle} <Badge size="xs" variant="light">{r.level}</Badge></Table.Td>
                      <Table.Td>{r.countryCode}</Table.Td>
                      <Table.Td ta="right" className="tabular">{formatMoney(r.salary, r.currency)}</Table.Td>
                      <Table.Td ta="right" className="tabular">{formatMoney(r.peerMedian, r.currency)}</Table.Td>
                      <Table.Td ta="right"><Badge color={r.ratio < 0.7 ? 'red' : 'orange'} variant="light">{formatPercent(r.ratio)}</Badge></Table.Td>
                      <Table.Td ta="right" className="tabular">{formatMoney(r.gapToMedian, r.currency)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
          {data.totalFlagged > data.items.length && (
            <Text size="xs" c="dimmed" mt="xs">Showing the {data.items.length} largest gaps. Narrow by country or department to see more.</Text>
          )}
        </>
      )}
    </Panel>
  );
}
