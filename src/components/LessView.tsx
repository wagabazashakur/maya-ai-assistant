import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LessState } from '../types';

interface LessViewProps {
    lessState: LessState;
    onExit: () => void;
}

export const LessView: React.FC<LessViewProps> = ({ lessState, onExit }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [viewHeight, setViewHeight] = useState(20); // Default height in lines
    const contentRef = useRef<HTMLDivElement>(null);
    const lines = useMemo(() => lessState.content.split('\n'), [lessState.content]);
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [matches, setMatches] = useState<number[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    useEffect(() => {
        const calculateViewHeight = () => {
            if (contentRef.current) {
                const lineHeight = 1.5 * 16; // Assumes 1em = 16px and line-height is 1.5
                const height = contentRef.current.clientHeight;
                setViewHeight(Math.floor(height / lineHeight));
            }
        };

        calculateViewHeight();
        window.addEventListener('resize', calculateViewHeight);
        return () => window.removeEventListener('resize', calculateViewHeight);
    }, []);

    const search = (query: string) => {
        if (!query) return;
        const newMatches = lines.reduce((acc, line, index) => {
            if (line.includes(query)) {
                acc.push(index);
            }
            return acc;
        }, [] as number[]);
        setMatches(newMatches);
        if (newMatches.length > 0) {
            const firstMatch = newMatches.find(m => m >= scrollTop) || newMatches[0];
            setCurrentMatchIndex(newMatches.indexOf(firstMatch));
            setScrollTop(Math.max(0, firstMatch - Math.floor(viewHeight / 2)));
        } else {
            setCurrentMatchIndex(-1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (searchMode) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    setSearchMode(false);
                    search(searchQuery);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setSearchMode(false);
                    setSearchQuery('');
                } else if (e.key === 'Backspace') {
                    setSearchQuery(q => q.slice(0, -1));
                } else if (e.key.length === 1) {
                    setSearchQuery(q => q + e.key);
                }
                return;
            }

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
                case '/':
                    setSearchMode(true);
                    setSearchQuery('');
                    break;
                case 'n':
                    if (matches.length > 0) {
                        const nextIndex = (currentMatchIndex + 1) % matches.length;
                        setCurrentMatchIndex(nextIndex);
                        setScrollTop(Math.max(0, matches[nextIndex] - Math.floor(viewHeight / 2)));
                    }
                    break;
                case 'N':
                     if (matches.length > 0) {
                        const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
                        setCurrentMatchIndex(prevIndex);
                        setScrollTop(Math.max(0, matches[prevIndex] - Math.floor(viewHeight / 2)));
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onExit, lines.length, viewHeight, searchMode, matches, currentMatchIndex, searchQuery]);

    const highlightText = (text: string) => {
        if (!searchQuery || !text.includes(searchQuery)) {
            return text;
        }
        const parts = text.split(new RegExp(`(${searchQuery})`, 'g'));
        return (
            <>
                {parts.map((part, i) =>
                    part === searchQuery ? <span key={i} className="less-highlight">{part}</span> : part
                )}
            </>
        );
    };

    const visibleLines = lines.slice(scrollTop, scrollTop + viewHeight);
    const isAtEnd = scrollTop >= lines.length - viewHeight;

    const getStatusBarText = () => {
        if (searchMode) return `/${searchQuery}`;
        if (matches.length > 0) return `${lessState.filePath} (${currentMatchIndex + 1}/${matches.length})`;
        return isAtEnd ? `${lessState.filePath} (END)` : `${lessState.filePath} :${scrollTop + 1}`;
    };

    return (
        <div className="less-view">
            <div className="less-content" ref={contentRef}>
                <pre>
                    {visibleLines.map((line, index) => <div key={scrollTop + index}>{highlightText(line)}</div>)}
                </pre>
            </div>
            <div className="less-status-bar">
                <span>{getStatusBarText()}</span>
            </div>
        </div>
    );
};