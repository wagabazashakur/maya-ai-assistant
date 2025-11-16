# Architecture (Stub)

The diagram below outlines the primary layers and data flow in the current React + Vite + TypeScript app. Replace the Mermaid code with a rendered PNG/SVG in `docs/images/architecture.png` when ready.

```mermaid
flowchart TD
  subgraph UI[UI Components]
    App[App]
    Cli[CliPanel]
    Log[LogPanel]
    Views[Vim/Less/Blame/Rebase/Gdb/Tail Views]
  end

  subgraph Hook[State Hub]
    useMaya[useMaya Hook]
  end

  subgraph Core[Core Services]
    Gemini[core/gemini.ts]
    Memory[core/memory.ts]
    Safety[core/safety.ts]
    Types[types/index.ts]
  end

  App --> useMaya
  Cli --> useMaya
  Log --> useMaya
  Views --> useMaya

  useMaya <--> Gemini
  useMaya <--> Memory
  useMaya <--> Safety
  useMaya -. types .- Types

  subgraph Persistence[Browser Persistence]
    LS[localStorage]
  end

  Memory <--> LS

  subgraph External[LLM]
    GeminiAPI[@google/genai]
  end

  Gemini <--> GeminiAPI
```

Notes:
- `useMaya` orchestrates command parsing, routing, AI calls, persistence, and live views.
- `gemini.ts` wraps the Gemini API and returns structured JSON using schemas and `safelyParseJson`.
- `memory.ts` persists UI config, history, and audit logs with capped lists.
- `safety.ts` classifies commands (safe/risky/destructive) and whitelists internal `maya` subcommands.
- Components remain “dumb”; they render based on state and handlers from `useMaya`.
- Phase 2 adds panels for Summarize, Diagnose, and Suggestions. See `docs/panels.md` for panel locations and clear actions.
