'use client';

import { SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { BenchmarkPanel } from '@/components/insights/BenchmarkPanel';
import { CountryPanel, DepartmentPanel, DistributionPanel, LevelPanel, SummaryCards } from '@/components/insights/Panels';
import { PayEquityPanel } from '@/components/insights/PayEquityPanel';

export default function InsightsPage() {
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <Stack>
      <div>
        <Title order={2}>Pay insights</Title>
        <Text c="dimmed" size="sm">
          How ACME pays people. Cross-country figures use a fixed FX snapshot to USD; per-country figures stay in local currency.
        </Text>
      </div>
      <SummaryCards />
      <PayEquityPanel onOpenEmployee={setOpenId} />
      <BenchmarkPanel />
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <DepartmentPanel />
        <Stack>
          <DistributionPanel />
          <LevelPanel />
        </Stack>
      </SimpleGrid>
      <CountryPanel />
      <EmployeeDrawer id={openId} onClose={() => setOpenId(null)} />
    </Stack>
  );
}
