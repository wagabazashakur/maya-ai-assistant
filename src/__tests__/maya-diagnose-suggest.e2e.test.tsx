// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Keep real CliPanel to drive input events

// Mock gemini: audit + suggestions
vi.mock('../core/gemini', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    performSystemAudit: vi.fn(async () => ({
      summary: 'Audit OK',
      findings: [],
    })),
    suggestFromHistory: vi.fn(async (history: any) => ([
      { source: 'audit', suggestion: 'Run security updates' },
      { source: 'summarize', suggestion: 'Document architecture overview' },
    ])),
  };
});

// Memory mock to track histories persistence
vi.mock('../core/memory', async (orig) => {
  const actual = await (orig as any)();
  let diagnoseHistoryStore: any[] = [];
  let suggestHistoryStore: any[] = [];
  let explainHistoryStore: any[] = [
    { timestamp: new Date().toISOString(), result: { file: 'src/main.ts', summary: 'Explained', details: ['d1'] } }
  ];
  let summarizeHistoryStore: any[] = [
    { timestamp: new Date().toISOString(), result: { file: 'README.md', summary: 'Summarized', keyPoints: ['k1'] } }
  ];
  return {
    ...actual,
    getDiagnoseHistory: () => diagnoseHistoryStore,
    setDiagnoseHistory: (h: any[]) => { diagnoseHistoryStore = h; },
    getSuggestHistory: () => suggestHistoryStore,
    setSuggestHistory: (h: any[]) => { suggestHistoryStore = h; },
    getExplainHistory: () => explainHistoryStore,
    setExplainHistory: (h: any[]) => { explainHistoryStore = h; },
    getSummarizeHistory: () => summarizeHistoryStore,
    setSummarizeHistory: (h: any[]) => { summarizeHistoryStore = h; },
  };
});

