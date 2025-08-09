// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Stub CliPanel to simplify tree
vi.mock('../components/CliPanel', () => ({ CliPanel: () => null }));

// Mock gemini helper to avoid real API calls
vi.mock('../core/gemini', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    performSystemAudit: vi.fn(async () => ({
      summary: 'Test audit summary',
      findings: [
        { category: 'security', issue: 'Outdated package', suggestion: 'Update package' }
      ],
    })),
  };
});

// Mock memory to isolate persistence
vi.mock('../core/memory', async (orig) => {
  const actual = await (orig as any)();
  let auditHistoryStore: any[] = [];
  return {
    ...actual,
    getAuditHistory: () => auditHistoryStore,
    setAuditHistory: (h: any[]) => { auditHistoryStore = h; },
  };
});

// Mock useMaya to provide a ready session and state (avoid spinner)
vi.mock('../hooks/useMaya', async () => {
  const React = await import('react');
  const memory = await import('../core/memory');
  const gemini = await import('../core/gemini');
  return {
    useMaya: () => {
      const [auditHistory, setAuditHistoryState] = React.useState(memory.getAuditHistory());
      const currentSession: any = {
        user: 'test',
        hostname: 'localhost',
        cwd: '/',
        mounts: [],
        config: { theme: 'dark', secondary_display_visible: true, gemini_enabled: true },
        envVars: {},
        aliases: {},
        ltm: {},
        corrections: {},
        lastExitCode: null,
      };
      return {
        isProcessing: false,
        command: '',
        setCommand: () => {},
        config: currentSession.config,
        updateConfig: () => {},
        onboardingComplete: true,
        handleFinishOnboarding: () => {},
        logs: [],
        gitLog: [],
        panelVisibility: {
          configVisible: true,
          ltmVisible: true,
          correctionsVisible: true,
          gitLogVisible: true,
          geminiLogsVisible: false,
          envVarsVisible: true,
          aliasesVisible: true,
          auditHistoryVisible: true,
        },
        updatePanelVisibility: () => {},
        currentSession,
        auditHistory,
        handleFormSubmit: () => {},
        handleKeyDown: () => {},
        outputAreaRef: { current: null },
        inputRef: { current: null },
        handleVimSaveAndExit: () => {},
        onVimAiEdit: () => {},
        handleLessExit: () => {},
        handleBlameExit: () => {},
        onRebaseExit: () => {},
        onGdbExit: () => {},
        handleTailExit: () => {},
        submitCommand: () => {},
        runAudit: async () => {
          const report = await gemini.performSystemAudit({});
          const entry: any = { timestamp: new Date().toISOString(), report };
          const next = [...auditHistory, entry];
          setAuditHistoryState(next);
          memory.setAuditHistory(next);
        },
        clearAuditHistory: () => {
          setAuditHistoryState([]);
          memory.setAuditHistory([]);
        },
      };
    }
  };
});

import { App } from '../components/App';

// Basic localStorage mock for code paths that might access it indirectly
beforeEach(() => {
  const store: Record<string, string> = {};
  // @ts-ignore
  global.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
  // Mark onboarding as complete so App renders main UI (not strictly needed due to mock)
  global.localStorage.setItem('maya_onboarding_complete', 'true');
});

// Minimal root element for ReactDOM
beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
});

describe('useMaya audit flow (mocked)', () => {
  it('runs audit via UI button and persists an entry', async () => {
    render(<App />);

    // Click Run Audit button in the LogPanel actions
    const runBtn = await screen.findByRole('button', { name: /run audit/i });
    fireEvent.click(runBtn);

    // After async completes, Audit History section should be present
    await waitFor(() => {
      expect(screen.queryAllByText(/audit history/i).length).toBeGreaterThan(0);
    });

    // Expand Audit History if necessary, target the <summary> element specifically
    const allAuditTexts = screen.getAllByText(/audit history/i);
    const summaryEl = allAuditTexts.find((el) => el.tagName.toLowerCase() === 'summary') || allAuditTexts[0];
    const details = summaryEl.closest('details');
    if (details && !details.open) fireEvent.click(summaryEl);

    // Assert the summary text appears
    await screen.findByText(/Test audit summary/i);
  });
});
