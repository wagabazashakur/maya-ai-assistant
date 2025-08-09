export const classifyCommand = (cmd: string): 'safe' | 'risky' | 'destructive' => {
    const destructivePatterns = [
        /rm -rf \//,
        /mkfs/,
        /dd if=\/dev\/zero/,
        /:(){:|:&};:/, // fork bomb
    ];

    const riskyPatterns = [
        /\bsudo\b/,
        /\brm\b/,
        /\bmv\b/,
        /\bcp\b/,
        /\bchown\b/,
        /\bchmod\b/,
        /\bapt\b/,
        /\byum\b/,
        /\bdnf\b/,
        /\bpacman\b/,
        /\bshutdown\b/,
        /\breboot\b/,
        /\bkill\b/,
        /\bpkill\b/,
        /\s(>>?|<)\s*.+/, // I/O Redirection
        /2>|&>/, // Error Redirection
        /\btar\b.*x/, // tar extract
        /^maya restore/,
        /^maya checkout/,
        /(^\.\/)|(^\/)/, // script execution
        /\bgroupadd\b/,
        /\busermod\b/,
        /\buserdel\b/,
        /\bchgrp\b/,
        /\bln\b/, 
        /\biot\b.*write/,
        /\bgcc\b/,
        /\bcrontab\b/,
        /\bmount\b/,
        /\bumount\b/,
        /\bgit\b.*\breset\b.*--hard/,
        /\bgit\b.*\bpush\b.*(--force|-f)/,
        /\bgit\b.*\bclean\b.*-f/,
        /\btee\b\s+.+/,
        /\bfirewall\b/,
        /\bsystemctl\b/,
        /\bpasswd\b/,
    ];

    // Whitelist maya commands that are definitely safe
    if (/^maya (remember|recall|forget|fix|config|lang|backup|do|refactor|debug|log|explain|code|checkout|pkg|check|report|evolve|learn|journal|secure|optimize|new-project|critique|repair|git-digest|git-find|document|sys-report|version|troubleshoot|dockerize|git-commit|audit|history-digest|complete-project|explain)/.test(cmd)) {
        return 'safe';
    }
    
    // Whitelist other known safe commands
    const safeCommands = [
        'ls', 'pwd', 'cat', 'ping', 'clear', 'help', 'history', 'search', 'tree', 'whoami', 'su', 'ps', 
        'uname', 'date', 'df', 'top', 'export', 'printenv', 'head', 'tail', 'wc', 'find', 'wget', 
        'man', 'xargs', 'alias', 'unalias', 'vim', 'sed', 'git', 'id', 'groups', 'source', '.', 
        'watch', 'curl', 'less', 'which', 'sort', 'uniq', 'diff', 'tar', 'sleep', 'jobs', 'fg', 'bg', 
        'awk', 'true', 'false', 'test', '[', 'read', 'ssh', 'exit', 'typeset', 'readlink', 
        'iot', 'du', 'local', 'return', 'until', 'logout', 'env', 'strace', 'uptime', 'firewall', 'cut', 'tr', 'make',
        'stat', 'pgrep', 'lsof', 'break', 'continue', 'trap', 'expr', 'mktemp', 'hostname',
        'nohup', 'nl', 'cal', 'who', 'journalctl', 'xxd', 'dmesg', 'script', 'printf', 'ip', 'systemctl', 'at', 'atq', 'atrm',
        'basename', 'dirname', 'md5sum', 'sha1sum', 'whatis', 'fc', 'ldd', 'useradd', 'chgrp', 'chown', 'groupadd',
        'ssh-keygen', 'let', 'gdb'
    ];

    const commandPart = cmd.trim().split(/\s+|\||&&|\|\|/)[0];
    if (safeCommands.includes(commandPart)) {
        // Still need to check for risky redirection or other patterns
        if (riskyPatterns.some(p => p.test(cmd))) {
            return 'risky';
        }
        return 'safe';
    }
    
    if (destructivePatterns.some(pattern => pattern.test(cmd))) {
        return 'destructive';
    }

    if (riskyPatterns.some(pattern => pattern.test(cmd))) {
        return 'risky';
    }

    // Default to risky for unknown commands that might be sent to Gemini
    return 'risky';
};