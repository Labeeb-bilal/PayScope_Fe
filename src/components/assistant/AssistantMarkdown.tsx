'use client';

import { Anchor, Table, Typography } from '@mantine/core';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EMPLOYEE_LINK_PREFIX, linkEmployeeCodes } from '@/lib/assistant';

export function AssistantMarkdown({ content, onOpenEmployee }: { content: string; onOpenEmployee: (code: string) => void }) {
  const components: Components = {
    table: ({ children }) => (
      <Table.ScrollContainer minWidth={400} my="xs">
        <Table striped withTableBorder withColumnBorders fz="sm" className="tabular">
          {children}
        </Table>
      </Table.ScrollContainer>
    ),
    thead: ({ children }) => <Table.Thead>{children}</Table.Thead>,
    tbody: ({ children }) => <Table.Tbody>{children}</Table.Tbody>,
    tr: ({ children }) => <Table.Tr>{children}</Table.Tr>,
    th: ({ children, style }) => <Table.Th style={style}>{children}</Table.Th>,
    td: ({ children, style }) => <Table.Td style={style}>{children}</Table.Td>,
    a: ({ href, children }) => {
      if (href?.startsWith(EMPLOYEE_LINK_PREFIX)) {
        const code = href.slice(EMPLOYEE_LINK_PREFIX.length);
        return (
          <Anchor component="button" type="button" fz="inherit" fw={500} onClick={() => onOpenEmployee(code)} title={`Open ${code}`}>
            {children}
          </Anchor>
        );
      }
      return (
        <Anchor href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </Anchor>
      );
    },
  };

  return (
    <Typography fz="sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linkEmployeeCodes(content)}
      </ReactMarkdown>
    </Typography>
  );
}
