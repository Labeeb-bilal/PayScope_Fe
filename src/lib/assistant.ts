import { API_BASE, ApiError } from './api';
import type { AssistantStreamEvent, ChatTurn, ToolUse } from './types';

export function createSseParser() {
  let buffer = '';
  return (chunk: string): AssistantStreamEvent[] => {
    buffer += chunk.replace(/\r\n/g, '\n');
    const events: AssistantStreamEvent[] = [];
    let end: number;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      let type = 'message';
      const data: string[] = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) type = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (!data.length) continue;
      try {
        events.push({ type, ...JSON.parse(data.join('\n')) } as AssistantStreamEvent);
      } catch {
      }
    }
    return events;
  };
}

export async function streamChat(
  messages: ChatTurn[],
  onEvent: (event: AssistantStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error?.message ?? `Request failed (${res.status})`, body?.error?.code);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  const parse = createSseParser();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    parse(value).forEach(onEvent);
  }
}

export function toolBadgeLabel(tool: ToolUse): string {
  const values = Object.values(tool.args)
    .filter((v) => v !== undefined && v !== null && v !== '')
    .map((v) => String(v));
  return [tool.name, ...values].join(' · ');
}

const EMPLOYEE_CODE = /\bACME-\d{5}\b/g;
export const EMPLOYEE_LINK_PREFIX = '#employee:';

export function linkEmployeeCodes(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(EMPLOYEE_CODE, (code, offset: number, whole: string) =>
            whole[offset - 1] === '[' || whole.slice(offset - EMPLOYEE_LINK_PREFIX.length, offset) === EMPLOYEE_LINK_PREFIX
              ? code
              : `[${code}](${EMPLOYEE_LINK_PREFIX}${code})`,
          ),
    )
    .join('');
}
