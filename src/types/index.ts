import { Content } from "@google/genai";

export type OutputLineRole = 'user' | 'model' | 'system' | 'debug' | 'diff';

export type DiffData = {
    original: string;
    new: string;
    label?: string;
};

export type OutputLine = {
    id: number;
    role: OutputLineRole;
    text: string;
    isLoading?: boolean;
    diffData?: DiffData;
};

export type LogEntry = {
    id: number;
    timestamp: string;
    prompt: Content[];
    rawResponse: string;
};

export type PlanStep = {
    step: number;
    command: string;
    explanation: string;
};

export type TaskPlan = {
    originalGoal: string;
    steps: PlanStep[];
};

// --- Added for maya optimize ---
export interface OptimizePlan {
    goal: string;
    steps: string[];
    notes?: string;
}

export type ConfirmationState = {
    command: string;
    level: 'risky' | 'destructive' | 'suggestion' | 'ai_suggestion' | 'plan_start' | 'plan_step' | 'plan_recover' | 'refactor_review' | 'checkout_apply';
    correctedCommand?: string;
    plan?: TaskPlan;
    planStep?: number;
    originalContent?: string;
    refactoredContent?: string;
    commitToCheckout?: GitCommitObject;
};

export type LongTermMemory = {
    [key: string]: string;
};

export type CorrectionMemory = {
    [key: string]: string;
};

export type UserConfiguration = {
    theme: 'dark' | 'light';
    secondary_display_visible: boolean;
    gemini_enabled: boolean;
    // --- Phase 4: Multi-LLM ---
    llm_provider?: 'gemini' | 'openai';
    llm_model?: string; // e.g., 'gemini-2.5-flash' | 'gpt-4o-mini'
};

export type GitCommit = {
    hash: string;
    author: string;
    date: string;
    message: string;
    filePath: string;
    originalContent: string;
    refactoredContent: string;
};

export type GitLog = GitCommit[];

export type LogPanelVisibility = {
    configVisible: boolean;
    ltmVisible: boolean;
    correctionsVisible: boolean;
    gitLogVisible: boolean;
    geminiLogsVisible: boolean;
    envVarsVisible: boolean;
    aliasesVisible: boolean;
    auditHistoryVisible: boolean;
    explainHistoryVisible: boolean;
    optimizeHistoryVisible: boolean;
    oiHistoryVisible: boolean;
    // --- Phase 2 panels ---
    summarizeHistoryVisible?: boolean;
    diagnoseHistoryVisible?: boolean;
    suggestHistoryVisible?: boolean;
};

export type OnboardingStatus = 'welcome' | 'theme' | 'finished';

export type EnvironmentVariables = {
    [key: string]: string | string[];
};

export type Aliases = {
    [key: string]: string;
};

export type VimLayoutNode = {
    id: string;
    type: 'window' | 'split';
    direction?: 'horizontal' | 'vertical';
    children?: VimLayoutNode[];
    window?: VimWindow;
    size: number;
};

export type VimLayout = {
    root: VimLayoutNode;
    activeWindowId: string;
};

export type VimWindow = {
    filePath: string;
    initialContent: string;
    content: string;
    cursor: Cursor;
    mode: 'NORMAL' | 'INSERT' | 'VISUAL' | 'COMMAND_LINE' | 'SEARCH' | 'OPERATOR_PENDING' | 'AI_INSTRUCTION_INPUT';
    commandLine: string;
    undoStack: string[];
    redoStack: string[];
    selectionAnchor: Cursor | null;
    yankBuffer: string;
    lastSearch: { query: string; caseInsensitive: boolean };
    gPressed: boolean;
    showLineNumbers: boolean;
    relativeNumbers: boolean;
    commandCount: string;
    pendingOperator: string | null;
    pendingAiAction: PendingAiAction | null;
    highlightedLines: HighlightedLine[];
    isAnalyzingSyntax: boolean;
    lastExecutedMacro: string;
    isRecordingMacro: string | null;
    macros: { [key: string]: string };
    completionCandidates: string[];
    lastCompletionPrefix: string | null;
    prevMode: 'NORMAL' | 'INSERT' | 'VISUAL' | 'COMMAND_LINE' | 'SEARCH' | 'OPERATOR_PENDING' | 'AI_INSTRUCTION_INPUT';
};

