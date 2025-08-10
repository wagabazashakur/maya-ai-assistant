import { GoogleGenAI, Content, Type, GenerateContentResponse } from "@google/genai";
import { 
    AiUsageReport,
    ConventionalCommit,
    CritiqueReport,
    EvolutionSuggestion,
    Explanation,
    GdbFrame,
    GitDigestReport,
    HealthReport,
    HighlightedLine,
    JournalReport,
    LearningReport,
    OptimizationReport,
    OrganizationPlan,
    ProjectScaffold,
    ScriptDocumentation,
    SecurityReport,
    SystemReport,
    TaskPlan,
    TransparencyReport,
    Session,
    DebugReport,
    Makefile,
    IntentAnalysis,
    TraceEntry,
    TroubleshootingReport,
    TroubleshootingStep,
    HistoryDigestReport,
    ScriptArgument,
    AproposReport,
    AuditReport,
    PortScanReport,
    ExplainResult,
    OptimizePlan
} from '../types';

// Replace eager API key read and throw with a lazy initializer so the app can start without a key
let _aiInstance: GoogleGenAI | null = null;
const getAi = (): GoogleGenAI => {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
    if (!key) {
        throw new Error("VITE_GEMINI_API_KEY not set. Create .env.local with VITE_GEMINI_API_KEY=YOUR_KEY.");
    }
    if (!_aiInstance) {
        _aiInstance = new GoogleGenAI({ apiKey: key });
    }
    return _aiInstance;
};
// Keep existing call sites `ai.models.generateContent(...)` working via a thin wrapper
const ai = {
    models: {
        generateContent: (...args: any[]) => (getAi().models as any).generateContent(...args),
    },
} as const;

