# Copilot Instructions — Maya v.1 (React + Vite + TypeScript)

Big picture
- Stack: React 19 + TypeScript + Vite 6. Build scripts: `npm run dev`, `npm run build`, `npm run preview` (see package.json).
- Env: create `.env.local` with `VITE_GEMINI_API_KEY=...` (used in `src/core/gemini.ts`).
- Architecture: `src/hooks/useMaya.ts` orchestrates a simulated terminal/OS, AI calls, memory, safety checks, and UI state. UI lives in `src/components/*`. Core services in `src/core/*`. Types are centralized in `src/types/index.ts`.

Key modules and contracts
- AI integration (`src/core/gemini.ts`): wraps `@google/genai`. Exposes helpers such as `processWithGemini`, `generatePlan`, `refactorCode`, `performAiEdit(…Selection)`, `generateExplanation`, `generateCommitMessage`, `simulateCurl/Wget`, etc. Many return JSON by requesting `responseMimeType: application/json` with a `Type` schema and are parsed via `safelyParseJson`.
- Memory/persistence (`src/core/memory.ts`): browser `localStorage` keys — LTM, corrections, config, history, git log, env vars, panel visibility, onboarding, aliases, usage log. When adding new persisted state, mirror the get/set pattern and cap list sizes (HISTORY_LIMIT/USAGE_LOG_LIMIT). No IndexedDB/API storage is used.
- Safety (`src/core/safety.ts`): `classifyCommand` returns `safe | risky | destructive`. Add new internal commands to the whitelist; update risky/destructive regexes if needed.
- State hub (`src/hooks/useMaya.ts`): single source of truth for sessions, command submission, live views (vim/less/blame/rebase/gdb/tail), config toggles, and invoking core/gemini utilities. Extend features here and thread state to components.

Command routing in `useMaya`
- Parse input, classify via `classifyCommand`, then route:
  - Internal `maya <subcmd>` handled in dedicated handlers (e.g., `handleMemoryCommand`, etc.). Add new subcommands there and whitelist in `safety.ts` if safe.
  - Built-in skills (ls, cd, vim, git, less, etc.) handled by skill handlers (e.g., `handleSkillCommand`).
  - Unknown or simulated commands may call Gemini tools when `config.gemini_enabled`.
- Live views (vim/less/blame/rebase/gdb/tail) set `currentSession.liveViewCommand` and corresponding state; exit via handlers (`handleLessExit`, `handleBlameExit`, `onRebaseExit`, `onGdbExit`, `handleTailExit`).

Project conventions
- AI JSON: always set `responseMimeType: 'application/json'` and a `Type` schema; parse with `safelyParseJson`, logging raw text on failure.
- Code/text outputs: helpers strip code fences; return raw content only.
- Types first: define new result types in `src/types/index.ts`; plumb them through gemini.ts → useMaya → components.
- Persistence: use getters/setters in `memory.ts` (they cap sizes and handle parse errors). Example: `getUsageLog`/`setUsageLog`, `getLTM`/`setLTM`.
- UI state toggles must persist via `memory.ts` setters so the UI survives reloads.

Common workflows
- Run locally: `npm install` → create `.env.local` with `VITE_GEMINI_API_KEY` → `npm run dev`.
- Build: `npm run build`; Preview: `npm run preview`.
- Debug: prefer early guards (e.g., lazy key read in `gemini.ts`), and console logs in `core/*` and `hooks/*`.

How to extend safely (examples)
- Add a new AI tool: implement in `src/core/gemini.ts` using `responseMimeType: 'application/json'` + schema → add Type in `src/types/index.ts` → call from `useMaya` and wire UI in components.
- Add a new command: update `classifyCommand` (whitelist/regex) → add handler in `useMaya` → persist any state in `memory.ts`.
- Diff-aware edits: use `diff` (`applyPatch`, `createPatch`) for user-visible changes; log to Git panel types.

Design patterns
- React function components with hooks; `useMaya` is the central custom hook for state/orchestration.
- No global Context provider; state is lifted via the `useMaya` return object into `App` and children.
- Keep components “dumb” where possible; pass state/handlers from `useMaya`.

Add a new `maya` subcommand (quick path)
- Files to touch:
  - `src/core/safety.ts`: whitelist `^maya <subcmd>` if safe.
  - `src/types/index.ts`: add types for new tool result if needed.
  - `src/core/gemini.ts`: implement any new AI helper (JSON schema + safelyParseJson).
  - `src/hooks/useMaya.ts`: extend the internal handler (e.g., `handleMemoryCommand`) to handle the subcmd and update state/logs.
  - `src/components/*`: surface UI changes if the command opens a live view or toggles state.
- Example outline (pseudocode):
  - In safety.ts: add to regex in the maya whitelist.
  - In gemini.ts: export `generateFoo(): Promise<Foo | null>` using `responseMimeType: 'application/json'`.
  - In useMaya.ts: inside the maya handler, parse args, call `generateFoo`, persist with `memory.ts` if needed, append output to logs.

Minimal example: add `maya audit`
- Goal: add a safe internal command that produces a system audit report using Gemini and prints it to the terminal.
- Files to touch:
  - `src/core/safety.ts`: ensure `audit` is whitelisted in the maya safe regex (it already is).
  - `src/types/index.ts`: reuse the existing `AuditReport` type.
  - `src/core/gemini.ts`: implement or reuse `performSystemAudit(): Promise<AuditReport | null>` that returns JSON using `responseMimeType: 'application/json'` + schema and `safelyParseJson`.
  - `src/hooks/useMaya.ts`: in the internal maya handler, add a branch for `audit` that calls the Gemini helper and prints results.

Example snippets (illustrative only)
- safety.ts (confirm whitelist)
  - Regex already includes `audit` in the maya whitelist. If missing, add `|audit` to the whitelist group.
- core/gemini.ts
  - Export a helper that requests JSON and parses it:
    ```ts
    export const performSystemAudit = async (): Promise<AuditReport | null> => {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: 'Audit this simulated system and return an AuditReport JSON.' }] }],
          config: { responseMimeType: 'application/json', responseSchema: {/* Type schema for AuditReport */} }
        });
        return safelyParseJson<AuditReport>(res.text, (e) => console.error('Failed to parse AuditReport:', res.text, e));
      } catch (e) { console.error(e); return null; }
    };
    ```
- hooks/useMaya.ts
  - Inside the internal maya command handler, add:
    ```ts
    if (subCmd === 'audit') {
      setIsProcessing(true);
      const report = await performSystemAudit();
      setIsProcessing(false);
      const output = report ? JSON.stringify(report, null, 2) : 'No audit data available.';
      return { stdout: output, stderr: '', success: true };
    }
    ```
- components
  - No UI changes required. Output appears in the CLI panel. Add UI only if creating a dedicated audit view.

Test
- Run `npm run dev`, then in the CLI type: `maya audit`. Expect a JSON report printed in plain text (no markdown).

Notes
- Keep `audit` in the safe path; if you introduce file writes or privileged checks, reassess via `safety.ts`.
- Persist any new toggles/results via `memory.ts` getters/setters if you add audit history.

Gotchas
- Use `import.meta.env.VITE_*` in the browser; do not use `process.env`.
- `gemini.ts` throws lazily if the key is missing; handle errors in callers and surface friendly UI.

Maintenance
- If patterns change or new features land, update this file immediately so AI agents stay aligned.
