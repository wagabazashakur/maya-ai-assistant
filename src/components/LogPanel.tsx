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
    runAudit?: () => Promise<any> | void;
    clearAuditHistory?: () => void;
    clearExplainHistory?: () => void;
    clearOptimizeHistory?: () => void;
    clearOIHistory?: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, gitLog, currentSession, panelVisibility, updatePanelVisibility, auditHistory = [], explainHistory: explainHistoryProp, optimizeHistory = [], oiHistory = [], runAudit, clearAuditHistory, clearExplainHistory, clearOptimizeHistory, clearOIHistory }) => {
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

    // Prefer prop for explain history; fall back to localStorage for backward-compat
    let explainHistory: Array<{ timestamp: string; result: { file: string; summary: string; details: string[] } } > = explainHistoryProp || [];
    if (!explainHistoryProp) {
        try {
            const raw = localStorage.getItem('maya_explain_history');
            explainHistory = raw ? JSON.parse(raw) : [];
        } catch {}
    }

    return (
        <div className="panel log-panel">
            <div className="panel-actions" title="Use the CLI command 'maya audit' or click Run Audit to generate a system audit.">
                {runAudit && (
                    <button onClick={() => runAudit()} className="btn" aria-label="Run Audit">Run Audit</button>
                )}
                {clearAuditHistory && (
                    <button onClick={onClearAudit} className="btn btn-danger" aria-label="Clear Audit History">Clear Audit History</button>
                )}
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
                <div className="log-content">
                    {auditHistory.length > 0 ? (
                        auditHistory.slice().reverse().map((entry, idx) => (
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
                <div className="log-content">
                    {explainHistory.length > 0 ? (
                        explainHistory.slice().reverse().map((entry, idx) => (
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
                <div className="log-content">
                    {optimizeHistory.length > 0 ? (
                        optimizeHistory.slice().reverse().map((entry, idx) => (
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
                <div className="log-content">
                    {oiHistory.length > 0 ? (
                        oiHistory.slice().reverse().map((entry, idx) => (
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
        </div>
    );
};