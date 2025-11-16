import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GdbState, GdbFrame } from '../types';

interface GdbViewProps {
    gdbState: GdbState;
    onExit: (command: string) => void;
}

export const GdbView: React.FC<GdbViewProps> = ({ gdbState, onExit }) => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [breakpoints, setBreakpoints] = useState<number[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState<string>('');
    const codeViewRef = useRef<HTMLDivElement>(null);
    const [currentFramePath, setCurrentFramePath] = useState<number[]>([]);

    const { sourceCode, trace } = gdbState;
    const sourceLines = sourceCode ? sourceCode.split('\n') : [];
    
    const currentFrame = useMemo((): GdbFrame | null => {
        if (!trace) return null;
        let frame: GdbFrame | undefined = trace;
        for (const index of currentFramePath) {
            if (!frame?.children) return null;
            frame = frame.children[index];
        }
        return frame || null;
    }, [trace, currentFramePath]);
    
    const callStack = useMemo((): GdbFrame[] => {
        if (!trace) return [];
        const stack: GdbFrame[] = [];
        let current: GdbFrame | undefined = trace;
        stack.push(current);
        for (const index of currentFramePath) {
            if (!current?.children?.[index]) break;
            current = current.children[index];
            stack.push(current);
        }
        return stack;
    }, [trace, currentFramePath]);


    useEffect(() => {
        if (currentFrame?.line && codeViewRef.current) {
            const lineEl = codeViewRef.current.querySelector(`[data-line-number="${currentFrame.line}"]`);
            lineEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentFrame]);

    const handleCommandSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!command.trim()) return;

        setHistory(prev => [command, ...prev]);
        setHistoryIndex(-1);
        setOutput('');
        
        const [cmd, ...args] = command.trim().split(/\s+/);

        switch (cmd) {
            case 'q':
            case 'quit':
                onExit('');
                break;
            case 'r':
            case 'run':
                if (trace) {
                    setIsRunning(true);
                    setCurrentFramePath([]); // Start at root frame
                    if(trace.children && trace.children.length > 0) {
                        setCurrentFramePath([0]); // Immediately step to first instruction
                    }
                }
                break;
            case 's': // step
            case 'n': // next (simplified to act as step)
                 if (isRunning && currentFrame) {
                    const currentFrameInStack = callStack[callStack.length - 1];
                    const parentFrame = callStack.length > 1 ? callStack[callStack.length - 2] : null;

                    // If current frame has children, step into the first child (step into function)
                    if (currentFrameInStack.children && currentFrameInStack.children.length > 0) {
                        setCurrentFramePath([...currentFramePath, 0]);
                        break;
                    }

                    // No children, try to step to next sibling
                    if (parentFrame && parentFrame.children) {
                        const currentIndexInParent = parentFrame.children.findIndex(c => c === currentFrameInStack);
                        if (currentIndexInParent < parentFrame.children.length - 1) {
                            // Step to next sibling
                            const newPath = [...currentFramePath];
                            newPath[newPath.length - 1]++;
                            setCurrentFramePath(newPath);
                        } else {
                             // Last sibling, step out of function
                            const newPath = currentFramePath.slice(0, -1);
                            setCurrentFramePath(newPath);
                        }
                    } else {
                         // At root and no more children, program ends
                         setOutput('[Inferior 1 (process 1) exited normally]');
                         setIsRunning(false);
                    }
                } else {
                    setOutput('The program is not being run.');
                }
                break;
            case 'c':
            case 'continue':
                 if (isRunning && currentFrame) {
                    // This is complex, needs to walk the tree to find the next breakpoint
                    setOutput('Continue is not fully implemented yet.');
                } else {
                    setOutput('The program is not being run.');
                }
                break;
            case 'b':
            case 'break':
                const line = parseInt(args[0], 10);
                if (!isNaN(line) && line > 0 && line <= sourceLines.length) {
                    if (!breakpoints.includes(line)) {
                        setBreakpoints(prev => [...prev, line]);
                        setOutput(`Breakpoint ${breakpoints.length + 1} at file ${gdbState.executablePath}, line ${line}.`);
                    }
                } else {
                    setOutput('Invalid line number for breakpoint.');
                }
                break;
            case 'p':
            case 'print':
                if (isRunning && currentFrame) {
                    const varName = args[0];
                    if (currentFrame.variables && varName in currentFrame.variables) {
                        setOutput(`$1 = ${JSON.stringify(currentFrame.variables[varName])}`);
                    } else {
                        setOutput(`No symbol "${varName}" in current context.`);
                    }
                } else {
                    setOutput('The program is not being run.');
                }
                break;
            case 'bt':
            case 'backtrace':
                if (isRunning) {
                    const btOutput = callStack.map((frame, i) => `#${i}  0x... in ${frame.functionName} () at ${gdbState.executablePath}:${frame.line}`).join('\n');
                    setOutput(btOutput);
                } else {
                     setOutput('No stack.');
                }
                break;
            case 'up':
                if (isRunning && currentFramePath.length > 0) {
                    setCurrentFramePath(currentFramePath.slice(0, -1));
                } else {
                    setOutput('Initial frame selected; you cannot go up.');
                }
                break;
            case 'down':
                 if (isRunning && currentFrame && currentFrame.children && currentFrame.children.length > 0) {
                    setCurrentFramePath([...currentFramePath, 0]);
                } else {
                    setOutput('Bottom (most nested) frame selected; you cannot go down.');
                }
                break;
            default:
                setOutput(`Undefined command: "${cmd}". Try "help".`);
        }
        setCommand('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setCommand(history[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                 const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(history[newIndex]);
            } else {
                setHistoryIndex(-1);
                setCommand('');
            }
        }
    };

    return (
        <div className="gdb-view">
            <div className="gdb-main">
                <div className="gdb-code" ref={codeViewRef}>
                    {sourceLines.map((line, i) => (
                        <div key={i} className={`gdb-code-line ${currentFrame?.line === i + 1 ? 'current-line' : ''} ${breakpoints.includes(i + 1) ? 'breakpoint' : ''}`} data-line-number={i + 1}>
                            <span className="gdb-line-number">{String(i + 1).padStart(3)}</span>
                            <span className="gdb-line-content">{line}</span>
                        </div>
                    ))}
                </div>
                <div className="gdb-sidebar">
                    <div className="gdb-panel">
                        <h3>Call Stack</h3>
                        <ul>
                            {callStack.map((frame, i) => (
                                <li key={i} className={frame === currentFrame ? 'active-frame' : ''}>
                                    <code>#{i} {frame.functionName} at line {frame.line}</code>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="gdb-panel">
                        <h3>Variables</h3>
                        <ul>
                            {currentFrame && currentFrame.variables && Object.entries(currentFrame.variables).map(([name, value]) => (
                                <li key={name}><code>{name} = {String(value)}</code></li>
                            ))}
                        </ul>
                    </div>
                     <div className="gdb-panel">
                        <h3>Breakpoints</h3>
                        <ul>
                            {breakpoints.map((bp, i) => (
                                <li key={i}><code>{i + 1}: {gdbState.executablePath}:{bp}</code></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="gdb-output">
                {output && <pre>{output}</pre>}
            </div>
            <div className="gdb-input">
                <form onSubmit={handleCommandSubmit}>
                    <span>(gdb) </span>
                    <input
                        type="text"
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </form>
            </div>
        </div>
    );
};