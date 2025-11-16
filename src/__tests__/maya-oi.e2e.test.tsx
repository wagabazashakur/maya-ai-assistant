// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Keep real CliPanel to drive input events

// Mock open-interpreter: simulate deterministic outputs
vi.mock('../core/open-interpreter', async () => {
  return {
    runPython: vi.fn(async (code: string) => ({ kind: 'python', input: code, output: `Simulated Python execution (dry-run) — 1 lines (${code.length} chars).`, success: true, dryRun: true })),
    runShell: vi.fn(async (cmd: string) => ({ kind: 'shell', input: cmd, output: `Simulated shell execution (dry-run) — command: ${cmd}`, success: true, dryRun: true })),
  };
});

// Memory mock to track oi history persistence
vi.mock('../core/memory', async (orig) => {
  const actual = await (orig as any)();
  let oiStore: any[] = [];
  return {
    ...actual,
    getOIHistory: () => oiStore,
    setOIHistory: (h: any[]) => { oiStore = h; },
    getAuditHistory: () => [],
    setAuditHistory: () => {},
    getExplainHistory: () => [],
    setExplainHistory: () => {},
  };
});

// Provide a thin useMaya mock that wires OI commands
vi.mock('../hooks/useMaya', async () => {
  const React = await import('react');
  const OI = await import('../core/open-interpreter');
  const memory = await import('../core/memory');
  return {
    useMaya: () => {
      const [history, setHistory] = React.useState<any[]>([]);
      const [command, setCommand] = React.useState('');
      const [oiHistory, setOiHistoryState] = React.useState(memory.getOIHistory());
      const [panelVisibility, setPanelVisibility] = React.useState({
        configVisible: false, ltmVisible: false, correctionsVisible: false, gitLogVisible: false,
        geminiLogsVisible: false, envVarsVisible: false, aliasesVisible: false,
        auditHistoryVisible: false, explainHistoryVisible: false, optimizeHistoryVisible: false, oiHistoryVisible: true,
      });
      const currentSession: any = {
        user: 'test', hostname: 'localhost', cwd: '/', mounts: [],
        config: { theme: 'dark', secondary_display_visible: true, gemini_enabled: true },
        envVars: {}, aliases: {}, ltm: {}, corrections: {}, lastExitCode: null,
        history,
        isAwaitingPassword: false,
        isSearching: false,
        searchQuery: '',
        setSearchQuery: () => {},
        searchResult: '',
        promptString: '$ ',
        liveViewCommand: null,
      };
      const handleFormSubmit = async (e: any) => {
        e.preventDefault();
        const cmd = command.trim();
        if (cmd.startsWith('maya run-script')) {
          const code = cmd.slice('maya run-script'.length).trim().replace(/^"|"$/g, '');
          const result = await OI.runPython(code, { dryRun: true });
          const entry: any = { timestamp: new Date().toISOString(), command: cmd, result };
          const next = [...oiHistory, entry];
          setOiHistoryState(next);
          memory.setOIHistory(next);
          setHistory(h => [...h, { id: Date.now(), role: 'user', text: cmd }, { id: Date.now()+1, role: 'model', text: JSON.stringify(result) }]);
          setCommand('');
          return;
        }
        if (cmd.startsWith('maya system-check')) {
          const res = await OI.runShell('uname -a', { dryRun: true });
          const entry: any = { timestamp: new Date().toISOString(), command: 'uname -a', result: res };
          const next = [...oiHistory, entry];
          setOiHistoryState(next);
          memory.setOIHistory(next);
          setHistory(h => [...h, { id: Date.now(), role: 'user', text: cmd }, { id: Date.now()+1, role: 'model', text: JSON.stringify(res) }]);
          setCommand('');
          return;
        }
      };
      return {
        isProcessing: false,
        command,
        setCommand,
        config: currentSession.config,
        updateConfig: () => {},
        onboardingComplete: true,
        handleFinishOnboarding: () => {},
        logs: [], gitLog: [],
        panelVisibility,
        updatePanelVisibility: () => setPanelVisibility(p => ({ ...p, oiHistoryVisible: !p.oiHistoryVisible })),
        currentSession,
        auditHistory: [],
        explainHistory: [],
        optimizeHistory: [],
        oiHistory,
        handleFormSubmit,
        handleKeyDown: () => {},
        outputAreaRef: { current: null },
        inputRef: { current: null },
        handleVimSaveAndExit: () => {}, onVimAiEdit: () => {},
        handleLessExit: () => {}, handleBlameExit: () => {}, onRebaseExit: () => {}, onGdbExit: () => {}, handleTailExit: () => {},
        submitCommand: async (cmd: string) => { setCommand(cmd); await handleFormSubmit({ preventDefault: () => {} }); },
        runAudit: async () => {}, clearAuditHistory: () => {}, clearExplainHistory: () => {}, clearOptimizeHistory: () => {}, clearOIHistory: () => { setOiHistoryState([]); memory.setOIHistory([]); },
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
  global.localStorage.setItem('maya_onboarding_complete', 'true');
  document.body.innerHTML = '<div id="root"></div>';
});

// Confirm dialog not implemented in jsdom; auto-confirm in this suite
vi.spyOn(window, 'confirm').mockImplementation(() => true);

describe('OI E2E via CLI', () => {
  it('maya run-script logs to OI Output panel', async () => {
    render(<App />);

    const allOiTexts = await screen.findAllByText(/Open Interpreter Output/i);
    const summary = allOiTexts.find((el) => el.tagName.toLowerCase() === 'summary') || allOiTexts[0];
    const details = summary.closest('details');
    if (details && !details.open) fireEvent.click(summary);

    // Ensure empty initially
    if (details) {
      const scoped = within(details);
      expect(scoped.queryByText(/Simulated Python execution/)).toBeNull();
    }

    const input = screen.getByLabelText(/Command Input/i);
    fireEvent.change(input, { target: { value: 'maya run-script "print(2+2)"' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      if (!details) throw new Error('OI details not found');
      const scoped = within(details);
      expect(scoped.getByText(/Simulated Python execution/)).toBeTruthy();
    });
  });

  it('maya system-check logs to OI Output panel and Clear removes entries', async () => {
    render(<App />);

    const allOiTexts = await screen.findAllByText(/Open Interpreter Output/i);
    const summary = allOiTexts.find((el) => el.tagName.toLowerCase() === 'summary') || allOiTexts[0];
    const details = summary.closest('details');
    if (details && !details.open) fireEvent.click(summary);

    const input = screen.getByLabelText(/Command Input/i);
    fireEvent.change(input, { target: { value: 'maya system-check' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      if (!details) throw new Error('OI details not found');
      const scoped = within(details);
      expect(scoped.getByText(/Simulated shell execution/)).toBeTruthy();
    });

    // Clear via UI
    const clearBtn = screen.getByRole('button', { name: /Clear OI History/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      if (!details) throw new Error('OI details not found');
      const scoped = within(details);
      expect(scoped.queryByText(/Simulated shell execution/)).toBeNull();
    });
  });
});
