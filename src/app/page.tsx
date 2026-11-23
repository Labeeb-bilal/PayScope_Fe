'use client';

import { Button, Card, Group, Pagination, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconDownload, IconPlus, IconSearch } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { useEmployees, useMeta } from '@/lib/hooks';
import type { EmployeeQuery, Level, SortField } from '@/lib/types';

const DEFAULT_QUERY: EmployeeQuery = { sort: 'name', order: 'asc', page: 1, pageSize: 25 };

export default function EmployeesPage() {
  const { data: meta } = useMeta();
  const [query, setQuery] = useState<EmployeeQuery>(DEFAULT_QUERY);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchInput, 250);
  const [openId, setOpenId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  /** Any filter change resets to page 1, otherwise HR can land on an empty page 37. */
  const updateFilter = (patch: Partial<EmployeeQuery>) => setQuery((q) => ({ ...q, ...patch, page: 1 }));

  useEffect(() => {
    setQuery((q) => (q.search === (debouncedSearch || undefined) ? q : { ...q, search: debouncedSearch || undefined, page: 1 }));
  }, [debouncedSearch]);

  const { data, isFetching, error } = useEmployees(query);

  const onSort = (field: SortField) =>
    setQuery((q) => ({ ...q, sort: field, order: q.sort === field && q.order === 'asc' ? 'desc' : 'asc', page: 1 }));

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.total, data.page * data.pageSize) : 0;
  const hasFilters = Boolean(query.search || query.country || query.department || query.level);

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Employees</Title>
          <Text c="dimmed" size="sm">Search, filter and manage salaries for the whole organisation.</Text>
        </div>
        <Group>
          <Button component="a" href={api.exportUrl(query)} variant="default" leftSection={<IconDownload size={16} />}>
            Export CSV
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>Add employee</Button>
        </Group>
      </Group>

      <Card withBorder padding="md">
        <Group align="flex-end" mb="md" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Name, email or employee code"
            leftSection={<IconSearch size={16} />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            w={280}
          />
          <Select
            label="Country"
            placeholder="All countries"
            clearable
            searchable
            data={meta?.countries.map((c) => ({ value: c.code, label: c.name })) ?? []}
            value={query.country ?? null}
            onChange={(v) => updateFilter({ country: v ?? undefined })}
            w={190}
          />
          <Select
            label="Department"
            placeholder="All departments"
            clearable
            data={meta?.departments.map((d) => d.name) ?? []}
            value={query.department ?? null}
            onChange={(v) => updateFilter({ department: v ?? undefined, jobTitle: undefined })}
            w={190}
          />
          <Select
            label="Level"
            placeholder="All levels"
            clearable
            data={meta?.levels.map((l) => ({ value: l.code, label: `${l.code} · ${l.label}` })) ?? []}
            value={query.level ?? null}
            onChange={(v) => updateFilter({ level: (v as Level | null) ?? undefined })}
            w={160}
          />
          {hasFilters && (
            <Button variant="subtle" onClick={() => { setSearchInput(''); setQuery(DEFAULT_QUERY); }}>
              Clear filters
            </Button>
          )}
        </Group>

        {error ? (
          <Text c="red">Could not load employees: {(error as Error).message}</Text>
        ) : (
          <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 120ms' }}>
            <EmployeeTable rows={data?.items ?? []} sort={query.sort} order={query.order} onSort={onSort} onOpen={setOpenId} />
          </div>
        )}

        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {data ? `Showing ${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(data.total)} employees` : 'Loading…'}
          </Text>
          <Group>
            <Select
              data={['25', '50', '100']}
              value={String(query.pageSize)}
              onChange={(v) => updateFilter({ pageSize: Number(v ?? 25) })}
              w={80}
              size="xs"
              aria-label="Rows per page"
            />
            <Pagination total={data?.totalPages ?? 1} value={query.page} onChange={(page) => setQuery((q) => ({ ...q, page }))} size="sm" />
          </Group>
        </Group>
      </Card>

      <EmployeeDrawer id={openId} onClose={() => setOpenId(null)} />
      <EmployeeFormModal opened={createOpen} onClose={() => setCreateOpen(false)} onSaved={(e) => setOpenId(e.id)} />
    </Stack>
  );
}
