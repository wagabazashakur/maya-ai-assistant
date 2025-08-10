// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';

import * as OI from '../../core/open-interpreter';

describe('open-interpreter wrapper (unit)', () => {
  beforeEach(() => {
    // reset optional local flag
    // @ts-ignore
    delete globalThis.__MAYA_OI_LOCAL__;
  });

  it('runPython returns simulated output in dry-run', async () => {
    const code = 'print(2+2)';
    const res = await OI.runPython(code, { dryRun: true });
    expect(res.kind).toBe('python');
    expect(res.input).toBe(code);
    expect(res.output).toMatch(/Simulated Python execution/);
    expect(res.success).toBe(true);
    expect(res.dryRun).toBe(true);
  });

  it('runShell rejects non-allowlisted command when local agent disabled', async () => {
    const res = await OI.runShell('rm -rf /', { dryRun: true });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/allowlist/);
    expect(res.dryRun).toBe(true);
  });

  it('runShell allows non-allowlisted when local agent enabled (still simulated)', async () => {
    // @ts-ignore
    globalThis.__MAYA_OI_LOCAL__ = true;
    const res = await OI.runShell('npm version', { dryRun: true });
    expect(res.success).toBe(true);
    expect(res.output).toMatch(/local agent/);
  });
});
