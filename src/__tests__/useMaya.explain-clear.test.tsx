// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock window.confirm to auto-confirm
vi.spyOn(window, 'confirm').mockImplementation(() => true);

// Mock gemini (unused here but keep shape)
vi.mock('../core/gemini', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    generateFileExplanation: vi.fn(async () => ({ file: 'f', summary: 'S', details: [] })),
  };
});

// Memory with seeded explain history
vi.mock('../core/memory', async (orig) => {
  const actual = await (orig as any)();
  let explainHistoryStore: any[] = [
    { timestamp: '2024-01-01T00:00:00.000Z', result: { file: 'a.ts', summary: 'old', details: [] } },
  ];
  return {
    ...actual,
    getExplainHistory: () => explainHistoryStore,
    setExplainHistory: (h: any[]) => { explainHistoryStore = h; },
    getAuditHistory: () => [], setAuditHistory: () => {},
  };
});

vi.mock('../hooks/useMaya', async () => {
  const React = await import('react');
  const memory = await import('../core/memory');
  return {
    useMaya: () => {
      const [explainHistory, setExplainHistoryState] = React.useState(memory.getExplainHistory());
      const [panelVisibility] = React.useState({
        configVisible: false, ltmVisible: false, correctionsVisible: false, gitLogVisible: false,
        geminiLogsVisible: false, envVarsVisible: false, aliasesVisible: false,
        auditHistoryVisible: false, explainHistoryVisible: true,
      });
      const currentSession: any = {
        user: 'u', hostname: 'h', cwd: '/', mounts: [],
        config: { theme: 'dark', secondary_display_visible: true, gemini_enabled: true },
        envVars: {}, aliases: {}, ltm: {}, corrections: {}, lastExitCode: null,
        history: [], isAwaitingPassword: false, isSearching: false, searchQuery: '', setSearchQuery: () => {}, searchResult: '', promptString: '$ ', liveViewCommand: null,
      };
      return {
        isProcessing: false,
        command: '', setCommand: () => {},
        config: currentSession.config, updateConfig: () => {},
        onboardingComplete: true, handleFinishOnboarding: () => {},
        logs: [], gitLog: [],
        panelVisibility,
        updatePanelVisibility: () => {},
        currentSession,
        auditHistory: [],
        explainHistory,
        handleFormSubmit: () => {}, handleKeyDown: () => {}, outputAreaRef: { current: null }, inputRef: { current: null },
        handleVimSaveAndExit: () => {}, onVimAiEdit: () => {},
        handleLessExit: () => {}, handleBlameExit: () => {}, onRebaseExit: () => {}, onGdbExit: () => {}, handleTailExit: () => {},
        submitCommand: async () => {},
        runAudit: async () => {}, clearAuditHistory: () => {},
        clearExplainHistory: () => { setExplainHistoryState([]); memory.setExplainHistory([]); },
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
});

describe('Clear Explain History', () => {
  it('clears after confirmation and updates UI', async () => {
    render(<App />);

    // Ensure Explain History section is open; target the summary specifically
    const allExplainTexts = await screen.findAllByText(/Explain History/i);
    const summary = allExplainTexts.find((el) => el.tagName.toLowerCase() === 'summary') || allExplainTexts[0];
    const details = summary.closest('details');
    if (details && !details.open) fireEvent.click(summary);

    // Precondition: seeded item visible
    expect(await screen.findByText(/old/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Clear Explain History/i }));

    await waitFor(() => {
      expect(screen.queryByText(/old/i)).toBeNull();
    });
  });
});
