'use client';

import { AppShell, Group, NavLink, Text, ThemeIcon } from '@mantine/core';
import { IconChartBar, IconCoin, IconSparkles, IconUsers } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/', label: 'Employees', icon: IconUsers },
  { href: '/insights/', label: 'Pay insights', icon: IconChartBar },
  { href: '/assistant/', label: 'Ask AI', icon: IconSparkles },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href.replace(/\/$/, '')));

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" gap="xs">
          <ThemeIcon variant="filled" size="md">
            <IconCoin size={18} />
          </ThemeIcon>
          <Text fw={700}>ACME Salary Manager</Text>
          <Text c="dimmed" size="sm" ml="auto">
            HR Manager
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        {NAV.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} component={Link} href={href} label={label} leftSection={<Icon size={18} />} active={isActive(href)} />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
