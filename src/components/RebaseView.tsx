import React, { useState, useEffect, useRef } from 'react';
import { RebaseState } from '../types';

interface RebaseViewProps {
    rebaseState: RebaseState;
    onExit: (newTodo: string | null) => void;
}

export const RebaseView: React.FC<RebaseViewProps> = ({ rebaseState, onExit }) => {
    const [todo, setTodo] = useState(rebaseState.todos.map(t => `${t.action} ${t.hash.substring(0,7)} ${t.message}`).join('\n'));
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);
    
    const instructions = `
# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like "squash", but discard this commit's log message
# d, drop = remove commit
#
# These lines can be re-ordered; they are executed from top to bottom.
# If you remove a line here THAT COMMIT WILL BE LOST.
# However, if you remove everything, the rebase will be aborted.
`;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Simple save on Ctrl+S or similar could be added, but for now we rely on the button
    };
    
    const handleSave = () => {
        onExit(todo);
    };

    const handleAbort = () => {
        onExit(null);
    };

    return (
        <div className="rebase-view">
            <textarea
                ref={textareaRef}
                value={todo}
                onChange={(e) => setTodo(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck="false"
            />
            <pre className="rebase-instructions">{instructions}</pre>
            <div className="rebase-actions">
                 <button onClick={handleAbort}>Abort</button>
                 <button onClick={handleSave} className="primary">Start Rebase</button>
            </div>
        </div>
    );
};
