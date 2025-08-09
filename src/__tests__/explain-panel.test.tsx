// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LogPanel } from '../components/LogPanel';

beforeEach(() => {
  const store: Record<string, string> = {};
  // @ts-ignore
  global.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };

  // Seed explain history
  const seed = [
    {
      timestamp: '2024-01-01T12:00:00.000Z',
      result: {
        file: 'src/index.ts',
        summary: 'Entry point that mounts a React app.',
        details: [
          'Imports React and App component',
          'Creates a root element',
          'Renders App into #root'
        ]
      }
    },
    {
      timestamp: '2024-01-02T08:30:00.000Z',
      result: {
        file: 'src/utils/helpers.ts',
        summary: 'Utility helpers for string formatting.',
        details: [
          'formatDate converts Date to YYYY-MM-DD',
          'capitalize capitalizes first letter'
        ]
      }
    }
  ];
  localStorage.setItem('maya_explain_history', JSON.stringify(seed));
});

describe('LogPanel Explain History rendering', () => {
  it('renders Explain History items from localStorage when panel is visible', () => {
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

    render(
      <LogPanel
        logs={[]}
        gitLog={[]}
        currentSession={currentSession}
        panelVisibility={{
          configVisible: false,
          ltmVisible: false,
          correctionsVisible: false,
          gitLogVisible: false,
          geminiLogsVisible: false,
          envVarsVisible: false,
          aliasesVisible: false,
          auditHistoryVisible: false,
          explainHistoryVisible: true,
        }}
        updatePanelVisibility={() => {}}
        auditHistory={[]}
      />
    );

    // Expand the Explain History section if needed
    const summary = screen.getByText(/explain history/i);
    const details = summary.closest('details');
    if (details && !details.open) fireEvent.click(summary);

    // Assert items are present
    expect(screen.getByText(/Entry point that mounts a React app./i)).toBeTruthy();
    expect(screen.getByText(/Utility helpers for string formatting./i)).toBeTruthy();
    expect(screen.getByText(/src\/index.ts/i)).toBeTruthy();
    expect(screen.getByText(/src\/utils\/helpers.ts/i)).toBeTruthy();
  });
});
