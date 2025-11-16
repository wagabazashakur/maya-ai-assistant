import React from 'react';
import { diffLines } from 'diff';

interface DiffViewProps {
    originalContent: string;
    refactoredContent: string;
}

export const DiffView: React.FC<DiffViewProps> = ({ originalContent, refactoredContent }) => {
    const changes = diffLines(originalContent, refactoredContent);

    return (
        <div className="diff-view">
            <pre>
                {changes.map((part, index) => {
                    const className = part.added ? 'added' : part.removed ? 'removed' : 'common';
                    const lines = part.value.split('\n').filter((line, i, arr) => line || i < arr.length -1);
                    return lines.map((line, lineIndex) => (
                         <div key={`${index}-${lineIndex}`} className={`diff-line ${className}`}>
                            <span className="diff-prefix">{part.added ? '+' : part.removed ? '-' : ' '}</span>
                            <span>{line}</span>
                        </div>
                    ));
                })}
            </pre>
        </div>
    );
};