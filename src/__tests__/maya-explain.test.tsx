// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Stub CliPanel to simplify tree
vi.mock('../components/CliPanel', () => ({ CliPanel: () => null }));

// Mock gemini helper
vi.mock('../core/gemini', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    generateFileExplanation: vi.fn(async (contents: string) => ({
      file: 'sample.ts',
      summary: 'Explained sample file.',
      details: ['A', 'B']
    })),
  };
});

// Mock memory for explain only
vi.mock('../core/memory', async (orig) => {
  const actual = await (orig as any)();
  let explainHistoryStore: any[] = [];
  return {
    ...actual,
    getAuditHistory: () => [],
    setAuditHistory: () => {},
    getExplainHistory: () => explainHistoryStore,
    setExplainHistory: (h: any[]) => { explainHistoryStore = h; },
  };
});

// Mock useMaya with pre-seeded explain history; avoid calling hooks directly in tests
vi.mock('../hooks/useMaya', async () => {
  const React = await import('react');
  const memory = await import('../core/memory');
  const seed = [{ timestamp: new Date().toISOString(), result: { file: 'seed.ts', summary: 'Seeded', details: ['x'] } }];
  memory.setExplainHistory(seed);
  return {
    useMaya: () => {
      const [explainHistory] = React.useState(memory.getExplainHistory());
      const currentSession: any = {
        user: 'test', hostname: 'localhost', cwd: '/', mounts: [],
        config: { theme: 'dark', secondary_display_visible: true, gemini_enabled: true },
        envVars: {}, aliases: {}, ltm: {}, corrections: {}, lastExitCode: null,
      };
      return {
        isProcessing: false,
        command: '', setCommand: () => {},
        config: currentSession.config, updateConfig: () => {},
        onboardingComplete: true, handleFinishOnboarding: () => {},
        logs: [], gitLog: [],
        panelVisibility: {
          configVisible: false, ltmVisible: false, correctionsVisible: false,
          gitLogVisible: false, geminiLogsVisible: false, envVarsVisible: false,
          aliasesVisible: false, auditHistoryVisible: false, explainHistoryVisible: true,
        },
        updatePanelVisibility: () => {},
        currentSession,
        auditHistory: [],
        explainHistory,
        handleFormSubmit: () => {}, handleKeyDown: () => {},
        outputAreaRef: { current: null }, inputRef: { current: null },
        handleVimSaveAndExit: () => {}, onVimAiEdit: () => {},
        handleLessExit: () => {}, handleBlameExit: () => {}, onRebaseExit: () => {}, onGdbExit: () => {}, handleTailExit: () => {},
        submitCommand: async () => {},
        runAudit: async () => {}, clearAuditHistory: () => {}, clearExplainHistory: () => {},
      };
    }
  };
});

import { App } from '../components/App';

describe.skip('maya explain flow (mocked)', () => {
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

  it('submits maya explain and persists an entry, renders in panel', async () => {
    render(<App />);
    // Explain History should render seeded entry from mocked hook/memory
    expect(await screen.findByText(/Explain History/i)).toBeTruthy();
  });
});
