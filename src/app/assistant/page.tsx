'use client';

import {
  ActionIcon, Alert, Badge, Button, Card, Center, Code, Group, Loader, Paper, ScrollArea, SimpleGrid, Stack, Text,
  Textarea, ThemeIcon, Title, Tooltip, UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconKey, IconPlayerStopFilled, IconPlus, IconSend, IconSparkles } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AssistantMarkdown } from '@/components/assistant/AssistantMarkdown';
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer';
import { api, ApiError } from '@/lib/api';
import { streamChat, toolBadgeLabel } from '@/lib/assistant';
import type { ChatTurn, ToolUse } from '@/lib/types';

interface UiMessage extends ChatTurn {
  tools: ToolUse[];
  streaming?: boolean;
  error?: string;
}

const EXAMPLES = [
  'What do we pay a Senior Data Engineer in the UAE?',
  'Who in Sales India is underpaid?',
  "Show Kavya Kapoor's salary history",
  'Which department costs the most, and how does pay rise by level?',
];

/** The API accepts up to 20 messages ending with the user's; failed or empty turns are not resent. */
function historyFor(messages: UiMessage[]): ChatTurn[] {
  return messages
    .filter((m) => !m.error && m.content.trim())
    .map(({ role, content }) => ({ role, content }))
    .slice(-20);
}

function ToolBadges({ tools }: { tools: ToolUse[] }) {
  if (!tools.length) return null;
  return (
    <Group gap={6} mt="xs">
      <Text size="xs" c="dimmed">
        Sources:
      </Text>
      {tools.map((t, i) => (
        <Tooltip key={i} label={t.ok ? 'Data lookup used for this answer' : 'This lookup failed; the assistant retried or explained'}>
          <Badge size="sm" radius="sm" variant="light" color={t.ok ? 'indigo' : 'red'} tt="none" fw={500}>
            {toolBadgeLabel(t)}
          </Badge>
        </Tooltip>
      ))}
    </Group>
  );
}

function AssistantBubble({ message, onOpenEmployee }: { message: UiMessage; onOpenEmployee: (code: string) => void }) {
  const lastTool = message.tools.at(-1);
  return (
    <Group align="flex-start" gap="sm" wrap="nowrap">
      <ThemeIcon variant="light" radius="xl" size="lg">
        <IconSparkles size={18} />
      </ThemeIcon>
      <Paper withBorder p="sm" radius="md" style={{ flex: 1, minWidth: 0 }}>
        {message.content ? (
          <AssistantMarkdown content={message.content} onOpenEmployee={onOpenEmployee} />
        ) : message.streaming ? (
          <Group gap="xs">
            <Loader size="xs" type="dots" />
            <Text size="sm" c="dimmed">
              {lastTool ? `Looking up ${toolBadgeLabel(lastTool)}…` : 'Thinking…'}
            </Text>
          </Group>
        ) : null}
        {message.error && (
          <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />} mt={message.content ? 'xs' : 0} p="xs">
            {message.error}
          </Alert>
        )}
        <ToolBadges tools={message.tools} />
      </Paper>
    </Group>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <Group justify="flex-end">
      <Paper p="sm" radius="md" bg="indigo.6" c="white" maw="80%">
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </Text>
      </Paper>
    </Group>
  );
}

