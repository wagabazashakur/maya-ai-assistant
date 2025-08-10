import React from 'react';
import { diffLines } from 'diff';
import { 
    UserConfiguration, Session, DiffData
} from '../types';
import { DiffView } from './DiffView';
import { TopView } from './TopView';
import { VimView } from './VimView';
import { LessView } from './LessView';
import { WatchView } from './WatchView';
import { BlameView } from './BlameView';
import { RebaseView } from './RebaseView';
import { GdbView } from './GdbView';
import { TailView } from './TailView';

interface CliPanelProps {
    isProcessing: boolean;
    command: string;
    setCommand: (cmd: string) => void;
    handleFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    outputAreaRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLInputElement>;
    updateConfig: (key: keyof UserConfiguration, value: any) => void;
    onVimExit: (layout: any, action?: string) => void;
    onLessExit: () => void;
    onBlameExit: () => void;
    onRebaseExit: (newTodo: string | null) => void;
    onGdbExit: (command: string) => void;
    currentSession: Session;
    onVimAiEdit: () => void;
    onTailExit: () => void;
    // --- Phase 3 autocomplete ---
    provideCompletions?: (input: string) => string[];
    navigateCompletion?: (dir: 'up'|'down') => void;
    acceptCompletion?: () => string | void;
    completionCandidates?: string[];
    completionIndex?: number;
}

const AnsiColoredText: React.FC<{ text: string }> = ({ text }) => {
    // ... (This component remains the same)
    const colorMap: { [key: string]: string } = {
        'dir': 'ls-color-dir',
        'exec': 'ls-color-exec',
        'link': 'ls-color-link',
        'archive': 'ls-color-archive',
        'fifo': 'ls-color-fifo',
        'bold': 'ansi-bold',
        'prompt': 'prompt-color',
        'success': 'success-color',
        'warning': 'warning-color',
        'error': 'error-color',
    };

    const parseText = (text: string) => {
        const nodes: React.ReactNode[] = [];
        const stack: { tag: string; children: React.ReactNode[] }[] = [{ tag: 'root', children: nodes }];
        let lastIndex = 0;
        const regex = /\[(\/?)([\w-]+)\]/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const plainText = text.substring(lastIndex, match.index);
            if (plainText) {
                stack[stack.length - 1].children.push(plainText);
            }
            const isClosing = match[1] === '/';
            const tag = match[2];

            if (isClosing) {
                if (stack.length > 1 && stack[stack.length - 1].tag === tag) {
                    const completedNode = stack.pop()!;
                    const colorClass = colorMap[completedNode.tag] || '';
                    stack[stack.length - 1].children.push(
                        <span className={colorClass} key={`${match.index}-${tag}`}>
                            {completedNode.children}
                        </span>
                    );
                } else {
                    stack[stack.length - 1].children.push(match[0]);
                }
            } else {
                stack.push({ tag, children: [] });
            }
            lastIndex = regex.lastIndex;
        }
        const remainingText = text.substring(lastIndex);
        if (remainingText) {
            stack[stack.length - 1].children.push(remainingText);
        }
        while (stack.length > 1) {
            const unclosed = stack.pop()!;
            const openingTagText = `[${unclosed.tag}]`;
            stack[stack.length - 1].children.push(openingTagText, ...unclosed.children);
        }
        return nodes;
    };
    return <>{parseText(text)}</>;
};