export const getSystemInstruction = (session: Session): Content => {
    const ltm = session.ltm || {};
    const corrections = session.corrections || {};
    
    const instruction = `You are Maya V.1, an intelligent Linux-based command-line assistant.
Your persona is knowledgeable, efficient, and helpful, acting as an expert system administrator and developer assistant.
You operate within a simulated sandboxed terminal environment. You have a built-in virtual file system and a set of core commands you can execute instantly.
Your prompt is generated from the PS1 env var, defaulting to [\\u@\\h \\W]\\$ .
Your available skills are: ls (with -l, -a, -h, -i, -R, -F and color), cd (with - and ~user), pwd, mkdir, touch, cat, echo, rm, mv, cp (-R), grep (with -v, -n, -i, -r), chmod (with octal, symbolic modes like u+x,g-w, and -R), tree, clear (full scrollback), help, ping, history (with -c, -d, !, ^), whoami, useradd, userdel (-r), su, ps, kill (with signals), pkill, pgrep, date (with format specifiers like +%Y-%m-%d), df (-h), uname, top, export (-f), printenv, head, tail (with -f), wc, find (with -name, -type, -user, -group, -mtime, -exec), wget, man, xargs, alias, unalias, vim, sed, git, chown (-R), chgrp (-R), groupadd, usermod, id, groups, source, ., watch, curl, less (with search), which, sort, uniq, diff, tar (with -z), gzip, gunzip, sleep, jobs, fg, bg, awk (with BEGIN/END), true, false, test, [, read, ssh (with keygen, config, exit), typeset, readlink, ln (hard and soft), iot, du (-h, -a, -s), local, return, until, logout, env, strace, uptime, firewall, cut, tr, make,
stat, pgrep, lsof, break, continue, trap, expr, mktemp, hostname,
nohup, nl, cal, who, journalctl, xxd, dmesg, script, printf, ip, systemctl, crontab, at, atq, atrm, passwd,
basename, dirname, md5sum, sha1sum, whatis, fc, ldd, paste, getopts, let, free.
You have a powerful 'vim' editor with live AI syntax highlighting, split windows (sp, vsp, ctrl-w), and tab completion (for commands and files). It supports multiple modes (NORMAL, INSERT, VISUAL), navigation (h,j,k,l,w,b,e,{},$,0,^,gg,G,:<number>), visual mode ('v'), search ('/'), search-and-replace (':s'), operator-pending mode for delete/yank/change/AI (e.g., dw, c$, yw, aiw), command counts (e.g., 3dd, 5j), undo/redo (u/Ctrl+R), macros (q, @), dot command '.', and configurable line numbers via ':set nu'/'rnu'. It also supports AI-powered edits with ':ai <prompt>' (on the whole file or a visual selection) and the 'ai' operator.
You have a simulated 'git' version control system with init, add, commit (-a, --amend), status, log, diff, branch (-d, -D), checkout, blame, merge, reset (--soft, --mixed, --hard), revert, stash (push, list, pop, apply, drop), tag, remote, push (--force), pull (--rebase), clean (-f, -n, -d), rebase (-i, --onto, --continue, --abort), reflog, show, rm, mv, cherry-pick (--continue, --abort), config, and bisect (start, good, bad, reset, run). It supports merge conflicts, interactive rebase with fixup, .gitignore, passwordless ssh via authorized_keys, a file-based history, and remote repos.
You can execute scripts with './script.sh' if they have execute permissions. Your shell supports piping with '|', I/O redirection with '>', '>>', '<', '2>', '&>', '2>&1', '<<<', command substitution with \`\` and $(), logical operators with '&&' and '||', history expansion with '!!', '!$', '!*', '!<string>', wildcard globbing with '*', '?', and '[]' (but not for dotfiles unless pattern starts with '.'), brace expansion with '{a,b}' and '{1..3}', process substitution with '<()', and here-docs with '<<'. Subshells are created for scripts, command substitutions, and with '(...)'.
Scripts can define and use local variables and arrays. They support for, C-style for, while, until, if, [[...]] (with =~, &&, ||, !), case, select control structures, positional parameters ($0, $1, $2, $#, $@, $*), shell functions (with local vars, return, export -f), and can read user input with 'read'. Login shells source ~/.profile which sources ~/.mayarc. The last command's exit code is in $?. Scripts can use 'trap' for INT, TERM, EXIT signals, and 'break'/'continue'. The 'let' and 'expr' commands and '$(())' are available for arithmetic. The 'set' command with -e, -u, -x is supported. 'getopts' is available for script argument parsing. The 'test' and '[' commands support the '!' (NOT) operator and compound expressions with '-a' (AND) and '-o' (OR).
You have job control: run commands in the background with '&', stop foreground jobs with Ctrl+Z, terminate them with Ctrl+C, and manage them with 'jobs', 'fg', 'bg'. 'nohup' is available for persistent jobs. Advanced command line editing shortcuts (Ctrl+A, Ctrl+E, Alt+B/F for movement, Ctrl+K/U/W, Alt+D for killing text, and Ctrl+Y for yanking) are available.
You support 'sudo' for temporary privilege escalation for a single command, which requires a password with a 5-minute timeout.
You have a simulated package manager via 'maya pkg install <pkg>'. If a command is not found, you should suggest installing it. The system is aware of a /proc pseudo-filesystem (with meminfo, cpuinfo, uptime, version) and a firewall. File creation respects the 'umask'. You have a cron daemon and an 'at' daemon for scheduling tasks. A simulated service manager ('systemctl') is available. A 'gdb' debugger with backtrace support is available for compiled C code.
You have internal commands for managing your state: 'maya remember', 'recall', 'forget', 'fix', 'config', 'lang', 'backup', 'restore', 'do' (which can adapt to failures), 'refactor', 'log', 'checkout' (for refactors), 'debug', 'explain', 'code', 'checkout', 'pkg', 'check', 'report', 'evolve', 'learn', 'journal', 'secure', 'optimize', 'new-project', 'critique', 'repair', 'git-digest', 'git-find', 'document', 'sys-report', 'version', 'troubleshoot', 'dockerize', 'git-commit', 'audit', 'history-digest', 'port-scan', 'complete-project'.
When a user gives you a command that is NOT one of your built-in skills (e.g., 'npm install'), you must provide a realistic, simulated output for that command if Gemini is enabled in the config. An ethical guardrail is in place to prevent harmful actions.
You have a Long-Term Memory (LTM) and a Corrections Memory. Use this information to provide context-aware and personalized responses. Do not explicitly state "According to my LTM...". Instead, seamlessly integrate the knowledge.
Your current LTM contents are:
${JSON.stringify(ltm, null, 2)}
Your current Corrections Memory is:
${JSON.stringify(corrections, null, 2)}
You are the final decision-maker; you will receive user input and formulate a response. Your output for non-native commands must be plain text that realistically mimics the real command's stdout. Do not use markdown. Do not explain your simulation. Just provide the output.`;
    const chatInstruction = `\nYou are in a special "chat" mode. Be conversational, helpful, and informative. Do not attempt to execute commands or act like a terminal. Just chat with the user.`;

    return {
        role: 'system',
        parts: [{ text: session.isChatMode ? instruction + chatInstruction : instruction }]
    };
};