export type VimState = {
    layout: VimLayout;
    fs: Directory;
    cwd: string;
    fcState?: FcState;
};


export type Cursor = {
    row: number;
    col: number;
};

export type ExplanationStep = {
    command_part: string;
    explanation: string;
};

export type Explanation = {
    steps: ExplanationStep[];
};

export interface ExplainResult {
    file: string;
    summary: string;
    details: string[];
}

// --- Phase 2: summarize/diagnose/suggest types ---
export type SummarizeResult = {
    file?: string;
    inputPreview?: string;
    summary: string;
    keyPoints: string[];
};

export type DiagnoseReport = {
    audit: AuditReport;
    explanations: ExplainResult[];
    optimization?: OptimizePlan;
    notes?: string[];
};

export type SuggestionItem = {
    source: 'audit' | 'explain' | 'optimize' | 'summarize' | 'diagnose';
    suggestion: string;
};

export type SyntaxToken = {
    type: string;
    value: string;
};

export type HighlightedLine = {
    tokens: SyntaxToken[];
};

export type PendingAiAction = {
    startIndex: number;
    endIndex: number;
    originalText: string;
    instruction: string;
};

// --- Git Types ---
export type GitBlob = {
    type: 'blob';
    hash: string;
    content: string;
};

export type GitIndex = {
    [filePath: string]: string; // path -> hash
};

export type GitCommitObject = {
    type: 'commit';
    hash: string;
    parents: string[];
    author: string;
    date: string;
    message: string;
    tree: GitIndex; // A snapshot of the index at commit time
};

export type GitStash = {
    hash: string;
    message: string;
    tree: GitIndex;
};

export type RebaseTodo = {
    action: 'pick' | 'reword' | 'edit' | 'squash' | 'drop' | 'fixup';
    hash: string;
    message: string;
};

export type RebaseState = {
    originalHead: string;
    base: string; // hash of the commit to rebase onto
    todos: RebaseTodo[];
    currentIndex: number;
    squashMessage: string;
};

export type GitRebase = {
    headName: string; // e.g., 'main' or a detached HEAD hash
    onto: string;
    interactive: boolean;
    commitBeingApplied?: GitCommitObject;
    originalHeadBranch: string;
    conflict?: boolean;
};

export type GitBisectState = {
    bad: string;
    good: string;
    current: string;
    originalHead: string;
    path: string[];
    runCmd?: string;
};

export type GitRepository = {
    HEAD: string; // "ref: refs/heads/main"
    refs: {
        heads: {
            [branchName: string]: string; // branch name -> commit hash
        },
        tags: {
            [tagName: string]: string;
        },
        remotes: {
            [remoteName: string]: {
                [branchName: string]: string;
            }
        }
    };
    objects: {
        [hash: string]: GitBlob | GitCommitObject;
    };
    index: GitIndex;
    reflog?: ReflogEntry[];
    remotes: {
        [remoteName: string]: string; // remote name -> url
    };
    config: {
        [key: string]: string;
    };
    merging?: {
        branch: string;
        commit: string;
    };
    reverting?: {
        originalHead: string;
        commitToRevert: string;
    };
    rebase?: GitRebase;
    cherryPicking?: {
        originalHead: string;
        commitToPick: string;
    };
    bisecting?: GitBisectState;
    stash: GitStash[];
    committing?: {
        type: 'commit' | 'amend';
        messagePath: string;
    };
};


// --- File System Types ---
export interface File {
    type: 'file';
    content: string;
    permissions: string;
    owner: string;
    group: string;
    size: number;
    modified: Date;
    inode: number;
    linkCount: number;
}

