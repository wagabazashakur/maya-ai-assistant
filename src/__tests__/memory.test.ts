// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { 
  getAuditHistory, setAuditHistory,
  getUsageLog, setUsageLog
} from '../core/memory';

const withMockStorage = (fn: () => void) => {
  const store: Record<string, string> = {};
  const original = globalThis.localStorage;
  // simple mock
  globalThis.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  } as any;
  try { fn(); } finally {
    globalThis.localStorage = original;
  }
};

describe('memory persistence', () => {
  it('persists and caps audit history', () => withMockStorage(() => {
    const entries = Array.from({ length: 55 }).map((_, i) => ({ timestamp: `t${i}`, report: { summary: `s${i}`, findings: [] } }));
    setAuditHistory(entries as any);
    const loaded = getAuditHistory();
    expect(loaded.length).toBe(50);
    expect(loaded[0].timestamp).toBe('t5');
  }));

  it('usage log persists and caps', () => withMockStorage(() => {
    const logs = Array.from({ length: 250 }).map((_, i) => `cmd-${i}`);
    setUsageLog(logs);
    const loaded = getUsageLog();
    expect(loaded.length).toBe(200);
    expect(loaded[0]).toBe('cmd-50');
  }));
});
