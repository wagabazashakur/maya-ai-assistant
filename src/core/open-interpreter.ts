import { OIResult } from '../types';

// Safe-by-default Open Interpreter wrapper. In-browser simulation only unless a local agent is explicitly enabled.
// Local agent toggle (optional): window.__MAYA_OI_LOCAL__ === true or globalThis.__MAYA_OI_LOCAL__

const isLocalAgentEnabled = (): boolean => {
  try {
    // In browser
    // @ts-ignore
    if (typeof window !== 'undefined' && window.__MAYA_OI_LOCAL__ === true) return true;
    // In Node / tests
    // @ts-ignore
    if (typeof globalThis !== 'undefined' && (globalThis as any).__MAYA_OI_LOCAL__ === true) return true;
  } catch {}
  return false;
};

const simulatePython = (code: string): string => {
  const lines = code.split(/\r?\n/).length;
  const len = code.length;
  return `Simulated Python execution (dry-run) — ${lines} lines (${len} chars).`;
};

const simulateShell = (cmd: string): string => {
  const safePreview = cmd.slice(0, 120);
  return `Simulated shell execution (dry-run) — command: ${safePreview}${cmd.length > 120 ? '…' : ''}`;
};

export async function runPython(code: string, opts?: { dryRun?: boolean }): Promise<OIResult> {
  const dryRun = opts?.dryRun !== false || !isLocalAgentEnabled();
  if (dryRun) {
    const output = simulatePython(code);
    return { kind: 'python', input: code, output, success: true, dryRun };
  }
  // Local execution path (optional, not implemented here)
  return { kind: 'python', input: code, output: 'Local agent not enabled; executed as dry-run.', success: true, dryRun: true };
}

// Minimal allowlist for demonstration; expand as needed
const SAFE_SHELL_ALLOWLIST = [
  'echo', 'uname', 'date', 'whoami', 'id', 'df', 'uptime', 'cat', 'head', 'tail'
];

const isShellAllowed = (cmd: string): boolean => {
  const first = cmd.trim().split(/\s+|\||&&|\|\|/)[0];
  return SAFE_SHELL_ALLOWLIST.includes(first);
};

export async function runShell(cmd: string, opts?: { dryRun?: boolean }): Promise<OIResult> {
  const local = isLocalAgentEnabled();
  const dryRun = opts?.dryRun !== false || !local;
  if (!isShellAllowed(cmd)) {
    if (!local) {
      return { kind: 'shell', input: cmd, output: '', error: 'Command not in allowlist. Confirmation required for execution.', success: false, dryRun: true };
    }
    // Local agent enabled: permit non-allowlisted commands in Phase 1 but still simulate
    const output = simulateShell(cmd) + ' (local agent)';
    return { kind: 'shell', input: cmd, output, success: true, dryRun };
  }
  if (dryRun) {
    const output = simulateShell(cmd);
    return { kind: 'shell', input: cmd, output, success: true, dryRun };
  }
  // Local execution path (optional, not implemented here)
  return { kind: 'shell', input: cmd, output: 'Local agent not enabled; executed as dry-run.', success: true, dryRun: true };
}
