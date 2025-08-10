import { LongTermMemory, CorrectionMemory, UserConfiguration, GitLog, LogPanelVisibility, Aliases } from '../types';

const LTM_KEY = 'maya_ltm';
const CORRECTIONS_KEY = 'maya_corrections';
const CONFIG_KEY = 'maya_config';
const HISTORY_KEY = 'maya_history';
const GIT_LOG_KEY = 'maya_git_log';
const ENV_VARS_KEY = 'maya_env_vars';
const PANEL_VISIBILITY_KEY = 'maya_panel_visibility';
const ONBOARDING_KEY = 'maya_onboarding_complete';
const ALIASES_KEY = 'maya_aliases';
const HISTORY_LIMIT = 500;
const USAGE_LOG_KEY = 'maya_usage_log';
const USAGE_LOG_LIMIT = 200;
const AUDIT_HISTORY_KEY = 'maya_audit_history';
const AUDIT_HISTORY_LIMIT = 50;
const EXPLAIN_HISTORY_KEY = 'maya_explain_history';
const EXPLAIN_HISTORY_LIMIT = 50;
const OPTIMIZE_HISTORY_KEY = 'maya_optimize_history';
const OPTIMIZE_HISTORY_LIMIT = 50;
const OI_HISTORY_KEY = 'maya_oi_history';
const OI_HISTORY_LIMIT = 50;
// --- Phase 2 keys ---
const SUMMARIZE_HISTORY_KEY = 'maya_summarize_history';
const SUMMARIZE_HISTORY_LIMIT = 50;
const DIAGNOSE_HISTORY_KEY = 'maya_diagnose_history';
const DIAGNOSE_HISTORY_LIMIT = 50;
const SUGGEST_HISTORY_KEY = 'maya_suggest_history';
const SUGGEST_HISTORY_LIMIT = 100;
// --- Phase 3: panel filters ---
const PANEL_FILTERS_KEY = 'maya_panel_filters';

export const getUsageLog = (): string[] => {
    try {
        const stored = localStorage.getItem(USAGE_LOG_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse Usage Log from localStorage:", error);
        return [];
    }
};

export const setUsageLog = (log: string[]) => {
    try {
        const cappedLog = log.slice(-USAGE_LOG_LIMIT);
        localStorage.setItem(USAGE_LOG_KEY, JSON.stringify(cappedLog));
    } catch (error) {
        console.error("Failed to save Usage Log to localStorage:", error);
    }
};

export const getLTM = (): LongTermMemory => {
    try {
        const stored = localStorage.getItem(LTM_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to parse LTM from localStorage:", error);
        return {};
    }
};

export const setLTM = (memory: LongTermMemory) => {
    try {
        localStorage.setItem(LTM_KEY, JSON.stringify(memory));
    } catch (error) {
        console.error("Failed to save LTM to localStorage:", error);
    }
};

export const getCorrections = (): CorrectionMemory => {
    try {
        const stored = localStorage.getItem(CORRECTIONS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to parse Corrections from localStorage:", error);
        return {};
    }
};

export const setCorrections = (corrections: CorrectionMemory) => {
    try {
        localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(corrections));
    } catch (error) {
        console.error("Failed to save Corrections to localStorage:", error);
    }
};

export const getConfig = (): Partial<UserConfiguration> => {
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to parse Config from localStorage:", error);
        return {};
    }
};

export const setConfig = (config: UserConfiguration) => {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Failed to save Config to localStorage:", error);
    }
};

export const getPersistedHistory = (): string[] => {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse History from localStorage:", error);
        return [];
    }
};

export const savePersistedHistory = (history: string[]) => {
    try {
        const cappedHistory = history.slice(-HISTORY_LIMIT);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(cappedHistory));
    } catch (error) {
        console.error("Failed to save History to localStorage:", error);
    }
};

