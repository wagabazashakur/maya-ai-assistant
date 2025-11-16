import React from 'react';
import { LogEntry, UserConfiguration, GitLog, LogPanelVisibility, Session } from '../types';

interface LogPanelProps {
    logs: LogEntry[];
    gitLog: GitLog;
    currentSession: Session;
    panelVisibility: LogPanelVisibility;
    updatePanelVisibility: (panel: keyof LogPanelVisibility) => void;
    auditHistory?: { timestamp: string; report: { summary: string; findings: any[] } }[];
    explainHistory?: Array<{ timestamp: string; result: { file: string; summary: string; details: string[] } }>;
    optimizeHistory?: Array<{ timestamp: string; goal: string; plan: { goal: string; steps: string[]; notes?: string } }>;
    oiHistory?: Array<{ timestamp: string; command: string; result: { kind: 'python'|'shell'; input: string; output: string; error?: string; success: boolean; dryRun: boolean } }>;
    summarizeHistory?: Array<{ timestamp: string; result: { file?: string; inputPreview?: string; summary: string; keyPoints: string[] } }>;
    diagnoseHistory?: Array<{ timestamp: string; report: any }>;
    suggestHistory?: Array<{ timestamp: string; suggestions: Array<{ source: string; suggestion: string }> }>;
    runAudit?: () => Promise<any> | void;
    clearAuditHistory?: () => void;
    clearExplainHistory?: () => void;
    clearOptimizeHistory?: () => void;
    clearOIHistory?: () => void;
    clearSummarizeHistory?: () => void;
    clearDiagnoseHistory?: () => void;
    clearSuggestHistory?: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, gitLog, currentSession, panelVisibility, updatePanelVisibility, auditHistory = [], explainHistory: explainHistoryProp, optimizeHistory = [], oiHistory = [], summarizeHistory = [], diagnoseHistory = [], suggestHistory = [], runAudit, clearAuditHistory, clearExplainHistory, clearOptimizeHistory, clearOIHistory, clearSummarizeHistory, clearDiagnoseHistory, clearSuggestHistory }) => {
    const { ltm, corrections, config, aliases, envVars, lastExitCode } = currentSession;
    
    const specialVars = ['PS1', 'PS3', 'PS4', 'OPTIND', 'OPTARG', 'OLDPWD'];
    
    const onClearAudit = () => {
        if (!clearAuditHistory) return;
        if (confirm('Clear all audit history? This cannot be undone.')) {
            clearAuditHistory();
        }
    };

    const onClearExplain = () => {
        if (!clearExplainHistory) return;
        if (confirm('Clear all explain history? This cannot be undone.')) {
            clearExplainHistory();
        }
    };

    const onClearOptimize = () => {
        if (!clearOptimizeHistory) return;
        if (confirm('Clear all optimize history? This cannot be undone.')) {
            clearOptimizeHistory();
        }
    };

    const onClearOI = () => {
        if (!clearOIHistory) return;
        if (confirm('Clear all OI history? This cannot be undone.')) {
            clearOIHistory();
        }
    };

    const onClearSummarize = () => {
        if (!clearSummarizeHistory) return;
        if (confirm('Clear all summarize history? This cannot be undone.')) {
            clearSummarizeHistory();
        }
    };

    const onClearDiagnose = () => {
        if (!clearDiagnoseHistory) return;
        if (confirm('Clear all diagnose history? This cannot be undone.')) {
            clearDiagnoseHistory();
        }
    };

    const onClearSuggest = () => {
        if (!clearSuggestHistory) return;
        if (confirm('Clear all suggestions? This cannot be undone.')) {
            clearSuggestHistory();
        }
    };

    // Prefer prop for explain history; fall back to localStorage for backward-compat
    let explainHistory: Array<{ timestamp: string; result: { file: string; summary: string; details: string[] } } > = explainHistoryProp || [];
    if (!explainHistoryProp) {
        try {
            const raw = localStorage.getItem('maya_explain_history');
            explainHistory = raw ? JSON.parse(raw) : [];
        } catch {}
    }

    // --- Phase 3: in-panel filters and export/import ---
    const [filters, setFilters] = React.useState(() => {
        try {
            const raw = localStorage.getItem('maya_panel_filters');
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    });
    const setFilter = (key: string, value: string) => {
        const next = { ...filters, [key]: value };
        setFilters(next);
        try { localStorage.setItem('maya_panel_filters', JSON.stringify(next)); } catch {}
    };

    const download = (filename: string, text: string) => {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExport = () => {
        try {
            const payload = {
                version: 1,
                exportedAt: new Date().toISOString(),
                audit: auditHistory,
                explain: explainHistory,
                optimize: optimizeHistory,
                summarize: summarizeHistory,
                diagnose: diagnoseHistory,
                suggest: suggestHistory,
                oi: oiHistory,
            };
            download(`maya-histories-${Date.now()}.json`, JSON.stringify(payload, null, 2));
        } catch (e) {
            alert('Failed to export histories');
            console.error(e);
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const handleImportClick = () => fileInputRef.current?.click();
    const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const obj = JSON.parse(text);
            // Simple shape validation
            if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON');
            const confirmReplace = confirm('Import histories? OK = merge, Cancel = replace existing.');
            const mode = confirmReplace ? 'merge' : 'replace';
            // We cannot mutate from here; ask user to paste JSON in CLI if needed. For UI, we emit a custom event the hook can listen to in future.
            // For now, write directly to localStorage keys to keep it simple.
            const safeArr = (v: any) => Array.isArray(v) ? v : [];
            const mergeOrReplace = (key: string, current: any[], incoming: any[]) => {
                const next = mode === 'replace' ? incoming : [...current, ...incoming];
                try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
            };
            mergeOrReplace('maya_audit_history', auditHistory, safeArr(obj.audit));
            mergeOrReplace('maya_explain_history', explainHistory, safeArr(obj.explain));
            mergeOrReplace('maya_optimize_history', optimizeHistory, safeArr(obj.optimize));
            mergeOrReplace('maya_summarize_history', summarizeHistory, safeArr(obj.summarize));
            mergeOrReplace('maya_diagnose_history', diagnoseHistory, safeArr(obj.diagnose));
            mergeOrReplace('maya_suggest_history', suggestHistory, safeArr(obj.suggest));
            mergeOrReplace('maya_oi_history', oiHistory, safeArr(obj.oi));
            alert('Import complete. Reload the page to reflect changes.');
        } catch (err) {
            alert('Failed to import histories: invalid file');
            console.error(err);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const match = (s: string, q: string) => !q || s.toLowerCase().includes(q.toLowerCase());

    const filteredAudit = auditHistory.filter(e => match(e.report.summary, filters.audit || '') || JSON.stringify(e.report.findings).toLowerCase().includes((filters.audit||'').toLowerCase()) || e.timestamp.includes(filters.audit||''));
    const filteredExplain = explainHistory.filter(e => match(e.result.summary, filters.explain||'') || match(e.result.file, filters.explain||'') || e.timestamp.includes(filters.explain||''));
    const filteredOptimize = optimizeHistory.filter(e => match(e.goal, filters.optimize||'') || JSON.stringify(e.plan).toLowerCase().includes((filters.optimize||'').toLowerCase()) || e.timestamp.includes(filters.optimize||''));
    const filteredOI = oiHistory.filter(e => match(e.command, filters.oi||'') || JSON.stringify(e.result).toLowerCase().includes((filters.oi||'').toLowerCase()) || e.timestamp.includes(filters.oi||''));
    const filteredSummarize = summarizeHistory.filter(e => match(e.result.summary, filters.summarize||'') || (e.result.file && match(e.result.file, filters.summarize||'')) || e.timestamp.includes(filters.summarize||''));
    const filteredDiagnose = diagnoseHistory.filter(e => JSON.stringify(e.report).toLowerCase().includes((filters.diagnose||'').toLowerCase()) || e.timestamp.includes(filters.diagnose||''));
    const filteredSuggest = suggestHistory.filter(e => JSON.stringify(e.suggestions).toLowerCase().includes((filters.suggest||'').toLowerCase()) || e.timestamp.includes(filters.suggest||''));

    return (
        <div className="panel log-panel">
            <div className="panel-actions" title="Use the CLI command 'maya audit' or click Run Audit to generate a system audit.">
                {runAudit && (
                    <button onClick={() => runAudit()} className="btn" aria-label="Run Audit">Run Audit</button>
                )}
                {clearAuditHistory && (
                    <button onClick={onClearAudit} className="btn btn-danger" aria-label="Clear Audit History">Clear Audit History</button>
                )}
                <button className="btn" onClick={handleExport} aria-label="Export Histories">Export Histories</button>
                <button className="btn" onClick={handleImportClick} aria-label="Import Histories">Import Histories</button>
                <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportChange} />
            </div>
            <details className="memory-display" open={panelVisibility.configVisible} onToggle={() => updatePanelVisibility('configVisible')}>
                <summary>Configuration</summary>
                <pre>{JSON.stringify(config, null, 2)}</pre>
            </details>
            <details className="memory-display" open={panelVisibility.ltmVisible} onToggle={() => updatePanelVisibility('ltmVisible')}>
                <summary>Long-Term Memory</summary>
                <pre>{Object.keys(ltm).length > 0 ? JSON.stringify(ltm, null, 2) : '{ }'}</pre>
            </details>
            <details className="memory-display" open={panelVisibility.correctionsVisible} onToggle={() => updatePanelVisibility('correctionsVisible')}>
                <summary>Corrections Memory</summary>
                <pre>{Object.keys(corrections).length > 0 ? JSON.stringify(corrections, null, 2) : '{ }'}</pre>
            </details>
             <details className="memory-display" open={panelVisibility.aliasesVisible} onToggle={() => updatePanelVisibility('aliasesVisible')}>
                <summary>Aliases</summary>
                <pre>{Object.keys(aliases).length > 0 ? JSON.stringify(aliases, null, 2) : '{ }'}</pre>
            </details>
            <details className="memory-display" open={panelVisibility.envVarsVisible} onToggle={() => updatePanelVisibility('envVarsVisible')}>
                <summary>Environment Variables</summary>
                <pre>
                    {specialVars.map(key => (
                        envVars[key] ? <div key={key}><strong>{key}</strong>: {Array.isArray(envVars[key]) ? JSON.stringify(envVars[key]) : envVars[key]}</div> : null
                    ))}
                    {Object.entries(envVars).filter(([key]) => !specialVars.includes(key)).map(([key, value]) => (
                        <div key={key}><strong>{key}</strong>: {Array.isArray(value) ? JSON.stringify(value) : value}</div>
                    ))}
                    {lastExitCode !== null && <div><strong>?</strong>: {lastExitCode}</div>}
                </pre>
            </details>
             <details className="memory-display" open={panelVisibility.gitLogVisible} onToggle={() => updatePanelVisibility('gitLogVisible')}>
                <summary>Git Log (Self-Refactor)</summary>
                 <div className="log-content">
                    {gitLog.length > 0 ? (
                        gitLog.map(commit => (
                            <div key={commit.hash} className="git-log-entry">
                                <div className="commit-hash">commit {commit.hash}</div>
                                <div className="commit-details">
                                    Author: {commit.author}<br/>
                                    Date: &nbsp;&nbsp; {new Date(commit.date).toLocaleString()}
                                </div>
                                <div className="commit-message">{commit.message}</div>
                                {commit.filePath && <div className="commit-filepath">path: {commit.filePath}</div>}
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
            <details className="log-display" open={panelVisibility.geminiLogsVisible} onToggle={() => updatePanelVisibility('geminiLogsVisible')}>
                <summary>Secondary Display: Gemini Logs</summary>
                 <div className="log-content">
                    {logs.map(log => (
                        <div key={log.id} className="log-entry">
                            <time>{log.timestamp}</time>
                            <strong>Prompt to Gemini:</strong>
                            <pre>{JSON.stringify(log.prompt, null, 2)}</pre>
                            <strong>Raw Response:</strong>
                            <pre>{log.rawResponse}</pre>
                        </div>
                    ))}
                 </div>
            </details>
            <details className="memory-display" open={panelVisibility.auditHistoryVisible} onToggle={() => updatePanelVisibility('auditHistoryVisible')}>
                <summary>Audit History</summary>
                <input placeholder="Filter audit..." aria-label="Filter Audit" value={filters.audit||''} onChange={e=>setFilter('audit', e.target.value)} />
                <div className="log-content">
                    {filteredAudit.length > 0 ? (
                        filteredAudit.slice().reverse().map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="audit-entry">
                                <div className="audit-meta">
                                    <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                                </div>
                                <div className="audit-summary">
                                    <em>{entry.report.summary}</em>
                                </div>
                                <details>
                                    <summary>Findings ({entry.report.findings.length})</summary>
                                    <pre>{JSON.stringify(entry.report.findings, null, 2)}</pre>
                                </details>
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
            <details className="memory-display" open={panelVisibility.explainHistoryVisible} onToggle={() => updatePanelVisibility('explainHistoryVisible')}>
                <summary>Explain History</summary>
                <div className="panel-actions" style={{ marginBottom: 8 }}>
                    {clearExplainHistory && (
                        <button onClick={onClearExplain} className="btn btn-danger" aria-label="Clear Explain History">Clear Explain History</button>
                    )}
                </div>
                <input placeholder="Filter explain..." aria-label="Filter Explain" value={filters.explain||''} onChange={e=>setFilter('explain', e.target.value)} />
                <div className="log-content">
                    {filteredExplain.length > 0 ? (
                        filteredExplain.slice().reverse().map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="explain-entry">
                                <div className="explain-meta">
                                    <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                                    <span> — {entry.result.file}</span>
                                </div>
                                <div className="explain-summary">
                                    <em>{entry.result.summary}</em>
                                </div>
                                <ul>
                                    {entry.result.details.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
            <details className="memory-display" open={panelVisibility.optimizeHistoryVisible} onToggle={() => updatePanelVisibility('optimizeHistoryVisible')}>
                <summary>Optimize History</summary>
                <div className="panel-actions" style={{ marginBottom: 8 }}>
                    {clearOptimizeHistory && (
                        <button onClick={onClearOptimize} className="btn btn-danger" aria-label="Clear Optimize History">Clear Optimize History</button>
                    )}
                </div>
                <input placeholder="Filter optimize..." aria-label="Filter Optimize" value={filters.optimize||''} onChange={e=>setFilter('optimize', e.target.value)} />
                <div className="log-content">
                    {filteredOptimize.length > 0 ? (
                        filteredOptimize.slice().reverse().map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="optimize-entry">
                                <div className="optimize-meta">
                                    <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                                    <span> — Goal: {entry.goal}</span>
                                </div>
                                <div className="optimize-summary">
                                    <em>{entry.plan.notes || 'Optimization Plan'}</em>
                                </div>
                                <ol>
                                    {entry.plan.steps.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ol>
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
            <details className="memory-display" open={panelVisibility.oiHistoryVisible} onToggle={() => updatePanelVisibility('oiHistoryVisible')}>
                <summary>Open Interpreter Output</summary>
                <div className="panel-actions" style={{ marginBottom: 8 }}>
                    {clearOIHistory && (
                        <button onClick={onClearOI} className="btn btn-danger" aria-label="Clear OI History">Clear OI History</button>
                    )}
                </div>
                <input placeholder="Filter OI..." aria-label="Filter OI" value={filters.oi||''} onChange={e=>setFilter('oi', e.target.value)} />
                <div className="log-content">
                    {filteredOI.length > 0 ? (
                        filteredOI.slice().reverse().map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="oi-entry">
                                <div className="oi-meta">
                                    <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                                    <span> — {entry.result.kind.toUpperCase()}</span>
                                </div>
                                <div className="oi-command"><code>{entry.command}</code></div>
                                {entry.result.error && (
                                    <div className="oi-error"><strong>Error:</strong> {entry.result.error}</div>
                                )}
                                <details>
                                    <summary>Output</summary>
                                    <pre>{entry.result.output}</pre>
                                </details>
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
            <details className="memory-display" open={panelVisibility.summarizeHistoryVisible ?? false} onToggle={() => updatePanelVisibility('summarizeHistoryVisible')}>
                <summary>Summarize History</summary>
                <div className="panel-actions" style={{ marginBottom: 8 }}>
                    {clearSummarizeHistory && (
                        <button onClick={onClearSummarize} className="btn btn-danger" aria-label="Clear Summarize History">Clear Summarize History</button>
                    )}
                </div>
                <input placeholder="Filter summarize..." aria-label="Filter Summarize" value={filters.summarize||''} onChange={e=>setFilter('summarize', e.target.value)} />
                <div className="log-content">
                    {filteredSummarize.length > 0 ? (
                        filteredSummarize.slice().reverse().map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="summarize-entry">
                                <div className="summarize-meta">
                                    <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                                    {entry.result.file && <span> — {entry.result.file}</span>}
                                </div>
                                <div className="summarize-summary">
                                    <em>{entry.result.summary}</em>
                                </div>
                                <ul>
                                    {entry.result.keyPoints.map((p: string, i: number) => (
                                        <li key={i}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
            <details className="memory-display" open={panelVisibility.diagnoseHistoryVisible ?? false} onToggle={() => updatePanelVisibility('diagnoseHistoryVisible')}>
                <summary>Diagnose History</summary>
                <div className="panel-actions" style={{ marginBottom: 8 }}>
                    {clearDiagnoseHistory && (
                        <button onClick={onClearDiagnose} className="btn btn-danger" aria-label="Clear Diagnose History">Clear Diagnose History</button>
                    )}
                </div>
                <input placeholder="Filter diagnose..." aria-label="Filter Diagnose" value={filters.diagnose||''} onChange={e=>setFilter('diagnose', e.target.value)} />
                <div className="log-content">
                    {filteredDiagnose.length > 0 ? (
                        filteredDiagnose.slice().reverse().map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="diagnose-entry">
                                <div className="diagnose-meta">
                                    <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                                </div>
                                <details>
                                    <summary>Report</summary>
                                    <pre>{JSON.stringify(entry.report, null, 2)}</pre>
                                </details>
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
            <details className="memory-display" open={panelVisibility.suggestHistoryVisible ?? false} onToggle={() => updatePanelVisibility('suggestHistoryVisible')}>
                <summary>Suggestions</summary>
                <div className="panel-actions" style={{ marginBottom: 8 }}>
                    {clearSuggestHistory && (
                        <button onClick={onClearSuggest} className="btn btn-danger" aria-label="Clear Suggestions">Clear Suggestions</button>
                    )}
                </div>
                <input placeholder="Filter suggestions..." aria-label="Filter Suggestions" value={filters.suggest||''} onChange={e=>setFilter('suggest', e.target.value)} />
                <div className="log-content">
                    {filteredSuggest.length > 0 ? (
                        filteredSuggest.slice().reverse().map((entry, idx) => (
                            <div key={`${entry.timestamp}-${idx}`} className="suggest-entry">
                                <div className="suggest-meta">
                                    <strong>{new Date(entry.timestamp).toLocaleString()}</strong>
                                </div>
                                <ul>
                                    {entry.suggestions.map((s, i) => (
                                        <li key={i}><strong>[{s.source}]</strong> {s.suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : <pre>{'{ }'}</pre>}
                </div>
            </details>
        </div>
    );
};