export const CliPanel: React.FC<CliPanelProps> = ({
    isProcessing,
    command,
    setCommand,
    handleFormSubmit,
    handleKeyDown,
    outputAreaRef,
    inputRef,
    updateConfig,
    onVimExit,
    onLessExit,
    onBlameExit,
    onRebaseExit,
    onGdbExit,
    currentSession,
    onVimAiEdit,
    onTailExit,
    provideCompletions,
    navigateCompletion,
    acceptCompletion,
    completionCandidates,
    completionIndex
}) => {
    // Destructure UI state from the session object
    const {
        isAwaitingPassword,
        scriptInputState,
        atJobState,
        hereDocState,
        isChatMode,
        isSearching,
        searchQuery,
        setSearchQuery,
        searchResult,
        promptString,
        liveViewCommand,
        pendingConfirmation,
        vimState,
        lessState,
        watchState,
        watchOutput,
        blameState,
        rebaseState,
        gdbState,
        tailState,
        tailOutput,
        // completionCandidates from session kept for back-compat, but prefer props when present
        completionCandidates: sessionCompletions,
        isExecutingScript,
        systemSummary,
        processes,
        history
    } = currentSession;

    const getPromptText = () => {
        if (isAwaitingPassword) return `[sudo] password for ${currentSession.user}: `;
        if (scriptInputState) {
             if (scriptInputState.selectOptions) {
                return currentSession.envVars['PS3'] as string || '#? ';
             }
             return scriptInputState.prompt;
        }
        if (atJobState) return `at> `;
        if (hereDocState) return `> `;
        if (isChatMode) return `[CHAT] > `;
        if (isSearching) return `(reverse-i-search): `;
        return promptString || '$ ';
    };
    
    const inputValue = isSearching ? searchQuery : command;
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        isSearching ? setSearchQuery(val) : setCommand(val);
        if (!isSearching && provideCompletions) {
            provideCompletions(val);
        }
    };

    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // First let upstream handle terminal keydown
        handleKeyDown(e);
        if (e.defaultPrevented) return;
        if (!provideCompletions) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); navigateCompletion && navigateCompletion('down'); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); navigateCompletion && navigateCompletion('up'); }
        else if (e.key === 'Enter') {
            const accepted = acceptCompletion && acceptCompletion();
            if (accepted) e.preventDefault();
        }
    };

    const visibleCompletions = completionCandidates || sessionCompletions || [];

    const isInputDisabled = isProcessing || 
                          (isExecutingScript && !scriptInputState && !atJobState) || 
                          !!liveViewCommand;

    const handleToggleSecondaryDisplay = () => {
        updateConfig('secondary_display_visible', !currentSession.config.secondary_display_visible);
    };

    const renderMainView = () => {
        if (liveViewCommand === 'top') {
            return <TopView summary={systemSummary} processes={processes} />;
        }
        if (liveViewCommand === 'vim' && vimState) {
            return <VimView vimState={vimState} onExit={onVimExit} config={currentSession.config} onAiEditComplete={onVimAiEdit} />;
        }
        if (liveViewCommand === 'less' && lessState) {
            return <LessView lessState={lessState} onExit={onLessExit} />;
        }
        if (liveViewCommand === 'watch' && watchState) {
            return <WatchView watchState={watchState} output={watchOutput} />;
        }
        if (liveViewCommand === 'blame' && blameState) {
            return <BlameView blameState={blameState} onExit={onBlameExit} />;
        }
        if (liveViewCommand === 'rebase' && rebaseState) {
            return <RebaseView rebaseState={rebaseState} onExit={onRebaseExit} />;
        }
        if (liveViewCommand === 'gdb' && gdbState) {
            return <GdbView gdbState={gdbState} onExit={onGdbExit} />;
        }
        if (liveViewCommand === 'tail' && tailState) {
            return <TailView tailState={tailState} output={tailOutput} onExit={onTailExit} />;
        }
        if (pendingConfirmation?.level === 'refactor_review') {
            return (
                <DiffView 
                    originalContent={pendingConfirmation.originalContent || ''}
                    refactoredContent={pendingConfirmation.refactoredContent || ''}
                />
            );
        }
        return (
            history.map(line => {
                 if (line.role === 'diff' && line.diffData) {
                    return (
                        <div key={line.id} className="output-line diff">
                           <DiffOutput diffData={line.diffData} />
                        </div>
                    );
                }
                const textContent = line.text;
                const roleClass = line.role;

                return (
                    <div key={line.id} className={`output-line ${roleClass}`}>
                        {line.isLoading ? <div className="spinner"></div> : <AnsiColoredText text={textContent} />}
                    </div>
                );
            })
        );
    };

    return (
        <div className="panel cli-panel">
             <button onClick={handleToggleSecondaryDisplay} className="display-toggle" title="Toggle Secondary Display">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 0a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zM2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm10.5 1.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V3H10a.5.5 0 0 1 0-1zm-4 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V3H6a.5.5 0 0 1 0-1zM2 5.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
                </svg>
            </button>
            <div className="output-area" ref={outputAreaRef}>
                 {renderMainView()}
            </div>
            {visibleCompletions && visibleCompletions.length > 0 && (
                <div className="completion-list" role="listbox">
                    {visibleCompletions.map((c, idx) => (
                        <div
                          key={c}
                          className={`completion-item${(completionIndex ?? -1) === idx ? ' selected' : ''}`}
                          role="option"
                          aria-selected={(completionIndex ?? -1) === idx}
                        >{c}</div>
                    ))}
                </div>
            )}
            <form className="input-area" onSubmit={handleFormSubmit}>
                <span className="prompt">{getPromptText()}</span>
                <input
                    id="command-input"
                    type={isAwaitingPassword ? "password" : "text"}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={onInputKeyDown}
                    disabled={isInputDisabled}
                    autoComplete="off"
                    ref={inputRef}
                    aria-label="Command Input"
                />
            </form>
            {isSearching && searchResult && (
                <div className="search-result">
                    <span>{searchResult}</span>
                </div>
            )}
        </div>
    );
};

const DiffOutput: React.FC<{ diffData: DiffData }> = ({ diffData }) => {
    // ... (This component remains the same)
    const changes = diffLines(diffData.original, diffData.new);
    return (
        <div className="diff-output">
            <pre>
                {changes.map((part, index) => {
                    const className = part.added ? 'added' : part.removed ? 'removed' : 'common';
                    const prefix = part.added ? '+' : part.removed ? '-' : ' ';
                    // Ensure the final newline is handled correctly
                    const lines = part.value.endsWith('\n') ? part.value.slice(0, -1).split('\n') : part.value.split('\n');

                    return lines.map((line, lineIndex) => (
                         <div key={`${index}-${lineIndex}`} className={`diff-output-line ${className}`}>
                            <span>{prefix} {line}</span>
                        </div>
                    ));
                })}
            </pre>
        </div>
    );
};
