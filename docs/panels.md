# Panels Overview

This document shows where results appear in the Secondary Display and how to clear histories.

- Audit History
  - Source: `maya audit` (or Run Audit button)
  - Storage key: `maya_audit_history`
  - Clear: "Clear Audit History" (with confirm)

- Explain History
  - Source: `maya explain <path>`
  - Storage key: `maya_explain_history`
  - Clear: "Clear Explain History"

- Optimize History
  - Source: `maya optimize '<goal>'`
  - Storage key: `maya_optimize_history`
  - Clear: "Clear Optimize History"

- Summarize History
  - Source: `maya summarize [<path>]` or stdin input
  - Storage key: `maya_summarize_history`
  - Clear: "Clear Summarize History"

- Diagnose History
  - Source: `maya diagnose`
  - Storage key: `maya_diagnose_history`
  - Clear: "Clear Diagnose History"

- Suggestions
  - Source: `maya suggest`
  - Storage key: `maya_suggest_history`
  - Clear: "Clear Suggestions"

- Open Interpreter Output
  - Source: `maya run-script`, `maya system-check`
  - Storage key: `maya_oi_history`
  - Clear: "Clear OI History"