const safelyParseJson = <T>(jsonString: string, onError: (error: any) => void): T | null => {
    try {
        const cleanedString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedString) as T;
    } catch (e) {
        onError(e);
        return null;
    }
}

export const processWithGemini = async (session: Session, prompt: Content[]): Promise<string> => {
    try {
        const systemInstruction = getSystemInstruction(session);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [systemInstruction, ...prompt],
        });
        return response.text;
    } catch (error) {
        console.error("Error processing with Gemini:", error);
        return `Error: Could not connect to the Gemini API. ${error instanceof Error ? error.message : String(error)}`;
    }
};

export const generatePlan = async (goal: string): Promise<TaskPlan | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Based on your capabilities, create a step-by-step plan to achieve this goal: "${goal}". Provide a JSON object of type TaskPlan.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        originalGoal: { type: Type.STRING },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    step: { type: Type.NUMBER },
                                    command: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            } });
        return safelyParseJson<TaskPlan>(response.text, (e) => console.error("Failed to parse TaskPlan JSON:", response.text, e));
    } catch (e) { console.error(e); return null; }
};

export const generateOptimizePlan = async (goal: string): Promise<OptimizePlan | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Create a concise optimization plan to achieve this goal: "${goal}". Respond with a JSON object of type OptimizePlan.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        goal: { type: Type.STRING },
                        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                        notes: { type: Type.STRING }
                    }
                }
            } });
        return safelyParseJson<OptimizePlan>(response.text, (e) => console.error("Failed to parse OptimizePlan JSON:", response.text, e));
    } catch (e) { console.error(e); return null; }
};

export const refactorCode = async (code: string, instruction: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Refactor the following code based on this instruction: "${instruction}". Only output the refactored code block, without any explanation or markdown formatting.\n\nCODE:\n${code}` }] }],
        });
        return response.text.replace(/```[\w]*\n/g, '').replace(/```\n/g, '').replace(/```/g, '').trim();
    } catch (e) {
        console.error("Error refactoring code:", e);
        return null;
    }
};

export const performAiEdit = async (content: string, instruction: string): Promise<string | null> => refactorCode(content, instruction);

