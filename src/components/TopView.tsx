import React from 'react';
import { Process, SystemSummary } from '../types';

interface TopViewProps {
    summary: SystemSummary;
    processes: Process[];
}

export const TopView: React.FC<TopViewProps> = ({ summary, processes }) => {
    return (
        <div className="top-view">
            <div className="top-summary">
                <pre>
                    top - {new Date().toLocaleTimeString()}<br/>
                    Tasks: {summary.tasks} total<br/>
                    %Cpu(s): {summary.cpu.toFixed(1)} us<br/>
                    MiB Mem : 16384.0 total, {summary.mem.toFixed(1)} used
                </pre>
            </div>
            <div className="top-processes">
                <table className="top-table">
                    <thead>
                        <tr>
                            <th className="right-align">PID</th>
                            <th>USER</th>
                            <th className="right-align">%CPU</th>
                            <th className="right-align">%MEM</th>
                            <th>COMMAND</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processes.map(p => 
                            <tr key={p.pid}>
                                <td className="right-align">{p.pid}</td>
                                <td>{p.user}</td>
                                <td className="right-align">{p.cpu.toFixed(1)}</td>
                                <td className="right-align">{p.mem.toFixed(1)}</td>
                                <td>{p.command}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};