export const getGitLog = (): GitLog => {
    try {
        const stored = localStorage.getItem(GIT_LOG_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse Git Log from localStorage:", error);
        return [];
    }
};

export const setGitLog = (log: GitLog) => {
    try {
        localStorage.setItem(GIT_LOG_KEY, JSON.stringify(log));
    } catch (error) {
        console.error("Failed to save Git Log to localStorage:", error);
    }
};

export const getEnvVars = (): { [key: string]: string } => {
    try {
        const stored = localStorage.getItem(ENV_VARS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to parse Env Vars from localStorage:", error);
        return {};
    }
};

export const setEnvVars = (vars: { [key: string]: string }) => {
    try {
        localStorage.setItem(ENV_VARS_KEY, JSON.stringify(vars));
    } catch (error) {
        console.error("Failed to save Env Vars to localStorage:", error);
    }
};

export const getPanelVisibility = (): Partial<LogPanelVisibility> => {
    try {
        const stored = localStorage.getItem(PANEL_VISIBILITY_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to parse Panel Visibility from localStorage:", error);
        return {};
    }
};

export const setPanelVisibility = (visibility: LogPanelVisibility) => {
    try {
        localStorage.setItem(PANEL_VISIBILITY_KEY, JSON.stringify(visibility));
    } catch (error) {
        console.error("Failed to save Panel Visibility to localStorage:", error);
    }
};

export const getOnboardingComplete = (): boolean => {
    try {
        return localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch (error) {
        console.error("Failed to get onboarding status from localStorage:", error);
        return false;
    }
};

export const setOnboardingComplete = () => {
    try {
        localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
        console.error("Failed to set onboarding status in localStorage:", error);
    }
};

export const getAliases = (): Aliases => {
    try {
        const stored = localStorage.getItem(ALIASES_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to parse Aliases from localStorage:", error);
        return {};
    }
};

export const setAliases = (aliases: Aliases) => {
    try {
        localStorage.setItem(ALIASES_KEY, JSON.stringify(aliases));
    } catch (error) {
        console.error("Failed to save Aliases to localStorage:", error);
    }
};

export const getAuditHistory = (): any[] => {
    try {
        const stored = localStorage.getItem(AUDIT_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse Audit History from localStorage:", error);
        return [];
    }
};

export const setAuditHistory = (history: any[]) => {
    try {
        const capped = history.slice(-AUDIT_HISTORY_LIMIT);
        localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error("Failed to save Audit History to localStorage:", error);
    }
};

export const getExplainHistory = (): any[] => {
    try {
        const stored = localStorage.getItem(EXPLAIN_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse Explain History from localStorage:", error);
        return [];
    }
};

export const setExplainHistory = (history: any[]) => {
    try {
        const capped = history.slice(-EXPLAIN_HISTORY_LIMIT);
        localStorage.setItem(EXPLAIN_HISTORY_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error("Failed to save Explain History to localStorage:", error);
    }
};

export const getOptimizeHistory = (): any[] => {
    try {
        const stored = localStorage.getItem(OPTIMIZE_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse Optimize History from localStorage:", error);
        return [];
    }
};

export const setOptimizeHistory = (history: any[]) => {
    try {
        const capped = history.slice(-OPTIMIZE_HISTORY_LIMIT);
        localStorage.setItem(OPTIMIZE_HISTORY_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error("Failed to save Optimize History to localStorage:", error);
    }
};

export const getOIHistory = (): any[] => {
    try {
        const stored = localStorage.getItem(OI_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse OI History from localStorage:", error);
        return [];
    }
};

export const setOIHistory = (history: any[]) => {
    try {
        const capped = history.slice(-OI_HISTORY_LIMIT);
        localStorage.setItem(OI_HISTORY_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error("Failed to save OI History to localStorage:", error);
    }
};

// --- Phase 2: summarize history ---
export const getSummarizeHistory = (): any[] => {
    try {
        const stored = localStorage.getItem(SUMMARIZE_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to parse Summarize History from localStorage:', error);
        return [];
    }
};

export const setSummarizeHistory = (history: any[]) => {
    try {
        const capped = history.slice(-SUMMARIZE_HISTORY_LIMIT);
        localStorage.setItem(SUMMARIZE_HISTORY_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error('Failed to save Summarize History to localStorage:', error);
    }
};

// --- Phase 2: diagnose history ---
export const getDiagnoseHistory = (): any[] => {
    try {
        const stored = localStorage.getItem(DIAGNOSE_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to parse Diagnose History from localStorage:', error);
        return [];
    }
};

export const setDiagnoseHistory = (history: any[]) => {
    try {
        const capped = history.slice(-DIAGNOSE_HISTORY_LIMIT);
        localStorage.setItem(DIAGNOSE_HISTORY_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error('Failed to save Diagnose History to localStorage:', error);
    }
};

// --- Phase 2: suggest history ---
export const getSuggestHistory = (): any[] => {
    try {
        const stored = localStorage.getItem(SUGGEST_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to parse Suggest History from localStorage:', error);
        return [];
    }
};

export const setSuggestHistory = (history: any[]) => {
    try {
        const capped = history.slice(-SUGGEST_HISTORY_LIMIT);
        localStorage.setItem(SUGGEST_HISTORY_KEY, JSON.stringify(capped));
    } catch (error) {
        console.error('Failed to save Suggest History to localStorage:', error);
    }
};

// --- Phase 3: panel filters persistence ---
export type PanelFilters = {
    audit?: string;
    explain?: string;
    optimize?: string;
    summarize?: string;
    diagnose?: string;
    suggest?: string;
    oi?: string;
};

export const getPanelFilters = (): PanelFilters => {
    try {
        const stored = localStorage.getItem(PANEL_FILTERS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Failed to parse Panel Filters from localStorage:', error);
        return {};
    }
};

export const setPanelFilters = (filters: PanelFilters) => {
    try {
        localStorage.setItem(PANEL_FILTERS_KEY, JSON.stringify(filters));
    } catch (error) {
        console.error('Failed to save Panel Filters to localStorage:', error);
    }
};

// --- Phase 3: export/import all histories ---
export type MayaExportPayload = {
    version: number;
    exportedAt: string;
    audit: any[];
    explain: any[];
    optimize: any[];
    summarize: any[];
    diagnose: any[];
    suggest: any[];
    oi: any[];
};

export const exportAllHistories = (): MayaExportPayload => {
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        audit: getAuditHistory(),
        explain: getExplainHistory(),
        optimize: getOptimizeHistory(),
        summarize: getSummarizeHistory(),
        diagnose: getDiagnoseHistory(),
        suggest: getSuggestHistory(),
        oi: getOIHistory(),
    };
};

export const importAllHistories = (payload: Partial<MayaExportPayload>, mode: 'replace' | 'merge' = 'merge') => {
    const safeArray = (v: any) => Array.isArray(v) ? v : [];
    const apply = (setter: (arr: any[]) => void, current: any[], incoming: any[]) => {
        const next = mode === 'replace' ? incoming : [...current, ...incoming];
        setter(next);
    };
    try {
        apply(setAuditHistory, getAuditHistory(), safeArray(payload.audit));
        apply(setExplainHistory, getExplainHistory(), safeArray(payload.explain));
        apply(setOptimizeHistory, getOptimizeHistory(), safeArray(payload.optimize));
        apply(setSummarizeHistory, getSummarizeHistory(), safeArray(payload.summarize));
        apply(setDiagnoseHistory, getDiagnoseHistory(), safeArray(payload.diagnose));
        apply(setSuggestHistory, getSuggestHistory(), safeArray(payload.suggest));
        apply(setOIHistory, getOIHistory(), safeArray(payload.oi));
    } catch (e) {
        console.error('Failed to import histories:', e);
        throw e;
    }
};
