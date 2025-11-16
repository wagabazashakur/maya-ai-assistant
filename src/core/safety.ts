import { getPlugins } from './plugins';

export const classifyCommand = (cmd: string): 'safe' | 'risky' | 'destructive' => {
    // Safe maya subcommands allowlist (extendable)
    if (/^maya (remember|recall|forget|fix|config|lang|backup|do|refactor|debug|log|explain|code|checkout|pkg|check|report|evolve|learn|journal|secure|optimize|new-project|critique|repair|git-digest|git-find|document|sys-report|version|troubleshoot|dockerize|git-commit|audit|history-digest|complete-project|run-script|system-check|summarize|diagnose|suggest)\b/i.test(cmd)) {
        return 'safe';
    }

    // Plugin dynamic classification: match 'maya <subcmd>' and consult registry
    const m = cmd.match(/^maya\s+(\S+)/i);
    if (m) {
        const sub = m[1];
        const plugin = getPlugins().find(p => p.commands.some(c => c.name === sub));
        if (plugin) {
            const c = plugin.commands.find(c => c.name === sub)!;
            return c.classify;
        }
    }

    // Very rough destructive patterns
    if (/(rm\s+-rf\s+\/(\s|$))|(mkfs\.)|(dd\s+if=\/dev\/zero\s+of=\/dev\/sda)|(shutdown\s+-h\s+now)|(reboot\b)/i.test(cmd)) {
        return 'destructive';
    }

    // Risky patterns
    if (/(chown\s+-R\s+root\s+\/)|(chmod\s+-R\s+777\s+\/)|(sudo\b)/i.test(cmd)) {
        return 'risky';
    }

    return 'safe';
};