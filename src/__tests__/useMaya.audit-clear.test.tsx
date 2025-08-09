// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Stub CliPanel
vi.mock('../components/CliPanel', () => ({ CliPanel: () => null }));

// Mock gemini helper (not used directly in clear test but kept for consistency)
vi.mock('../core/gemini', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    performSystemAudit: vi.fn(async () => ({
      summary: 'Mocked audit summary',
      findings: [],
    })),
  };
});

// Seeded audit history via memory mock
vi.mock('../core/memory', async (orig) => {
  const actual = await (orig as any)();
  let auditHistoryStore: any[] = [
    { timestamp: '2024-01-01T00:00:00.000Z', report: { summary: 'Seeded audit summary', findings: [{ category: 'security', issue: 'X', suggestion: 'Y' }] } }
  ];
  return {
    ...actual,
    getAuditHistory: () => auditHistoryStore,
    setAuditHistory: (h: any[]) => { auditHistoryStore = h; },
  };
});

// Mock useMaya to immediately show the LogPanel
vi.mock('../hooks/useMaya', async () => {
  const React = await import('react');
  const memory = await import('../core/memory');
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
        runAudit: async () => {},
        clearAuditHistory: () => {
          setAuditHistoryState([]);
          memory.setAuditHistory([]);
        },
      };
    }
  };
});

import { App } from '../components/App';

beforeEach(() => {
  const store: Record<string, string> = {};
  // @ts-ignore
  global.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
  // Ensure onboarding is completed
  global.localStorage.setItem('maya_onboarding_complete', 'true');
  document.body.innerHTML = '<div id="root"></div>';
});

describe('Clear Audit History workflow', () => {
  it('confirms and clears persisted audit entries', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    // Ensure seeded entry is visible by finding the <summary> element specifically
    const summaries = await screen.findAllByText(/Audit History/i);
    const summaryEl = summaries.find((el) => el.tagName.toLowerCase() === 'summary') || summaries[0];
    expect(!!summaryEl).toBe(true);

    const details = summaryEl.closest('details');
    if (details && !details.open) fireEvent.click(summaryEl);

    // Now the seeded summary should be shown
    await screen.findByText(/Seeded audit summary/i);

    // Click Clear and confirm
    const clearBtn = screen.getByRole('button', { name: /clear audit history/i });
    fireEvent.click(clearBtn);
    expect(confirmSpy).toHaveBeenCalled();

    // Expect summary text to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Seeded audit summary/i)).toBeNull();
    });

    confirmSpy.mockRestore();
  });
});
