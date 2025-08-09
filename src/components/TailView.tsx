

import React, { useEffect, useRef } from 'react';
import { TailState } from '../types';

interface TailViewProps {
    tailState: TailState;
    output: string;
    onExit: () => void;
}

export const TailView: React.FC<TailViewProps> = ({ tailState, output, onExit }) => {
    const contentRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [output]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                onExit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onExit]);

    return (
        <div className="tail-view">
            <div className="tail-content">
                <pre ref={contentRef}>{output}</pre>
            </div>
            <div className="less-status-bar">
                <span>{tailState.filePath} (Press Ctrl+C to quit)</span>
            </div>
        </div>
    );
};
