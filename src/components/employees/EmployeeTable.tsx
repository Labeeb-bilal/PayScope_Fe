'use client';

import { Badge, Center, Group, Table, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { formatDate, formatMoney } from '@/lib/format';
import type { Employee, SortField } from '@/lib/types';

interface Props {
  rows: Employee[];
  sort: SortField;
  order: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  onOpen: (id: number) => void;
}

function SortHeader({ field, children, props, align }: { field: SortField; children: ReactNode; props: Props; align?: 'right' }) {
  const active = props.sort === field;
  const Icon = active ? (props.order === 'asc' ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th style={{ textAlign: align }}>
      <UnstyledButton onClick={() => props.onSort(field)} aria-label={`Sort by ${field}`}>
        <Group gap={4} wrap="nowrap" justify={align === 'right' ? 'flex-end' : 'flex-start'}>
          <Text fw={600} size="sm">
            {children}
          </Text>
          <Icon size={14} opacity={active ? 1 : 0.4} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

export function EmployeeTable(props: Props) {
  const { rows, onOpen } = props;
  return (
    <Table.ScrollContainer minWidth={900}>
      <Table highlightOnHover verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <SortHeader field="name" props={props}>Employee</SortHeader>
            <SortHeader field="employeeCode" props={props}>Code</SortHeader>
            <SortHeader field="jobTitle" props={props}>Role</SortHeader>
            <SortHeader field="department" props={props}>Department</SortHeader>
            <SortHeader field="country" props={props}>Country</SortHeader>
            <SortHeader field="salaryUsd" props={props} align="right">Annual salary</SortHeader>
            <SortHeader field="hireDate" props={props}>Hired</SortHeader>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <Center py="xl">
                  <Text c="dimmed">No employees match these filters.</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
          {rows.map((e) => (
            <Table.Tr key={e.id} className="clickable-row" onClick={() => onOpen(e.id)}>
              <Table.Td>
                <Text size="sm" fw={500}>
                  {e.firstName} {e.lastName}
                </Text>
                <Text size="xs" c="dimmed">
                  {e.email}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" ff="monospace">{e.employeeCode}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm">{e.jobTitle}</Text>
                  <Badge size="xs" variant="light">{e.level}</Badge>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{e.department}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{e.countryName}</Text>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }} className="tabular">
                <Text size="sm" fw={500}>{formatMoney(e.salary, e.currency)}</Text>
                {e.currency !== 'USD' && (
                  <Text size="xs" c="dimmed">≈ {formatMoney(e.salaryUsd, 'USD')}</Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm">{formatDate(e.hireDate)}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
