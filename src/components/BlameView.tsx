import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BlameState } from '../types';

interface BlameViewProps {
    blameState: BlameState;
    onExit: () => void;
}

export const BlameView: React.FC<BlameViewProps> = ({ blameState, onExit }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [viewHeight, setViewHeight] = useState(20); 
    const contentRef = useRef<HTMLDivElement>(null);
    const { lines } = blameState;

    useEffect(() => {
        const calculateViewHeight = () => {
            if (contentRef.current) {
                const lineHeight = 1.5 * 16;
                const height = contentRef.current.clientHeight;
                setViewHeight(Math.floor(height / lineHeight));
            }
        };

        calculateViewHeight();
        window.addEventListener('resize', calculateViewHeight);
        return () => window.removeEventListener('resize', calculateViewHeight);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            switch (e.key) {
                case 'q':
                    onExit();
                    break;
                case 'j':
                case 'ArrowDown':
                    setScrollTop(prev => Math.min(lines.length - viewHeight, prev + 1));
                    break;
                case 'k':
                case 'ArrowUp':
                    setScrollTop(prev => Math.max(0, prev - 1));
                    break;
                case ' ': // Spacebar for page down
                    setScrollTop(prev => Math.min(lines.length - viewHeight, prev + viewHeight));
                    break;
                case 'b': // 'b' for page up
                    setScrollTop(prev => Math.max(0, prev - viewHeight));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onExit, lines.length, viewHeight]);
    
    const visibleLines = lines.slice(scrollTop, scrollTop + viewHeight);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    }

    return (
        <div className="blame-view">
            <div className="blame-content" ref={contentRef}>
                <pre>
                    {visibleLines.map((line, index) => (
                        <div key={scrollTop + index} className="blame-line">
                            <span className="blame-meta">
                                <span className="blame-hash">{line.hash.substring(0, 8)}</span>
                                <span className="blame-author">{line.author.padEnd(10)}</span>
                                <span className="blame-date">{formatDate(line.date)}</span>
                                <span className="blame-linenum">{String(line.lineNum).padStart(4, ' ')}</span>
                            </span>
                            <span className="blame-code">{line.content}</span>
                        </div>
                    ))}
                </pre>
            </div>
        </div>
    );
};
