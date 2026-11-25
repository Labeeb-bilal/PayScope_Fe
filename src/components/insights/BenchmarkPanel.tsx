'use client';

import { Badge, Group, Select, Table, Text } from '@mantine/core';
import { useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useInsight, useMeta } from '@/lib/hooks';
import { Loading, Panel } from './Panels';

export function BenchmarkPanel() {
  const { data: meta } = useMeta();
  const [jobTitle, setJobTitle] = useState<string | null>('Software Engineer');
  const [country, setCountry] = useState<string | null>(null);
  const { data, isLoading } = useInsight(
    `benchmark-${jobTitle}-${country}`,
    () => api.benchmark({ jobTitle: jobTitle!, country: country ?? undefined }),
    Boolean(jobTitle),
  );
  const titles = meta?.departments.map((d) => ({ group: d.name, items: d.jobTitles })) ?? [];

  return (
    <Panel
      title="Pay benchmark"
      description="What do we pay for a role? Ranges by country and level in local currency."
      action={
        <Group gap="xs">
          <Select size="xs" w={220} searchable data={titles} value={jobTitle} onChange={setJobTitle} placeholder="Job title" />
          <Select
            size="xs" w={170} clearable placeholder="All countries"
            data={meta?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
            value={country} onChange={setCountry}
          />
        </Group>
      }
    >
      {!jobTitle ? <Text c="dimmed" size="sm">Pick a job title.</Text> : isLoading || !data ? <Loading /> : (
        <Table.ScrollContainer minWidth={700} maxHeight={420}>
          <Table fz="sm" striped stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th><Table.Th>Level</Table.Th><Table.Th ta="right">People</Table.Th>
                <Table.Th ta="right">Min</Table.Th><Table.Th ta="right">P25</Table.Th><Table.Th ta="right">Median</Table.Th>
                <Table.Th ta="right">P75</Table.Th><Table.Th ta="right">Max</Table.Th><Table.Th ta="right">Median (USD)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.items.map((r) => (
                <Table.Tr key={`${r.countryCode}-${r.level}`}>
                  <Table.Td>{r.countryName}</Table.Td>
                  <Table.Td><Badge size="xs" variant="light">{r.level}</Badge></Table.Td>
                  <Table.Td ta="right" className="tabular">{r.count}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(r.min, r.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(r.p25, r.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular" fw={600}>{formatMoney(r.median, r.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(r.p75, r.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(r.max, r.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(r.medianUsd, 'USD')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Panel>
  );
}
