// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react';
import { CliPanel } from '../components/CliPanel';
import { LogPanel } from '../components/LogPanel';

// Basic DOM APIs stubs
beforeEach(() => {
  const store: Record<string, string> = {};
  // @ts-ignore
  global.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  // Stub URL APIs and capture last Blob
  // @ts-ignore
  globalThis.__lastBlob = undefined;
  // @ts-ignore
  globalThis.URL = {
    createObjectURL: vi.fn((blob: Blob) => { (globalThis as any).__lastBlob = blob; return 'blob:mock'; }),
    revokeObjectURL: vi.fn(() => {}),
  } as any;
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const baseSession = (): any => ({
  user: 'tester',
  hostname: 'localhost',
  cwd: '/',
  mounts: [],
  config: { theme: 'dark', secondary_display_visible: true, gemini_enabled: true },
  envVars: {},
  aliases: {},
  ltm: {},
  corrections: {},
  lastExitCode: null,
  // UI state referenced by CliPanel
  isAwaitingPassword: false,
  scriptInputState: null,
  atJobState: null,
  hereDocState: null,
  isChatMode: false,
  isSearching: false,
  searchQuery: '',
  setSearchQuery: () => {},
  searchResult: '',
  promptString: '$ ',
  liveViewCommand: null,
  pendingConfirmation: null,
  vimState: null,
  lessState: null,
  watchState: null,
  watchOutput: '',
  blameState: null,
  rebaseState: null,
  gdbState: null,
  tailState: null,
  tailOutput: '',
  completionCandidates: [],
  isExecutingScript: false,
  systemSummary: null,
  processes: [],
  history: [],
});

const noop = () => {};

describe('Phase 3 UX - Autocomplete in CliPanel', () => {
  it('shows suggestions, navigates, and accepts with Enter to fill the input', () => {
    const session = baseSession();

    const Wrapper: React.FC = () => {
      const [command, setCommand] = React.useState('');
      const [cands, setCands] = React.useState<string[]>([]);
      const [idx, setIdx] = React.useState<number>(-1);
      const provideCompletions = (input: string) => {
        const all = ['maya audit', 'maya explain src/index.ts', 'git status'];
        const filtered = all.filter(c => c.startsWith(input));
        setCands(filtered);
        setIdx(filtered.length > 0 ? 0 : -1);
        return filtered;
      };
      const navigateCompletion = (dir: 'up'|'down') => {
        setIdx(prev => {
          if (cands.length === 0) return -1;
          const next = dir === 'down' ? (prev + 1) % cands.length : (prev - 1 + cands.length) % cands.length;
          return next;
        });
      };
      const acceptCompletion = () => {
        if (idx >= 0 && idx < cands.length) {
          const val = cands[idx];
          setCommand(val);
          setCands([]);
          return val;
        }
      };
      return (
        <CliPanel
          isProcessing={false}
          command={command}
          setCommand={setCommand}
          handleFormSubmit={(e:any)=>e.preventDefault()}
          handleKeyDown={noop}
          outputAreaRef={{ current: null }}
          inputRef={{ current: null }}
          updateConfig={noop}
          onVimExit={noop}
          onLessExit={noop}
          onBlameExit={noop}
          onRebaseExit={noop}
          onGdbExit={noop}
          onTailExit={noop}
          currentSession={session}
          onVimAiEdit={noop}
          provideCompletions={provideCompletions}
          navigateCompletion={navigateCompletion}
          acceptCompletion={acceptCompletion}
          completionCandidates={cands}
          completionIndex={idx}
        />
      );
    };

    render(<Wrapper />);

    const input = screen.getByLabelText('Command Input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ma' } });

    // Two maya* options should appear
    const list = screen.getByRole('listbox');
    let options = within(list).getAllByRole('option');
    expect(options.length).toBe(2);
    expect(options[0].className).toMatch(/completion-item/);
    expect(options[0].className).toMatch(/selected/);

    // Navigate down to second item and re-query
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options[1].className).toMatch(/selected/);

    // Accept with Enter
    fireEvent.keyDown(input, { key: 'Enter' });
    expect((screen.getByLabelText('Command Input') as HTMLInputElement).value).toBe('maya explain src/index.ts');

    // Suggestions should disappear after acceptance
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

type PanelVisibility = {
  configVisible: boolean; ltmVisible: boolean; correctionsVisible: boolean; gitLogVisible: boolean; geminiLogsVisible: boolean; envVarsVisible: boolean; aliasesVisible: boolean;
  auditHistoryVisible: boolean; explainHistoryVisible: boolean; optimizeHistoryVisible: boolean; oiHistoryVisible: boolean; summarizeHistoryVisible?: boolean; diagnoseHistoryVisible?: boolean; suggestHistoryVisible?: boolean;
};

const basePanelVisibility = (): PanelVisibility => ({
  configVisible: false,
  ltmVisible: false,
  correctionsVisible: false,
  gitLogVisible: false,
  geminiLogsVisible: false,
  envVarsVisible: false,
  aliasesVisible: false,
  auditHistoryVisible: true,
  explainHistoryVisible: true,
  optimizeHistoryVisible: true,
  oiHistoryVisible: true,
  summarizeHistoryVisible: true,
  diagnoseHistoryVisible: true,
  suggestHistoryVisible: true,
});

describe('Phase 3 UX - Panel filters in LogPanel', () => {
  it('filters Audit and Explain sections by query and persists filter text', () => {
    const auditHistory = [
      { timestamp: '2025-01-01T00:00:00Z', report: { summary: 'Security OK', findings: [{ issue: 'none' }] } },
      { timestamp: '2025-01-02T00:00:00Z', report: { summary: 'Performance slow', findings: [{ issue: 'cpu' }] } },
    ];
    const explainHistory = [
      { timestamp: '2025-01-03T00:00:00Z', result: { file: 'src/a.ts', summary: 'Core module', details: ['init', 'run'] } },
      { timestamp: '2025-01-04T00:00:00Z', result: { file: 'src/b.ts', summary: 'Helper utils', details: ['sum', 'avg'] } },
    ];

    const { container } = render(
      <LogPanel
        logs={[]}
        gitLog={[]}
        currentSession={baseSession()}
        panelVisibility={basePanelVisibility() as any}
        updatePanelVisibility={() => {}}
        auditHistory={auditHistory as any}
        explainHistory={explainHistory as any}
        optimizeHistory={[] as any}
        oiHistory={[] as any}
        summarizeHistory={[] as any}
        diagnoseHistory={[] as any}
        suggestHistory={[] as any}
      />
    );

    // Filter Audit
    const auditInput = screen.getByLabelText('Filter Audit');
    fireEvent.change(auditInput, { target: { value: 'security' } });

    let auditEntries = container.querySelectorAll('.audit-entry');
    expect(auditEntries.length).toBe(1);
    expect(within(auditEntries[0]).getByText(/Security OK/i)).toBeTruthy();

    // Filter Explain by file path
    const explainInput = screen.getByLabelText('Filter Explain');
    fireEvent.change(explainInput, { target: { value: 'b.ts' } });

    const explainEntries = container.querySelectorAll('.explain-entry');
    expect(explainEntries.length).toBe(1);
    expect(within(explainEntries[0]).getByText(/Helper utils/i)).toBeTruthy();

    // Filters persisted
    const raw = localStorage.getItem('maya_panel_filters');
    expect(raw).not.toBeNull();
    const obj = JSON.parse(raw!);
    expect(obj.audit).toBe('security');
    expect(obj.explain).toBe('b.ts');
  });
});

describe('Phase 3 UX - Export/Import histories in LogPanel', () => {
  it('exports histories payload and imports with merge/replace modes', async () => {
    const auditHistory = [
      { timestamp: '2025-01-01T00:00:00Z', report: { summary: 'Security OK', findings: [] } },
    ];
    const explainHistory = [
      { timestamp: '2025-01-03T00:00:00Z', result: { file: 'src/a.ts', summary: 'Core module', details: [] } },
    ];

    // Mock Blob to capture text parts and provide .text()
    const OriginalBlob = globalThis.Blob;
    class MockBlob {
      parts: any[];
      type?: string;
      constructor(parts: any[], opts?: any) {
        this.parts = parts;
        this.type = opts?.type;
        (globalThis as any).__lastBlobText = parts.map(p => typeof p === 'string' ? p : '').join('');
      }
      async text() { return (globalThis as any).__lastBlobText || ''; }
    }
    // @ts-ignore
    globalThis.Blob = MockBlob as any;

    const { container } = render(
      <LogPanel
        logs={[]}
        gitLog={[]}
        currentSession={baseSession()}
        panelVisibility={basePanelVisibility() as any}
        updatePanelVisibility={() => {}}
        auditHistory={auditHistory as any}
        explainHistory={explainHistory as any}
        optimizeHistory={[] as any}
        oiHistory={[] as any}
        summarizeHistory={[] as any}
        diagnoseHistory={[] as any}
        suggestHistory={[] as any}
      />
    );

    // Export
    const exportBtn = within(container).getByRole('button', { name: /export histories/i });
    fireEvent.click(exportBtn);
    const blob: Blob = (globalThis as any).__lastBlob;
    expect(blob).toBeTruthy();
    const text = await (blob as any).text();
    const payload = JSON.parse(text);
    expect(payload.audit.length).toBe(1);
    expect(payload.explain.length).toBe(1);
    expect(payload.version).toBe(1);

    // Restore Blob
    // @ts-ignore
    globalThis.Blob = OriginalBlob;

    // Prepare localStorage existing state
    localStorage.setItem('maya_audit_history', JSON.stringify(auditHistory));
    localStorage.setItem('maya_explain_history', JSON.stringify(explainHistory));

    // Import (merge)
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const incoming = {
      version: 1,
      exportedAt: new Date().toISOString(),
      audit: [ { timestamp: '2025-02-01T00:00:00Z', report: { summary: 'New audit', findings: [] } } ],
      explain: [ { timestamp: '2025-02-02T00:00:00Z', result: { file: 'src/b.ts', summary: 'New explain', details: [] } } ],
      optimize: [], summarize: [], diagnose: [], suggest: [], oi: []
    };
    vi.spyOn(window, 'confirm').mockReturnValue(true); // OK = merge
    const file = new File([JSON.stringify(incoming)], 'histories.json', { type: 'application/json' });
    (file as any).text = async () => JSON.stringify(incoming);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verify merged (async handler)
    await waitFor(() => {
      const mergedAudit = JSON.parse(localStorage.getItem('maya_audit_history') || '[]');
      const mergedExplain = JSON.parse(localStorage.getItem('maya_explain_history') || '[]');
      expect(mergedAudit.length).toBe(2);
      expect(mergedExplain.length).toBe(2);
    });

    // Import (replace)
    const incoming2 = {
      version: 1,
      exportedAt: new Date().toISOString(),
      audit: [ { timestamp: '2025-03-01T00:00:00Z', report: { summary: 'Replaced audit', findings: [] } } ],
      explain: [ { timestamp: '2025-03-02T00:00:00Z', result: { file: 'src/c.ts', summary: 'Replaced explain', details: [] } } ],
      optimize: [], summarize: [], diagnose: [], suggest: [], oi: []
    };
    const file2 = new File([JSON.stringify(incoming2)], 'histories2.json', { type: 'application/json' });
    (file2 as any).text = async () => JSON.stringify(incoming2);
    ;(window.confirm as any).mockReturnValue(false); // Cancel = replace
    fireEvent.change(fileInput, { target: { files: [file2] } });

    await waitFor(() => {
      const replacedAudit = JSON.parse(localStorage.getItem('maya_audit_history') || '[]');
      const replacedExplain = JSON.parse(localStorage.getItem('maya_explain_history') || '[]');
      expect(replacedAudit.length).toBe(1);
      expect(replacedAudit[0].report.summary).toMatch(/Replaced audit/i);
      expect(replacedExplain.length).toBe(1);
      expect(replacedExplain[0].result.summary).toMatch(/Replaced explain/i);
    });
  });
});