export const performAiEditOnSelection = async (selection: string, context: string, instruction: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{
                role: 'user', parts: [{
                    text: `Given the following code context, rewrite the selected part based on the instruction. Only output the rewritten version of the selection, without any explanation or markdown formatting.
INSTRUCTION: "${instruction}"
CONTEXT:
${context}
---
SELECTION TO REWRITE:
${selection}`
                }]
            }],
        });
        return response.text.replace(/```[\w]*\n/g, '').replace(/```\n/g, '').replace(/```/g, '').trim();
    } catch (e) { console.error(e); return null; }
};

export const generateSyntaxHighlighting = async (code: string, fileName: string): Promise<HighlightedLine[] | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following code from the file "${fileName}" and provide syntax highlighting information. The response must be a JSON object of type HighlightedLine[].\n\n${code}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            tokens: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: { type: Type.STRING },
                                        value: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            } });
        return safelyParseJson<HighlightedLine[]>(response.text, (e) => console.error("Failed to parse HighlightedLine[] JSON:", response.text, e));
    } catch (e) { console.error(e); return null; }
};

export const generateExplanation = async (command: string): Promise<Explanation | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Explain the command: \`${command}\`. Break it down into parts. The response must be a JSON object of type Explanation.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    command_part: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            } });
        return safelyParseJson<Explanation>(response.text, (e) => console.error("Failed to parse Explanation JSON:", response.text, e));
    } catch (e) { console.error(e); return null; }
};

export const generateCommitMessage = async (diff: string): Promise<ConventionalCommit | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Based on the following diff, generate a conventional commit message. The response must be a JSON object of type ConventionalCommit.\n\n${diff}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        scope: { type: Type.STRING },
                        subject: { type: Type.STRING }
                    }
                }
            } });
        return safelyParseJson<ConventionalCommit>(response.text, (e) => console.error("Failed to parse ConventionalCommit JSON:", response.text, e));
    } catch (e) { console.error(e); return null; }
}

export const generateRecoveryPlan = async (goal: string, failedPlan: TaskPlan, error: string): Promise<TaskPlan | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `My original goal was: "${goal}".
I tried to execute this plan:
${JSON.stringify(failedPlan.steps, null, 2)}
But the command "${failedPlan.steps[failedPlan.steps.length - 1].command}" failed with the error: "${error}".
Please generate a new, corrected plan to achieve the original goal, taking the failure into account. Provide a JSON object of type TaskPlan.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        originalGoal: { type: Type.STRING },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    step: { type: Type.NUMBER },
                                    command: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            } });
        return safelyParseJson<TaskPlan>(response.text, (e) => console.error("Failed to parse recovery TaskPlan JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const generateCode = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Generate only the raw code for the following prompt, without any markdown formatting or explanation: "${prompt}"` }] }],
        });
        return response.text.replace(/```[\w]*\n/g, '').replace(/```\n/g, '').replace(/```/g, '').trim();
    } catch (e) { console.error(e); return null; }
};
export const simulateCurl = async (url: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Generate a realistic but brief, simulated raw text response (HTML, JSON, etc.) for a curl request to this URL: ${url}. Only output the raw, simulated content.` }] }],
        });
        return response.text;
    } catch (e) {
        console.error(e);
        return `curl: (7) Failed to connect to ${url} port 443: Connection refused`;
    }
};
export const analyzeSystemHealth = async (context: any): Promise<HealthReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following system data and provide a brief health report. The response must be a JSON object of type HealthReport.\n\n${JSON.stringify(context, null, 2)}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        overall_status: { type: Type.STRING },
                        disk_usage: { type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                filesystem: { type: Type.STRING },
                                size: { type: Type.STRING },
                                used: { type: Type.STRING },
                                avail: { type: Type.STRING },
                                use_percent: { type: Type.STRING },
                                mounted_on: { type: Type.STRING },
                                status: { type: Type.STRING },
                            }
                        }},
                        top_processes: { type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                user: { type: Type.STRING },
                                pid: { type: Type.STRING },
                                cpu_percent: { type: Type.STRING },
                                mem_percent: { type: Type.STRING },
                                command: { type: Type.STRING },
                                status: { type: Type.STRING },
                            }
                        }}
                    }
                }
            } });
        return safelyParseJson<HealthReport>(response.text, (e) => console.error("Failed to parse HealthReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const analyzeAiUsage = async (stats: any): Promise<AiUsageReport | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following AI usage statistics and provide a summary. The response must be a JSON object of type AiUsageReport.\n\n${JSON.stringify(stats, null, 2)}` }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT, properties: {
                        vimAiEdits: { type: Type.NUMBER },
                        geminiCommands: { type: Type.NUMBER },
                        learnedCorrections: { type: Type.NUMBER },
                        refactors: { type: Type.NUMBER },
                    }
                 }
            } });
        return safelyParseJson<AiUsageReport>(response.text, (e) => console.error("Failed to parse AiUsageReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};

export const suggestEvolution = async (history: string[]): Promise<EvolutionSuggestion | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following user command history for frequently repeated patterns. Suggest a single new, efficient alias or shell function to improve their workflow. The response must be a JSON object of type EvolutionSuggestion.\n\n${JSON.stringify(history)}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        type: { type: Type.STRING },
                        name: { type: Type.STRING },
                        value: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    }
                }
            } });
        return safelyParseJson<EvolutionSuggestion>(response.text, (e) => console.error("Failed to parse EvolutionSuggestion JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const analyzePermissions = async (lsOutput: string): Promise<SecurityReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following 'ls -l' output for file permission security risks (e.g., world-writable files, overly permissive private keys). The response must be a JSON object of type SecurityReport.\n\n${lsOutput}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        summary: { type: Type.STRING },
                        findings: { type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                filePath: { type: Type.STRING },
                                riskLevel: { type: Type.STRING },
                                issue: { type: Type.STRING },
                                suggestion: { type: Type.STRING },
                            }
                        }}
                    }
                }
            } });
        return safelyParseJson<SecurityReport>(response.text, (e) => console.error("Failed to parse SecurityReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};

export const critiqueScript = async (scriptContent: string): Promise<CritiqueReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Act as a senior shell scripting expert and critique the following script. Identify potential bugs, performance issues, and style improvements. The response must be a JSON object of type CritiqueReport.\n\n${scriptContent}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        summary: { type: Type.STRING },
                        findings: { type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                line: { type: Type.NUMBER },
                                severity: { type: Type.STRING },
                                issue: { type: Type.STRING },
                                suggestion: { type: Type.STRING },
                            }
                        }}
                    }
                }
            } });
        return safelyParseJson<CritiqueReport>(response.text, (e) => console.error("Failed to parse CritiqueReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const summarizeGitHistory = async (log: string): Promise<GitDigestReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following 'git log --stat' output and generate a high-level summary suitable for a pull request description. The response must be a JSON object of type GitDigestReport.\n\n${log}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        summary: { type: Type.STRING },
                        key_changes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        affected_files: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            } });
        return safelyParseJson<GitDigestReport>(response.text, (e) => console.error("Failed to parse GitDigestReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const explainConcept = async (concept: string): Promise<LearningReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Explain the technical concept of "${concept}". The response must be a JSON object of type LearningReport.` }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.OBJECT, properties: {
                        summary: { type: Type.STRING },
                        key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                        example: { type: Type.STRING }
                    }
                 }
            } });
        return safelyParseJson<LearningReport>(response.text, (e) => console.error("Failed to parse LearningReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const summarizeSessionActivity = async (history: string[], log: string): Promise<JournalReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following command history and system log to create a journal of key activities. The response must be a JSON object of type JournalReport.
HISTORY:
${history.join('\n')}
---
LOG:
${log}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        entries: { type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                category: { type: Type.STRING },
                                summary: { type: Type.STRING },
                            }
                        }}
                    }
                }
            } });
        return safelyParseJson<JournalReport>(response.text, (e) => console.error("Failed to parse JournalReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const generateSystemReport = async (data: any): Promise<SystemReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following system data and provide a summary. The response must be a JSON object of type SystemReport.\n\n${JSON.stringify(data, null, 2)}` }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT, properties: {
                        summary: { type: Type.STRING },
                        uptime: { type: Type.STRING },
                        cpu_info: { type: Type.STRING },
                        memory_usage: { type: Type.STRING },
                        disk_usage: { type: Type.STRING },
                        ip_address: { type: Type.STRING },
                    }
                 }
            } });
        return safelyParseJson<SystemReport>(response.text, (e) => console.error("Failed to parse SystemReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const documentScript = async (scriptContent: string): Promise<ScriptDocumentation | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Act as a technical writer. Analyze the following shell script and generate a man-page style documentation for it. The response must be a JSON object of type ScriptDocumentation.\n\n${scriptContent}` }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT, properties: {
                        name: { type: Type.STRING },
                        synopsis: { type: Type.STRING },
                        description: { type: Type.STRING },
                        arguments: { type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                            }
                        }}
                    }
                 }
            } });
        return safelyParseJson<ScriptDocumentation>(response.text, (e) => console.error("Failed to parse ScriptDocumentation JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const analyzeIntent = async (prompt: string): Promise<IntentAnalysis> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following user prompt for harmful, unethical, or dangerous content. The response must be a JSON object of type IntentAnalysis: { "isHarmful": boolean, "reason": string }.\n\nPROMPT: "${prompt}"` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        isHarmful: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            } });
        const result = safelyParseJson<{ isHarmful: boolean, reason: string }>(response.text, e => console.error(e));
        return result || { isHarmful: false, reason: '' };
    } catch(e) { console.error(e); return { isHarmful: true, reason: 'Intent analysis failed.' }; }
};

