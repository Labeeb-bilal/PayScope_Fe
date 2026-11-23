'use client';

import { BarChart } from '@mantine/charts';
import { Card, Center, Group, Loader, Select, SimpleGrid, Table, Text } from '@mantine/core';
import { useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { formatCompactMoney, formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { useInsight, useMeta } from '@/lib/hooks';

export function Panel({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Text fw={600}>{title}</Text>
          {description && <Text size="sm" c="dimmed">{description}</Text>}
        </div>
        {action}
      </Group>
      {children}
    </Card>
  );
}

export function Loading() {
  return <Center py="xl"><Loader size="sm" /></Center>;
}

export function SummaryCards() {
  const { data } = useInsight('summary', api.summary);
  const cards = [
    { label: 'Headcount', value: data ? formatNumber(data.headcount) : '–' },
    { label: 'Annual payroll (USD)', value: data ? formatCompactMoney(data.totalPayrollUsd) : '–' },
    { label: 'Median salary (USD)', value: data ? formatMoney(data.medianSalaryUsd, 'USD') : '–' },
    { label: 'Countries · Departments', value: data ? `${data.countries} · ${data.departments}` : '–' },
  ];
  return (
    <SimpleGrid cols={{ base: 2, md: 4 }}>
      {cards.map((c) => (
        <Card withBorder key={c.label} padding="lg">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{c.label}</Text>
          <Text size="xl" fw={700} className="tabular">{c.value}</Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}

export function DepartmentPanel() {
  const { data } = useInsight('by-department', api.byDepartment);
  return (
    <Panel title="Payroll by department" description="Annual base salary cost in USD (FX snapshot)">
      {!data ? <Loading /> : (
        <>
          <BarChart
            h={260}
            data={data.map((d) => ({ department: d.department, payroll: d.totalUsd }))}
            dataKey="department"
            series={[{ name: 'payroll', label: 'Payroll (USD)', color: 'indigo.6' }]}
            valueFormatter={(v) => formatCompactMoney(v)}
            orientation="vertical"
            yAxisProps={{ width: 130 }}
            gridAxis="x"
          />
          <Table mt="md" fz="sm">
            <Table.Thead>
              <Table.Tr><Table.Th>Department</Table.Th><Table.Th ta="right">Headcount</Table.Th><Table.Th ta="right">Median</Table.Th><Table.Th ta="right">Share of payroll</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((d) => (
                <Table.Tr key={d.department}>
                  <Table.Td>{d.department}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatNumber(d.headcount)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(d.medianUsd, 'USD')}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatPercent(d.payrollShare, 1)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}
    </Panel>
  );
}

export function CountryPanel() {
  const { data } = useInsight('by-country', api.byCountry);
  return (
    <Panel title="Pay by country" description="Salary ranges in local currency; median also shown in USD for comparison">
      {!data ? <Loading /> : (
        <Table.ScrollContainer minWidth={640}>
          <Table fz="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th><Table.Th ta="right">Headcount</Table.Th><Table.Th ta="right">P25</Table.Th>
                <Table.Th ta="right">Median</Table.Th><Table.Th ta="right">P75</Table.Th><Table.Th ta="right">Median (USD)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((c) => (
                <Table.Tr key={c.countryCode}>
                  <Table.Td>{c.countryName} <Text span c="dimmed" size="xs">{c.currency}</Text></Table.Td>
                  <Table.Td ta="right" className="tabular">{formatNumber(c.headcount)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(c.local.p25, c.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular" fw={600}>{formatMoney(c.local.median, c.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(c.local.p75, c.currency)}</Table.Td>
                  <Table.Td ta="right" className="tabular">{formatMoney(c.medianUsd, 'USD')}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Panel>
  );
}

export function DistributionPanel() {
  const { data: meta } = useMeta();
  const [country, setCountry] = useState<string | null>(null);
  const { data } = useInsight(`distribution-${country ?? 'all'}`, () => api.distribution(country ?? undefined));
  const chartData = data?.buckets.map((b) => ({
    range: b.to === null ? `${formatCompactMoney(b.from, data.currency)}+` : formatCompactMoney(b.from, data.currency),
    employees: b.count,
  }));
  return (
    <Panel
      title="Salary distribution"
      description={country ? `Annual salary in ${data?.currency ?? 'local currency'}` : 'All employees, annual salary in USD'}
      action={
        <Select
          size="xs" w={180} placeholder="All countries (USD)" clearable
          data={meta?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
          value={country} onChange={setCountry}
        />
      }
    >
      {!chartData ? <Loading /> : (
        <BarChart h={260} data={chartData} dataKey="range" series={[{ name: 'employees', label: 'Employees', color: 'teal.6' }]} gridAxis="y" />
      )}
    </Panel>
  );
}

export function LevelPanel() {
  const { data: meta } = useMeta();
  const { data } = useInsight('by-level', api.byLevel);
  const label = (code: string) => meta?.levels.find((l) => l.code === code)?.label ?? code;
  return (
    <Panel title="Pay progression by level" description="Median and interquartile range, USD, all countries">
      {!data ? <Loading /> : (
        <BarChart
          h={260}
          data={data.map((l) => ({ level: `${l.level} ${label(l.level)}`, P25: l.p25Usd, Median: l.medianUsd, P75: l.p75Usd }))}
          dataKey="level"
          series={[{ name: 'P25', color: 'indigo.2' }, { name: 'Median', color: 'indigo.6' }, { name: 'P75', color: 'indigo.4' }]}
          valueFormatter={(v) => formatCompactMoney(v)}
          withLegend
          gridAxis="y"
        />
      )}
    </Panel>
  );
}