function DisabledNotice() {
  return (
    <Alert color="yellow" variant="light" icon={<IconKey size={18} />} title="The AI assistant is not set up yet">
      <Stack gap={6}>
        <Text size="sm">
          It needs an API key for an LLM provider. Groq has a free tier: create a key at{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
            console.groq.com/keys
          </a>
          , then add it to <Code>backend/.env</Code> and restart the API:
        </Text>
        <Code block>LLM_API_KEY=gsk_your_key_here</Code>
        <Text size="sm" c="dimmed">
          Everything else in the app works without it.
        </Text>
      </Stack>
    </Alert>
  );
}

export default function AssistantPage() {
  const status = useQuery({ queryKey: ['assistant-status'], queryFn: api.assistantStatus, staleTime: 60_000 });
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /** Applies a change to the assistant message being streamed (always the last one). */
  const updateLast = (patch: (m: UiMessage) => UiMessage) =>
    setMessages((all) => (all.length ? [...all.slice(0, -1), patch(all[all.length - 1]!)] : all));

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const history = [...historyFor(messages), { role: 'user' as const, content: question }];
    setMessages((all) => [...all, { role: 'user', content: question, tools: [] }, { role: 'assistant', content: '', tools: [], streaming: true }]);
    setInput('');
    setBusy(true);
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      await streamChat(
        history,
        (event) => {
          if (event.type === 'tool_call') updateLast((m) => ({ ...m, tools: [...m.tools, { name: event.name, args: event.args, ok: event.ok }] }));
          else if (event.type === 'text_delta') updateLast((m) => ({ ...m, content: m.content + event.text }));
          // The final answer replaces any text streamed before a tool call.
          else if (event.type === 'done') updateLast((m) => ({ ...m, content: event.answer, tools: event.toolsUsed, streaming: false }));
          else if (event.type === 'error') updateLast((m) => ({ ...m, streaming: false, error: event.message }));
        },
        abort.signal,
      );
    } catch (err) {
      const message = abort.signal.aborted
        ? 'Stopped.'
        : err instanceof ApiError
          ? err.message
          : 'Could not reach the server. Check your connection and try again.';
      updateLast((m) => ({ ...m, error: message }));
    } finally {
      updateLast((m) => ({ ...m, streaming: false, error: m.error ?? (m.content ? undefined : 'No answer was returned.') }));
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function openEmployee(code: string) {
    try {
      const page = await api.listEmployees({ search: code, sort: 'employeeCode', order: 'asc', page: 1, pageSize: 5 });
      const match = page.items.find((e) => e.employeeCode === code);
      if (match) setOpenId(match.id);
      else notifications.show({ color: 'red', message: `${code} was not found. It may have been deleted.` });
    } catch {
      notifications.show({ color: 'red', message: `Could not open ${code}.` });
    }
  }

  const enabled = status.data?.enabled === true;

  return (
    <Stack h="calc(100dvh - 56px - 2 * var(--mantine-spacing-lg))" gap="md">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Ask HR Assistant</Title>
          <Text c="dimmed" size="sm">
            Ask about employees and pay in plain English. Answers use live data from the same lookups as the dashboard, and
            show which lookups they used.
          </Text>
        </div>
        {messages.length > 0 && (
          <Button variant="default" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setMessages([])} disabled={busy}>
            New chat
          </Button>
        )}
      </Group>

      {status.isLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : status.isError ? (
        <Alert color="red" variant="light">
          Could not reach the API to check whether the assistant is available.
        </Alert>
      ) : !enabled ? (
        <DisabledNotice />
      ) : (
        <Card withBorder radius="md" p={0} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <ScrollArea viewportRef={viewport} style={{ flex: 1 }} p="md">
            {messages.length === 0 ? (
              <Stack align="center" gap="md" py="xl">
                <ThemeIcon variant="light" size={48} radius="xl">
                  <IconSparkles size={26} />
                </ThemeIcon>
                <Text fw={600}>What would you like to know?</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%" maw={720}>
                  {EXAMPLES.map((q) => (
                    <UnstyledButton key={q} onClick={() => send(q)} h="100%">
                      <Paper withBorder p="sm" radius="md" className="example-question" h="100%">
                        <Text size="sm">{q}</Text>
                      </Paper>
                    </UnstyledButton>
                  ))}
                </SimpleGrid>
                <Text size="xs" c="dimmed">
                  Model: {status.data?.model}. Read-only: the assistant can&apos;t change salaries.
                </Text>
              </Stack>
            ) : (
              <Stack gap="md">
                {messages.map((m, i) =>
                  m.role === 'user' ? <UserBubble key={i} content={m.content} /> : <AssistantBubble key={i} message={m} onOpenEmployee={openEmployee} />,
                )}
              </Stack>
            )}
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Group p="sm" gap="xs" align="flex-end" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
              <Textarea
                style={{ flex: 1 }}
                placeholder="e.g. What do we pay a Product Manager in Germany?"
                autosize
                minRows={1}
                maxRows={5}
                maxLength={2000}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                aria-label="Your question"
              />
              {busy ? (
                <Tooltip label="Stop">
                  <ActionIcon size="lg" variant="default" onClick={() => abortRef.current?.abort()} aria-label="Stop">
                    <IconPlayerStopFilled size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <ActionIcon size="lg" type="submit" disabled={!input.trim()} aria-label="Send">
                  <IconSend size={16} />
                </ActionIcon>
              )}
            </Group>
          </form>
        </Card>
      )}

      <EmployeeDrawer id={openId} onClose={() => setOpenId(null)} />
    </Stack>
  );
}
