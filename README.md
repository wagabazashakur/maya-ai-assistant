# Run and deploy your AI Studio app

[![AI Contributor Guidelines](https://img.shields.io/badge/AI%20Contributor-Guidelines-blue)](.github/copilot-instructions.md)

This contains everything you need to run your app locally.

## Getting Started

Prerequisites: Node.js (LTS recommended)

1. Install dependencies
   
   npm install

2. Configure environment
   
   Create a file named `.env.local` in the project root with:
   
   VITE_GEMINI_API_KEY=your_api_key_here

3. Run the dev server
   
   npm run dev

The app will start with Vite and print a local URL to open in your browser.

## Build and Preview

- Build for production
  
  npm run build

- Preview the production build locally
  
  npm run preview

## Scripts

- dev: Start Vite dev server
- build: Build production assets
- preview: Preview the built app locally

## Notes

- Environment variables must use the `VITE_` prefix to be available in the browser. This app reads `import.meta.env.VITE_GEMINI_API_KEY`.
- If the key is missing, Gemini-backed features will log a warning and Gemini calls will throw lazily when invoked.

## Testing

This project uses Vitest + Testing Library with a jsdom environment.

- Run all tests once:
  
  npm run test

- Run tests in watch mode:
  
  npm run test:watch

Mocking highlights:
- Gemini calls are mocked in tests via `vi.mock('../core/gemini')` so no real API access is required.
- Persistence helpers in `src/core/memory.ts` are mocked per test when needed to isolate state.
- LocalStorage is replaced with an in-memory mock during tests.
- Example tests:
  - `src/__tests__/memory.test.ts` verifies capping and persistence for usage and audit histories.
  - `src/__tests__/useMaya.audit.test.tsx` runs the Audit flow end-to-end with mocked Gemini.
  - `src/__tests__/useMaya.audit-clear.test.tsx` confirms Clear Audit History behavior with a confirm dialog.
  - `src/__tests__/maya-explain.e2e.test.tsx` exercises `maya explain <path>` and Explain History panel.
  - `src/__tests__/maya-summarize.e2e.test.tsx` exercises `maya summarize` and Summarize History panel.
  - `src/__tests__/maya-diagnose-suggest.e2e.test.tsx` exercises `maya diagnose` + `maya suggest` and their panels.
  - `src/__tests__/maya-oi.e2e.test.tsx` covers Open Interpreter subcommands and history clearing.

## Feature Roadmap

### Current Features
- CLI `maya audit` command with Gemini API integration
- Audit History panel with localStorage persistence and UI controls
- `maya explain <path>` command with Explain History panel and persistence
- `maya optimize '<goal>'` command with Optimize History
- Open Interpreter Phase 1: `maya run-script` and `maya system-check` with OI Output panel
- Phase 2 commands and panels:
  - `maya summarize` (file or stdin) → Summarize History
  - `maya diagnose` (aggregates audit + explanations) → Diagnose History
  - `maya suggest` (suggestions from history) → Suggestions panel
- Clear buttons for each panel with confirmation
- Comprehensive test coverage with Vitest and mocks

### Next Steps
- Polish docs/screenshots for new panels (Summarize/Diagnose/Suggestions)
- Optional: add more unit tests for history caps and edge cases
- Optional: extend capture script to auto-generate new panel screenshots

### Future Vision
- Plugin architecture for 3rd party integrations
- Support for multiple LLM backends and seamless switching
- Enhanced live views: AI-assisted vim operations, live dashboards, etc.

## Screenshots and Demo GIF

- CLI panel: ![CLI](images/cli.png)
- Audit History panel: ![Audit History](images/audit-history.png)
- Quickstart demo (GIF): ![Quickstart](images/quickstart.gif)

More screenshots coming soon for Summarize, Diagnose, and Suggestions panels.

## Quick Start Video/GIF

A short screencast (~10–20 seconds) showing:

1. Starting the development server (`npm run dev`)
2. Running the command `maya audit` in the CLI
3. Opening the Secondary Display to view the Audit History panel

You can also use the generated GIF: `images/quickstart.gif`.

## Maya CLI Commands

### maya audit
- Runs a system audit via Gemini and prints a JSON report. Results are saved to Audit History.

Example output shape:

```
{
  "summary": "System looks healthy overall",
  "findings": [
    { "category": "security", "issue": "Outdated package", "suggestion": "Update package" }
  ]
}
```

### maya explain <path>

- Safe subcommand that analyzes a file and outputs a JSON explanation. Example output shape:

```
{
  "file": "src/index.ts",
  "summary": "Entry point",
  "details": ["Bootstraps app", "Renders root"]
}
```

- History is saved and visible under the Explain History panel in the Secondary Display.

### maya summarize [<path>] (or via stdin)
- Summarizes a file or pasted text. If no path is provided, paste text and press Enter.
- Results are saved to the Summarize History panel.

Example output shape:

```
{
  "file": "src/core/gemini.ts",
  "summary": "Wraps Gemini client and helpers",
  "keyPoints": [
    "Uses JSON schemas with responseMimeType",
    "Lazy client initialization",
    "Helpers: generateSummary, suggestFromHistory"
  ]
}
```

### maya diagnose
- Produces a diagnostic bundle by running an audit and gathering recent explanations.
- Results are saved to the Diagnose History panel.

Example output shape:

```
{
  "audit": { "summary": "OK", "findings": [] },
  "explanations": [
    { "file": "src/index.tsx", "summary": "Mounts React app", "details": ["Creates root", "Renders <App />"] }
  ],
  "notes": ["No critical issues detected"]
}
```

### maya suggest
- Generates suggestions derived from audit/explain/optimize/summarize/diagnose histories.
- Results appear in the Suggestions panel.

Example output shape:

```
[
  { "source": "audit", "suggestion": "Upgrade vulnerable dependency" },
  { "source": "summarize", "suggestion": "Document gemini.ts helper contracts in README" }
]
```

## UX Improvements

- CLI Autocomplete
  - Suggestions from built-ins, aliases, and recent command history.
  - Keyboard navigation: ArrowUp/ArrowDown to navigate, Enter to accept.
  - Appears above the input as you type.

- Panel Search/Filter
  - Each history panel includes a filter input to search by summary, file, contents, or timestamp.
  - Filters persist between reloads.

- Export/Import Histories
  - Export all histories to a single JSON via the "Export Histories" button.
  - Import from a JSON file via the "Import Histories" button (merge or replace).
  - Useful for sharing or backing up sessions.

## FAQ / Troubleshooting

**Q:** I get an error about missing `VITE_GEMINI_API_KEY`  
**A:** Create a `.env.local` file with your Gemini API key:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

- "process.env not found": use `import.meta.env.VITE_*` in browser code.
- "Tests fail to find vitest/jsdom": run `npm install`; use `npm run test`.
- "Simulated outputs look odd": ensure `config.gemini_enabled` is true; retry.

## Architecture Diagram (TODO)
- Mermaid stub: see `docs/architecture.md`.
- Diagram image: ![Architecture](docs/images/architecture.png)

## AI Contributor Guidance

See `.github/copilot-instructions.md` for architecture, conventions, command routing, and how to add new `maya` subcommands (with a working `maya audit` example). The file is the source of truth for AI coding agents and should be kept up to date.

## Open Interpreter Commands

Phase 1 introduces safe-by-default Open Interpreter helpers. Execution is simulated in-browser (dry-run) unless an optional local agent is enabled.

- Example: run a small Python snippet
  
  maya run-script "print(1+1)"

  Output is simulated and also saved under the "Open Interpreter Output" panel.

- Example: system diagnostics bundle (safe allowlisted commands)
  
  maya system-check

  Runs a few diagnostic commands (uname, date, whoami, id, df, uptime) in dry-run and logs results to the OI panel.

Notes
- Default is dry-run. To opt-in to a local agent in advanced setups, set a global flag in the browser console before issuing commands:
  
  window.__MAYA_OI_LOCAL__ = true

  In tests/Node you can set globalThis.__MAYA_OI_LOCAL__ = true.
- Current safe shell allowlist used for Phase 1 (subject to change):
  
  echo, uname, date, whoami, id, df, uptime, cat, head, tail

- You can clear the saved entries via the "Clear OI History" button in the panel.

## Multi-LLM Support (Phase 4)

Maya now supports pluggable LLM providers via a new core abstraction:

- Core: `src/core/llm.ts` exposes `getLLM()` with a provider implementing:
  - `generateContentJSON({ prompt, schema, model? })`
  - `generateText({ prompt, model? })`
- Providers:
  - Gemini (default): uses `@google/genai` and your `VITE_GEMINI_API_KEY`.
  - OpenAI (stub): returns placeholder responses for now; swap in real SDK later.

Configuration (persisted):
- In-app config now includes:
  - `llm_provider`: `'gemini' | 'openai'` (default `'gemini'`).
  - `llm_model`: string (defaults to `'gemini-2.5-flash'` or `'gpt-4o-mini'` per provider).

Switching providers:
- Update the config (via future UI/CLI toggle) to set `llm_provider` and optional `llm_model`.
- All existing helpers in `src/core/gemini.ts` automatically route through the active provider while keeping JSON schema contracts and safety patterns intact.

Testing:
- Unit test `src/__tests__/llm-routing.test.ts` validates provider selection and stub behavior.
- Existing tests mocking `../core/gemini` continue to work unchanged.
