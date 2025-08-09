import React from 'react';
import { WatchState } from '../types';

interface WatchViewProps {
    watchState: WatchState;
    output: string;
}

export const WatchView: React.FC<WatchViewProps> = ({ watchState, output }) => {
    return (
        <div className="watch-view">
            <div className="watch-header">
                Every {watchState.interval}s: {watchState.command}
                <span style={{ float: 'right' }}>{new Date().toLocaleString()}</span>
            </div>
            <div className="watch-output">
                <pre>{output}</pre>
            </div>
        </div>
    );
};