export interface Directory {
    type: 'directory';
    path: string;
    children: { [key:string]: FileSystemNode };
    permissions: string;
    owner: string;
    group: string;
    size: number;
    modified: Date;
    inode: number;
    linkCount: number;
}

export interface Symlink {
    type: 'symlink';
    target: string;
    permissions: string;
    owner: string;
    group: string;
    size: number;
    modified: Date;
    inode: number;
    linkCount: number;
}

export interface Fifo {
    type: 'fifo';
    content: string;
    permissions: string;
    owner: string;
    group: string;
    size: number;
    modified: Date;
    inode: number;
    linkCount: number;
}


export type FileSystemNode = File | Directory | Symlink | Fifo;

export type User = {
    uid: number;
    gid: number;
    groups: string[];
    passwordHash?: string;
}
export type Users = { [username: string]: User };

export type Group = {
    gid: number;
    members: string[];
}
export type Groups = { [groupname: string]: Group };


// --- Process Types ---
export type OpenFileDescriptor = {
    fd: number;
    path: string;
    type: 'file' | 'pipe' | 'socket';
    mode: 'read' | 'write' | 'read-write';
};

export type Process = {
    pid: number;
    user: string;
    cpu: number;
    mem: number;
    command: string;
    nohup?: boolean;
    fds: OpenFileDescriptor[];
};

export type SystemSummary = {
    tasks: number;
    cpu: number;
    mem: number;
};

export type Job = {
    id: number;
    pid: number;
    command: string;
    status: 'Running' | 'Done' | 'Stopped';
    startTime?: number;
    remainingTime?: number;
    timeoutId?: any;
};

export type CommandResult = {
    stdout: string;
    stderr: string;
    success: boolean;
    diffData?: DiffData;
};

// --- Live View Types ---
export type LiveViewCommand = 'top' | 'vim' | 'less' | 'watch' | 'blame' | 'rebase' | 'gdb' | 'tail';

export type LessState = {
    content: string;
    filePath: string;
};

export type TailState = {
    filePath: string;
    intervalId: any;
};

export type WatchState = {
    command: string;
    interval: number;
};

export type BlameLine = {
    hash: string;
    author: string;
    date: string;
    content: string;
    lineNum: number;
};

export type BlameState = {
    filePath: string;
    lines: BlameLine[];
};

export type GdbFrame = {
    line: number;
    functionName: string;
    variables: { [key: string]: any };
    children?: GdbFrame[];
};

export type GdbState = {
    sourceCode: string;
    trace: GdbFrame | null;
    executablePath: string;
};


// --- Shell Execution Types ---
export type Scope = { [key: string]: string | string[] };

export type ControlFlowSignal = {
    type: 'return' | 'break' | 'continue';
    value?: number; // for `return` exit code or `break/continue` loop level
};

export type ShellFunction = {
    name: string;
    body: string[];
    exported?: boolean;
};

export type ShellFunctions = {
    [name: string]: ShellFunction;
};

export type ScriptInputState = {
    variableName: string;
    prompt: string;
    resolve: (value: string) => void;
    isPassword?: boolean;
    selectOptions?: string[];
};

export type SelectLoopState = {
    variableName: string;
    options: string[];
    body: string[];
};

export type Package = {
    name: string;
    version: string;
    description: string;
    commands: string[];
    script: string;
};

export type PackageRepository = Package[];

export type HereDocState = {
    command: string;
    delimiter: string;
    lines: string[];
};

// --- Reporting Types ---
export type HealthReportDiskUsage = {
    filesystem: string;
    size: string;
    used: string;
    avail: string;
    use_percent: string;
    mounted_on: string;
    status: 'OK' | 'WARNING';
};

export type HealthReportProcess = {
    user: string;
    pid: string;
    cpu_percent: string;
    mem_percent: string;
    command: string;
    status: 'OK' | 'WARNING';
};