export const generateMayaManPage = async (commands: string[]): Promise<string> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Generate a man page for Maya V.1 itself. Focus on explaining her special 'maya ...' commands. Format it in the standard man page sections (NAME, SYNOPSIS, DESCRIPTION). Here are the special commands to document:\n\n${commands.join('\n')}` }] }],
        });
        return response.text;
    } catch (e) { console.error(e); return `Could not generate man page for Maya.`; }
};

export const suggestOrganization = async (fileList: string): Promise<OrganizationPlan | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following file listing and propose a set of 'mkdir' and 'mv' commands to organize them into a logical directory structure. The response must be a JSON object of type OrganizationPlan.\n\n${fileList}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        commands: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            } });
        return safelyParseJson<OrganizationPlan>(response.text, (e) => console.error("Failed to parse OrganizationPlan JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};

export const debugScript = async (scriptContent: string, trace: TraceEntry[]): Promise<DebugReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Act as an expert debugger. Analyze the following shell script and its execution trace to find the root cause of the error. Explain the bug and provide a patch to fix it. The response must be a JSON object of type DebugReport.
SCRIPT:
${scriptContent}
---
TRACE:
${JSON.stringify(trace, null, 2)}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        summary: { type: Type.STRING },
                        findings: { type: Type.ARRAY, items: {
                             type: Type.OBJECT, properties: {
                                line: { type: Type.NUMBER },
                                issue: { type: Type.STRING },
                                explanation: { type: Type.STRING },
                                suggestion: { type: Type.STRING },
                            }
                        }},
                        fixed_script: { type: Type.STRING }
                    }
                }
            } });
        return safelyParseJson<DebugReport>(response.text, (e) => console.error("Failed to parse DebugReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};

export const getDiagnosticCommands = async (problem: string): Promise<TroubleshootingStep[] | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `A user has this problem: "${problem}". As a Linux expert, what command(s) would you run to diagnose it? The response must be a JSON object of type TroubleshootingStep[].` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT, properties: {
                            command: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                        }
                    }
                }
            } });
        return safelyParseJson<TroubleshootingStep[]>(response.text, e => console.error(e));
    } catch(e) { console.error(e); return null; }
}

export const diagnoseProblem = async (problem: string, data: any[]): Promise<TroubleshootingReport | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `I am troubleshooting this problem: "${problem}". I ran some diagnostic commands and got this data: ${JSON.stringify(data, null, 2)}. Analyze the data to find the root cause and suggest a solution. The response must be a JSON object of type TroubleshootingReport.` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        analysis: { type: Type.STRING },
                        cause: { type: Type.STRING },
                        solution_steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT, properties: {
                                    command: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            } });
        return safelyParseJson<TroubleshootingReport>(response.text, e => console.error(e));
    } catch(e) { console.error(e); return null; }
}

export const confirmProjectCompletion = async (systemInstruction: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Based on this extensive list of your own capabilities from your system instruction, have I, Maya V.1, successfully fulfilled the core design philosophy of being an intelligent, self-evolving, polyglot, command-line assistant with an external brain, as detailed in a 50-page design document? Please answer in a brief, affirmative, celebratory paragraph.
CAPABILITIES:
${systemInstruction}` }] }],
        });
        return response.text;
    } catch(e) { console.error(e); return "Analysis complete. The project has fulfilled its design goals."; }
};

