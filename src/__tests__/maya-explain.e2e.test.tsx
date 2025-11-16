// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Keep real CliPanel to drive input events

// Mock gemini: file explanation
vi.mock('../core/gemini', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    generateFileExplanation: vi.fn(async (content: string) => ({
      file: 'src/index.ts',
      summary: 'Explained via mock',
      details: ['One', 'Two']
    })),
  };
});

// Memory mock to track explain history persistence
vi.mock('../core/memory', async (orig) => {
  const actual = await (orig as any)();
  let explainHistoryStore: any[] = [];
  return {
    ...actual,
    getExplainHistory: () => explainHistoryStore,
    setExplainHistory: (h: any[]) => { explainHistoryStore = h; },
    getAuditHistory: () => [],
    setAuditHistory: () => {},
  };
});

// Provide a thin useMaya that wires CLI to internal command handler in a minimal way
vi.mock('../hooks/useMaya', async () => {
  const React = await import('react');
  const gemini = await import('../core/gemini');
  const memory = await import('../core/memory');
  return {
    useMaya: () => {
      const [history, setHistory] = React.useState<any[]>([]);
      const [command, setCommand] = React.useState('');
      const [explainHistory, setExplainHistoryState] = React.useState(memory.getExplainHistory());
      const [panelVisibility, setPanelVisibility] = React.useState({
        configVisible: false, ltmVisible: false, correctionsVisible: false, gitLogVisible: false,
        geminiLogsVisible: false, envVarsVisible: false, aliasesVisible: false,
        auditHistoryVisible: false, explainHistoryVisible: true,
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
        if (cmd.startsWith('maya explain')) {
          const result = await gemini.generateFileExplanation('// code');
          const entry: any = { timestamp: new Date().toISOString(), result };
          const next = [...explainHistory, entry];
          setExplainHistoryState(next);
          memory.setExplainHistory(next);
          setHistory(h => [...h, { id: Date.now(), role: 'user', text: cmd }, { id: Date.now()+1, role: 'model', text: JSON.stringify(result) }]);
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
        updatePanelVisibility: () => setPanelVisibility(p => ({ ...p, explainHistoryVisible: !p.explainHistoryVisible })),
        currentSession,
        auditHistory: [],
        explainHistory,
        handleFormSubmit,
        handleKeyDown: () => {},
        outputAreaRef: { current: null },
        inputRef: { current: null },
        handleVimSaveAndExit: () => {}, onVimAiEdit: () => {},
        handleLessExit: () => {}, handleBlameExit: () => {}, onRebaseExit: () => {}, onGdbExit: () => {}, handleTailExit: () => {},
        submitCommand: async (cmd: string) => { setCommand(cmd); await handleFormSubmit({ preventDefault: () => {} }); },
        runAudit: async () => {}, clearAuditHistory: () => {}, clearExplainHistory: () => { setExplainHistoryState([]); memory.setExplainHistory([]); },
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

describe('maya explain E2E via CLI', () => {
  it('accepts CLI input and updates Explain History panel', async () => {
    render(<App />);

    // open Explain History panel if needed (target the summary specifically)
    const allExplainTexts = await screen.findAllByText(/Explain History/i);
    const summary = allExplainTexts.find((el) => el.tagName.toLowerCase() === 'summary') || allExplainTexts[0];
    const details = summary.closest('details');
    if (details && !details.open) fireEvent.click(summary);

    // Initially nothing in the Explain History panel
    if (details) {
      const scoped = within(details);
      expect(scoped.queryByText(/Explained via mock/i)).toBeNull();
    }

    // Send command via input
    const input = screen.getByLabelText(/Command Input/i);
    fireEvent.change(input, { target: { value: 'maya explain src/index.ts' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      if (!details) throw new Error('Explain History details not found');
      const scoped = within(details);
      expect(scoped.getByText(/Explained via mock/i)).toBeTruthy();
    });
  });
});