export type HealthReport = {
    overall_status: string;
    disk_usage: HealthReportDiskUsage[];
    top_processes: HealthReportProcess[];
};

export type AiUsageReport = {
    vimAiEdits: number;
    geminiCommands: number;
    learnedCorrections: number;
    refactors: number;
};

export type TransparencyReport = {
    summary: string;
    pattern_analysis: string;
    suggestion: string;
};

export type SecurityFinding = {
    filePath: string;
    riskLevel: 'High' | 'Medium' | 'Low' | 'Info';
    issue: string;
    suggestion: string;
};

export type SecurityReport = {
    summary: string;
    findings: SecurityFinding[];
};

export type EvolutionSuggestion = {
    type: 'alias' | 'function';
    name: string;
    value: string;
    explanation: string;
};

export type CritiqueFinding = {
    line: number;
    severity: 'High' | 'Medium' | 'Low';
    issue: string;
    suggestion: string;
};

export type CritiqueReport = {
    summary: string;
    findings: CritiqueFinding[];
};

export type OrganizationPlan = {
    commands: string[];
};

export type JournalEntry = {
    category: string;
    summary: string;
};

export type JournalReport = {
    entries: JournalEntry[];
};

export type IntentAnalysis = {
    isHarmful: boolean;
    reason: string;
};

export type AproposResult = {
    name: string;
    description: string;
};

export type AproposReport = {
    results: AproposResult[];
};

export type PortResult = {
    port: number;
    state: string;
    service: string;
};

export type PortScanReport = {
    results: PortResult[];
};

export type AuditFinding = {
    category: 'security' | 'performance' | 'style';
    filePath?: string;
    line?: number;
    issue: string;
    suggestion: string;
};

export type AuditReport = {
    summary: string;
    findings: AuditFinding[];
};

export type AuditHistoryEntry = {
    timestamp: string;
    report: AuditReport;
};


export type LearningReport = {
    summary: string;
    key_points: string[];
    example: string;
};

export type GitDigestReport = {
    summary: string;
    key_changes: string[];
    affected_files: string[];
};

export type Device = {
    id: string;
    type: string;
    properties: {
        [key: string]: any;
    };
};

export type Devices = {
    [id: string]: Device;
};

export type ReflogEntry = {
    hash: string;
    action: string;
    timestamp: string;
};

export type GitServer = {
    [url: string]: GitRepository;
};

export type ShellOptions = {
    errexit: boolean;
    nounset: boolean;
    xtrace: boolean;
};

export type Session = {
    user: string;
    cwd: string;
    hostname: string;
    envVars: EnvironmentVariables;
    aliases: Aliases;
    functions: ShellFunctions;
    umask: string;
    fs: Directory;
    users: Users;
    groups: Groups;
    shellOptions: ShellOptions;
    bootTime: Date;
    mounts: MountPoint[];
    typescriptFile: string | null;
    kernelLog: string[];
    config: UserConfiguration;
    ltm: LongTermMemory;
    corrections: CorrectionMemory;
    // --- UI State within Session ---
    history: OutputLine[];
    commandHistory: string[];
    promptString: string;
    isChatMode: boolean;
    isAwaitingPassword: boolean;
    scriptInputState: ScriptInputState | null;
    hereDocState: HereDocState | null;
    isSearching: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResult: string | null;
    liveViewCommand: LiveViewCommand | null;
    vimState: VimState | null;
    lessState: LessState | null;
    watchState: WatchState | null;
    watchOutput: string;
    blameState: BlameState | null;
    rebaseState: RebaseState | null;
    gdbState: GdbState | null;
    tailState: TailState | null;
    tailOutput: string;
    pendingConfirmation: ConfirmationState | null;
    isExecutingScript: boolean;
    systemSummary: SystemSummary;
    processes: Process[];
    networkState: { [key: string]: NetConnection };
    jobs: Job[];
    completedJobs: Job[];
    foregroundJob: Job | null;
    lastExitCode: number;
    firewallState: FirewallState;
    networkInterfaces: { [key: string]: NetworkInterface };
    atJobState: AtJobState | null;
    completionCandidates: string[];
};

