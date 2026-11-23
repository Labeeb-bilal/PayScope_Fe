'use client';

import {
  Badge, Button, Card, Center, Divider, Drawer, Group, Loader, Progress, SimpleGrid, Stack, Text, Timeline, Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCash, IconEdit, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatMoney, formatPercent, salaryChangePct } from '@/lib/format';
import { useDeleteEmployee, useEmployee, useInsight } from '@/lib/hooks';
import type { EmployeeDetail } from '@/lib/types';
import { EmployeeFormModal } from './EmployeeFormModal';
import { SalaryChangeForm } from './SalaryChangeForm';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm">{value}</Text>
    </div>
  );
}

/** Where this person sits against peers (same title, level, country): the question HR asks before any raise. */
function PeerComparison({ employee }: { employee: EmployeeDetail }) {
  const { data } = useInsight(`peer-${employee.jobTitle}-${employee.level}-${employee.countryCode}`, () =>
    api.benchmark({ jobTitle: employee.jobTitle, level: employee.level, country: employee.countryCode }),
  );
  const peers = data?.items[0];
  if (!peers || peers.count < 2) return <Text size="sm" c="dimmed">Not enough peers for a comparison.</Text>;
  const ratio = employee.salary / peers.median;
  const position = peers.max === peers.min ? 50 : ((employee.salary - peers.min) / (peers.max - peers.min)) * 100;
  const color = ratio < 0.8 ? 'red' : ratio < 0.95 ? 'yellow' : ratio > 1.2 ? 'blue' : 'green';
  return (
    <Stack gap={6}>
      <Group justify="space-between">
        <Text size="sm">
          {formatPercent(ratio)} of peer median <Text span c="dimmed" size="xs">({peers.count} peers)</Text>
        </Text>
        <Badge color={color} variant="light">
          {ratio < 0.8 ? 'Well below peers' : ratio < 0.95 ? 'Below peers' : ratio > 1.2 ? 'Above peers' : 'In line'}
        </Badge>
      </Group>
      <Progress value={Math.max(2, Math.min(100, position))} color={color} size="sm" />
      <Group justify="space-between">
        <Text size="xs" c="dimmed">Min {formatMoney(peers.min, peers.currency)}</Text>
        <Text size="xs" c="dimmed">Median {formatMoney(peers.median, peers.currency)}</Text>
        <Text size="xs" c="dimmed">Max {formatMoney(peers.max, peers.currency)}</Text>
      </Group>
    </Stack>
  );
}

export function EmployeeDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data: e, isLoading } = useEmployee(id);
  const remove = useDeleteEmployee();
  const [mode, setMode] = useState<'view' | 'salary'>('view');
  const [editOpen, setEditOpen] = useState(false);

  function close() {
    setMode('view');
    onClose();
  }

  async function handleDelete() {
    if (!e || !window.confirm(`Delete ${e.firstName} ${e.lastName}? This also deletes their salary history.`)) return;
    await remove.mutateAsync(e.id);
    notifications.show({ message: `${e.firstName} ${e.lastName} deleted` });
    close();
  }

  return (
    <Drawer opened={id !== null} onClose={close} position="right" size="lg" title={<Text fw={600}>Employee</Text>}>
      {isLoading || !e ? (
        <Center py="xl"><Loader /></Center>
      ) : (
        <Stack>
          <div>
            <Title order={3}>{e.firstName} {e.lastName}</Title>
            <Group gap="xs">
              <Text c="dimmed" size="sm">{e.jobTitle}</Text>
              <Badge variant="light" size="sm">{e.level}</Badge>
              <Text c="dimmed" size="sm" ff="monospace">{e.employeeCode}</Text>
            </Group>
          </div>

          <SimpleGrid cols={2}>
            <Field label="Email" value={e.email} />
            <Field label="Department" value={e.department} />
            <Field label="Country" value={`${e.countryName} (${e.currency})`} />
            <Field label="Hire date" value={formatDate(e.hireDate)} />
          </SimpleGrid>

          <Card withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="xs" c="dimmed">Annual base salary</Text>
                <Text size="xl" fw={700} className="tabular">{formatMoney(e.salary, e.currency)}</Text>
                {e.currency !== 'USD' && <Text size="xs" c="dimmed">≈ {formatMoney(e.salaryUsd, 'USD')} (FX snapshot)</Text>}
              </div>
              {mode === 'view' && (
                <Button leftSection={<IconCash size={16} />} onClick={() => setMode('salary')}>Change salary</Button>
              )}
            </Group>
            {mode === 'salary' && (
              <>
                <Divider my="sm" />
                <SalaryChangeForm employee={e} onDone={() => setMode('view')} />
              </>
            )}
          </Card>

          <Card withBorder>
            <Text fw={600} size="sm" mb="xs">Compared with peers ({e.jobTitle}, {e.level}, {e.countryName})</Text>
            <PeerComparison employee={e} />
          </Card>

          <div>
            <Text fw={600} size="sm" mb="sm">Salary history</Text>
            <Timeline active={0} bulletSize={14} lineWidth={2}>
              {e.salaryHistory.map((h) => {
                const pct = salaryChangePct(h.previousSalary, h.newSalary);
                return (
                  <Timeline.Item
                    key={h.id}
                    title={
                      <Group gap="xs">
                        <Text size="sm" fw={500} className="tabular">{formatMoney(h.newSalary, h.currency)}</Text>
                        {pct && <Badge size="xs" color={pct.startsWith('-') ? 'red' : 'green'} variant="light">{pct}</Badge>}
                      </Group>
                    }
                  >
                    <Text size="xs" c="dimmed">{h.reason} · effective {formatDate(h.effectiveDate)}</Text>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </div>

          <Divider />
          <Group justify="space-between">
            <Button variant="light" color="red" leftSection={<IconTrash size={16} />} onClick={handleDelete} loading={remove.isPending}>
              Delete
            </Button>
            <Button variant="default" leftSection={<IconEdit size={16} />} onClick={() => setEditOpen(true)}>
              Edit details
            </Button>
          </Group>
          <EmployeeFormModal opened={editOpen} onClose={() => setEditOpen(false)} employee={e} />
        </Stack>
      )}
    </Drawer>
  );
}