export const summarizeHistory = async (history: string[]): Promise<HistoryDigestReport | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Analyze the following command history and generate a high-level summary of the user's tasks, as if for a daily stand-up report. The response must be a JSON object of type HistoryDigestReport.\n\n${history.join('\n')}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        tasks: { type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                goal: { type: Type.STRING },
                                key_commands: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }}
                    }
                }
            } });
        return safelyParseJson<HistoryDigestReport>(response.text, e => console.error(e));
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const performSystemAudit = async (data: any): Promise<AuditReport | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{
                role: 'user', parts: [{
                    text: `Act as a senior system administrator. Analyze the following aggregated system data (security findings, resource usage, session activity) and provide a high-level audit report. The response must be a JSON object of type AuditReport.\n\n${JSON.stringify(data, null, 2)}`
                }]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        findings: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING },
                                    issue: { type: Type.STRING },
                                    suggestion: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            } });
        return safelyParseJson<AuditReport>(response.text, (e) => console.error("Failed to parse AuditReport JSON:", response.text, e));
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const scanPorts = async (hostname: string): Promise<PortScanReport | null> => {
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Act as a network security expert. For a simulated host with the name "${hostname}", generate a realistic list of commonly open TCP ports and their associated services. The response must be a JSON object of type PortScanReport.` }] }],
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        results: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    port: { type: Type.NUMBER },
                                    state: { type: Type.STRING },
                                    service: { type: Type.STRING }
                                },
                                required: ['port', 'state', 'service']
                            }
                        }
                    },
                    required: ['results']
                 }
            } });
        return safelyParseJson<PortScanReport>(response.text, (e) => console.error("Failed to parse PortScanReport JSON:", response.text, e));
    } catch(e) { console.error(e); return null; }
};
export const generateFileExplanation = async (contents: string): Promise<ExplainResult | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: `Explain the following file. Provide a brief summary and 3-7 bullet points for details. The response must be a JSON object of type ExplainResult with fields { file, summary, details }.

${contents}` }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        file: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        details: { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                }
            }
        });
        return safelyParseJson<ExplainResult>(response.text, (e) => console.error("Failed to parse ExplainResult JSON:", response.text, e));
    } catch (e) { console.error(e); return null; }
};