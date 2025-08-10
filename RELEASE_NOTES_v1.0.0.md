# Release v1.0.0 — Full Maya AI Assistant stable release

## Summary
This release marks the first stable version of the Maya AI Assistant. It includes end-to-end features across Phases 1–6, strict JSON schema enforcement, hardened safety defaults, Multi-LLM support, and a plugin architecture with graceful fallbacks.

## Highlights
- Phases 1–3: Core CLI, histories, and UX
  - Core commands and internal maya subcommands (audit, explain, optimize) with history panels and clear actions
  - Summarize / Diagnose / Suggest flows with dedicated panels and persistence
  - Export/Import of histories with merge/replace modes
  - Panel filters, CLI autocomplete, and UI/UX polish
- Phase 4: Multi-LLM abstraction
  - Provider routing via `src/core/llm.ts` with Gemini (real) and OpenAI (stub)
  - Config-driven selection of provider and model
  - Routing tests ensure behavior under both providers
- Phase 5: Plugin system
  - Extensible plugin registry with safety integration and sensible fallbacks
  - Converted key helpers to plugin form for maintainability
- Phase 6: Continuous learning scaffolding
  - FeedbackEntry and ImprovementPlan types & persistence
  - `generateImprovementPlan` helper and initial flows

## Schema enforcement
- Centralized JSON schemas in `src/core/schemas.ts`
- All JSON-returning helpers in `src/core/gemini.ts` now request `responseMimeType: 'application/json'` with an associated schema
- Parsing via `safelyParseJson` with raw logging on failure

## Safety defaults
- Command classification in `src/core/safety.ts` with safe/risky/destructive tiers
- Internal `maya` subcommands whitelisted as appropriate

## Build and tests
- Tests: green (12 passed | 1 skipped; 21 tests total) including E2E for summarize/diagnose/suggest and UX flows
- Production build succeeds via Vite

## Multi-LLM details
- `getLLM()` selects provider based on persisted config
- JSON/text generation paths with provider-specific handling

## Plugin architecture
- Registry and adapters for extending capabilities
- Safety-aware execution and graceful fallbacks

## Notes
- Env: `.env.local` must include `VITE_GEMINI_API_KEY` for live Gemini
- Browser-only environment; do not use `process.env`