export type AtJob = {
    id: number;
    time: Date;
    command: string;
    user: string;
};

export type AtJobState = {
    time: Date;
    user: string;
    lines: string[];
};

export type CronJob = {
    schedule: string;
    command: string;
    user: string;
};

export type MountPoint = {
    device: string;
    path: string;
    type: string;
};

export type ProjectScaffold = {
    [filePath: string]: string;
};

export type Service = {
    name: string;
    pid: number | null;
    enabled: boolean;
};

export type ServiceDefinition = {
    execStart: string;
    description: string;
};

export type ExecutionContext = {
    env: EnvironmentVariables;
    aliases: Aliases;
    functions: ShellFunctions;
    cwd: string;
    user: User;
    users: Users;
    groups: Groups;
    fs: Directory;
    pids: number[];
    trace?: (syscall: string) => void;
    shellOptions: ShellOptions;
    isSubshell?: boolean;
    scriptPath?: string;
    scopeChain: Scope[];
};

export type ScriptArgument = {
    name: string;
    description: string;
};

export type ScriptDocumentation = {
    name: string;
    synopsis: string;
    description: string;
    arguments: ScriptArgument[];
};

export type ConventionalCommit = {
    type: string;
    scope?: string;
    subject: string;
};

export type SystemReport = {
    summary: string;
    uptime: string;
    cpu_info: string;
    memory_usage: string;
    disk_usage: string;
    ip_address: string;
};

export type DebugFinding = {
    line: number;
    issue: string;
    explanation: string;
    suggestion: string;
};

export type DebugReport = {
    summary: string;
    findings: DebugFinding[];
    fixed_script: string;
};

export type OptimizationSuggestion = {
    type: 'file' | 'process';
    target: string;
    reason: string;
    command: string;
};

export type OptimizationReport = {
    summary: string;
    suggestions: OptimizationSuggestion[];
};

export type TraceEntry = {
    depth: number;
    command: string;
    stdout: string;
    stderr: string;
    syscalls: string[];
};

export type FirewallRule = {
    action: 'allow' | 'deny';
    port: string;
};

export type FirewallState = {
    enabled: boolean;
    rules: FirewallRule[];
};

export type IpAddress = {
    family: 'inet' | 'inet6';
    address: string;
    prefix: number;
};

export type NetworkInterface = {
    name: string;
    mac: string;
    flags: string[];
    addresses: IpAddress[];
};

export type NetworkState = {
    [port: number]: NetConnection;
};

export type NetConnection = {
    protocol: 'tcp' | 'udp';
    localAddress: string;
    foreignAddress: string;
    state: 'LISTEN' | 'ESTABLISHED' | '';
    pid: number | null;
    programName: string | null;
};

export type MakefileRule = {
    target: string;
    dependencies: string[];
    recipe: string[];
};

export type MakefileVariable = {
    name: string;
    value: string;
};

export type Makefile = {
    rules: MakefileRule[];
    variables: MakefileVariable[];
};

export type FcState = {
    command: string;
    filePath: string;
};

export type GitRemote = {
    name: string;
    url: string;
};

export type GitTag = {
    name: string;
    hash: string;
};

export type SshConfig = {
    [host: string]: {
        [key: string]: string;
    };
};

export type TroubleshootingStep = {
    command: string;
    explanation: string;
};

export type TroubleshootingReport = {
    analysis: string;
    cause: string;
    solution_steps: TroubleshootingStep[];
};

export type HistoryTask = {
    goal: string;
    key_commands: string[];
};

export type HistoryDigestReport = {
    tasks: HistoryTask[];
};

export type OIResult = {
    kind: 'python' | 'shell';
    input: string;
    output: string;
    error?: string;
    success: boolean;
    dryRun: boolean;
};

export type OIHistoryEntry = {
    timestamp: string;
    command: string;
    result: OIResult;
};