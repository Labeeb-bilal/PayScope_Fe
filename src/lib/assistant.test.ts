import { describe, expect, it } from 'vitest';
import { createSseParser, linkEmployeeCodes, toolBadgeLabel } from './assistant';

describe('createSseParser', () => {
  it('parses events split across arbitrary chunk boundaries', () => {
    const stream =
      'event: tool_call\ndata: {"name":"org_summary","args":{},"ok":true}\n\n' +
      'event: text_delta\ndata: {"text":"Hello "}\n\n' +
      'event: text_delta\ndata: {"text":"world"}\n\n' +
      'event: done\ndata: {"answer":"Hello world","toolsUsed":[]}\n\n';
    const parse = createSseParser();
    const events = [];
    for (let i = 0; i < stream.length; i += 7) events.push(...parse(stream.slice(i, i + 7)));
    expect(events).toEqual([
      { type: 'tool_call', name: 'org_summary', args: {}, ok: true },
      { type: 'text_delta', text: 'Hello ' },
      { type: 'text_delta', text: 'world' },
      { type: 'done', answer: 'Hello world', toolsUsed: [] },
    ]);
  });

  it('handles CRLF line endings and skips malformed frames', () => {
    const parse = createSseParser();
    expect(parse('event: text_delta\r\ndata: {"text":"a"}\r\n\r\nevent: text_delta\ndata: {oops\n\nevent: error\ndata: {"code":"LLM_BUSY","message":"busy"}\n\n')).toEqual([
      { type: 'text_delta', text: 'a' },
      { type: 'error', code: 'LLM_BUSY', message: 'busy' },
    ]);
  });

  it('buffers an incomplete event until it is finished', () => {
    const parse = createSseParser();
    expect(parse('event: text_delta\ndata: {"te')).toEqual([]);
    expect(parse('xt":"x"}\n\n')).toEqual([{ type: 'text_delta', text: 'x' }]);
  });
});

describe('toolBadgeLabel', () => {
  it('shows the tool and its argument values', () => {
    expect(toolBadgeLabel({ name: 'pay_benchmark', args: { jobTitle: 'Data Engineer', level: 'L3', country: 'AE' }, ok: true })).toBe(
      'pay_benchmark · Data Engineer · L3 · AE',
    );
    expect(toolBadgeLabel({ name: 'org_summary', args: {}, ok: true })).toBe('org_summary');
    expect(toolBadgeLabel({ name: 'pay_equity', args: { threshold: 0.8, country: undefined }, ok: true })).toBe('pay_equity · 0.8');
  });
});

describe('linkEmployeeCodes', () => {
  it('links bare employee codes', () => {
    expect(linkEmployeeCodes('Priya Sharma (ACME-00003) and ACME-12345.')).toBe(
      'Priya Sharma ([ACME-00003](#employee:ACME-00003)) and [ACME-12345](#employee:ACME-12345).',
    );
  });

  it('links codes inside Markdown tables', () => {
    expect(linkEmployeeCodes('| Name | Code |\n|---|---|\n| Ravi | ACME-00042 |')).toContain('| Ravi | [ACME-00042](#employee:ACME-00042) |');
  });

  it('leaves code spans, code blocks and existing links alone, and is idempotent', () => {
    expect(linkEmployeeCodes('`ACME-00001`')).toBe('`ACME-00001`');
    expect(linkEmployeeCodes('```\nACME-00001\n```')).toBe('```\nACME-00001\n```');
    expect(linkEmployeeCodes('[ACME-00001](#employee:ACME-00001)')).toBe('[ACME-00001](#employee:ACME-00001)');
    const once = linkEmployeeCodes('see ACME-00007');
    expect(linkEmployeeCodes(once)).toBe(once);
  });

  it('ignores things that only look similar', () => {
    expect(linkEmployeeCodes('ACME-123 and ACME-1234567 and XACME-12345')).toBe('ACME-123 and ACME-1234567 and XACME-12345');
  });
});