// Provide a thin useMaya that wires CLI for diagnose and suggest
vi.mock('../hooks/useMaya', async () => {
  const React = await import('react');
  const gemini = await import('../core/gemini');
  const memory = await import('../core/memory');
  return {
    useMaya: () => {
      const [history, setHistory] = React.useState<any[]>([]);
      const [command, setCommand] = React.useState('');
      const [diagnoseHistory, setDiagnoseHistoryState] = React.useState(memory.getDiagnoseHistory());
      const [suggestHistory, setSuggestHistoryState] = React.useState(memory.getSuggestHistory());
      const [explainHistory] = React.useState(memory.getExplainHistory());
      const [summarizeHistory] = React.useState(memory.getSummarizeHistory());
      const [panelVisibility, setPanelVisibility] = React.useState({
        configVisible: false, ltmVisible: false, correctionsVisible: false, gitLogVisible: false,
        geminiLogsVisible: false, envVarsVisible: false, aliasesVisible: false,
        auditHistoryVisible: false, explainHistoryVisible: false, optimizeHistoryVisible: false, oiHistoryVisible: false,
        summarizeHistoryVisible: false, diagnoseHistoryVisible: true, suggestHistoryVisible: true,
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
        if (cmd === 'maya diagnose') {
          const audit = await gemini.performSystemAudit({});
          const report = { audit: audit || { summary: 'No audit', findings: [] }, explanations: memory.getExplainHistory().map((e: any) => e.result) };
          const entry: any = { timestamp: new Date().toISOString(), report };
          const next = [...diagnoseHistory, entry];
          setDiagnoseHistoryState(next);
          memory.setDiagnoseHistory(next);
          setHistory(h => [...h, { id: Date.now(), role: 'user', text: cmd }, { id: Date.now()+1, role: 'model', text: JSON.stringify(report) }]);
          setCommand('');
          return;
        }
        if (cmd === 'maya suggest') {
          const suggestions = await gemini.suggestFromHistory({
            audit: [],
            explain: memory.getExplainHistory(),
            summarize: memory.getSummarizeHistory(),
            diagnose: memory.getDiagnoseHistory(),
          });
          const entry: any = { timestamp: new Date().toISOString(), suggestions };
          const next = [...suggestHistory, entry];
          setSuggestHistoryState(next);
          memory.setSuggestHistory(next);
          setHistory(h => [...h, { id: Date.now(), role: 'user', text: cmd }, { id: Date.now()+1, role: 'model', text: JSON.stringify(suggestions) }]);
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
        updatePanelVisibility: () => setPanelVisibility(p => ({ ...p, diagnoseHistoryVisible: !p.diagnoseHistoryVisible })),
        currentSession,
        auditHistory: [],
        explainHistory,
        summarizeHistory,
        diagnoseHistory,
        suggestHistory,
        handleFormSubmit,
        handleKeyDown: () => {},
        outputAreaRef: { current: null },
        inputRef: { current: null },
        handleVimSaveAndExit: () => {}, onVimAiEdit: () => {},
        handleLessExit: () => {}, handleBlameExit: () => {}, onRebaseExit: () => {}, onGdbExit: () => {}, handleTailExit: () => {},
        submitCommand: async (cmd: string) => { setCommand(cmd); await handleFormSubmit({ preventDefault: () => {} }); },
        runAudit: async () => {}, clearAuditHistory: () => {}, clearExplainHistory: () => {}, clearOptimizeHistory: () => {}, clearOIHistory: () => {},
        clearDiagnoseHistory: () => { setDiagnoseHistoryState([]); memory.setDiagnoseHistory([]); },
        clearSuggestHistory: () => { setSuggestHistoryState([]); memory.setSuggestHistory([]); },
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
  // jsdom confirm stub
  // @ts-ignore
  global.confirm = () => true;
});

describe('maya diagnose/suggest E2E via CLI', () => {
  it('diagnose writes report to history panel and suggest lists suggestions', async () => {
    render(<App />);

    // Run diagnose
    const input = screen.getByLabelText(/Command Input/i);
    fireEvent.change(input, { target: { value: 'maya diagnose' } });
    fireEvent.submit(input.closest('form')!);

    // Open Diagnose panel
    const diagHeaders = await screen.findAllByText(/Diagnose History/i);
    const diagSummary = diagHeaders.find((el) => el.tagName.toLowerCase() === 'summary') || diagHeaders[0];
    const diagDetails = diagSummary.closest('details');
    if (diagDetails && !diagDetails.open) fireEvent.click(diagSummary);

    await waitFor(() => {
      if (!diagDetails) throw new Error('Diagnose details not found');
      const scoped = within(diagDetails);
      expect(scoped.getByText(/Audit OK/i)).toBeTruthy();
    });

    // Run suggest and open Suggestions panel
    fireEvent.change(input, { target: { value: 'maya suggest' } });
    fireEvent.submit(input.closest('form')!);

    const suggHeaders = await screen.findAllByText(/Suggestions/i);
    const suggSummary = suggHeaders.find((el) => el.tagName.toLowerCase() === 'summary') || suggHeaders[0];
    const suggDetails = suggSummary.closest('details');
    if (suggDetails && !suggDetails.open) fireEvent.click(suggSummary);

    await waitFor(() => {
      if (!suggDetails) throw new Error('Suggestions details not found');
      const scoped = within(suggDetails);
      expect(scoped.getByText(/Run security updates/i)).toBeTruthy();
      expect(scoped.getByText(/Document architecture overview/i)).toBeTruthy();
    });
  });

  it('Clear buttons clear diagnose and suggest histories', async () => {
    render(<App />);

    // Add entries
    const input = screen.getByLabelText(/Command Input/i);
    fireEvent.change(input, { target: { value: 'maya diagnose' } });
    fireEvent.submit(input.closest('form')!);
    fireEvent.change(input, { target: { value: 'maya suggest' } });
    fireEvent.submit(input.closest('form')!);

    // Open panels
    const diagSummary = (await screen.findAllByText(/Diagnose History/i)).find((el) => el.tagName.toLowerCase() === 'summary')!;
    const diagDetails = diagSummary.closest('details')!; if (!diagDetails.open) fireEvent.click(diagSummary);
    const suggSummary = (await screen.findAllByText(/Suggestions/i)).find((el) => el.tagName.toLowerCase() === 'summary')!;
    const suggDetails = suggSummary.closest('details')!; if (!suggDetails.open) fireEvent.click(suggSummary);

    // Click Clear buttons
    fireEvent.click(screen.getByRole('button', { name: /Clear Diagnose History/i }));
    fireEvent.click(screen.getByRole('button', { name: /Clear Suggestions/i }));

    await waitFor(() => {
      const diagScoped = within(diagDetails);
      const suggScoped = within(suggDetails);
      expect(diagScoped.queryByText(/Audit OK/i)).toBeNull();
      expect(suggScoped.queryByText(/Run security updates/i)).toBeNull();
    });
  });
});
