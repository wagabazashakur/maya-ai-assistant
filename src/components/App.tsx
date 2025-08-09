import React, { useEffect } from 'react';
import { useMaya } from '../hooks/useMaya';
import { CliPanel } from './CliPanel';
import { LogPanel } from './LogPanel';
import { OnboardingView } from './OnboardingView';

export const App: React.FC = () => {
    const mayaState = useMaya();

    useEffect(() => {
        if (mayaState.currentSession?.config?.theme) {
            document.body.dataset.theme = mayaState.currentSession.config.theme;
        }
    }, [mayaState.currentSession?.config?.theme]);

    if (!mayaState.onboardingComplete) {
        return (
            <OnboardingView
                onFinish={mayaState.handleFinishOnboarding}
                config={mayaState.config}
                updateConfig={mayaState.updateConfig}
            />
        );
    }
    
    if (mayaState.isProcessing && !mayaState.currentSession) {
        return <div className="app-container" data-theme={mayaState.config?.theme || 'dark'}><div className="spinner"></div></div>;
    }

    if (!mayaState.currentSession) {
        return <div className="app-container" data-theme={mayaState.config?.theme || 'dark'}>Error: Session not available.</div>;
    }

    return (
        <div 
            className="app-container"
        >
            <CliPanel
                // Pass the entire session object for UI state
                currentSession={mayaState.currentSession}
                // Top-level state and handlers
                isProcessing={mayaState.isProcessing}
                command={mayaState.command}
                setCommand={mayaState.setCommand}
                handleFormSubmit={mayaState.handleFormSubmit}
                handleKeyDown={mayaState.handleKeyDown}
                outputAreaRef={mayaState.outputAreaRef}
                inputRef={mayaState.inputRef}
                updateConfig={mayaState.updateConfig}
                // Live view exit handlers
                onVimExit={mayaState.handleVimSaveAndExit}
                onLessExit={mayaState.handleLessExit}
                onBlameExit={mayaState.handleBlameExit}
                onRebaseExit={mayaState.onRebaseExit}
                onGdbExit={mayaState.onGdbExit}
                onTailExit={mayaState.handleTailExit}
                // Callbacks
                onVimAiEdit={mayaState.onVimAiEdit}
            />
            {mayaState.currentSession.config.secondary_display_visible && (
                 <LogPanel
                    logs={mayaState.logs}
                    currentSession={mayaState.currentSession}
                    panelVisibility={mayaState.panelVisibility}
                    updatePanelVisibility={mayaState.updatePanelVisibility}
                    gitLog={mayaState.gitLog}
                    auditHistory={mayaState.auditHistory}
                    explainHistory={mayaState.explainHistory}
                    runAudit={mayaState.runAudit}
                    clearAuditHistory={mayaState.clearAuditHistory}
                    clearExplainHistory={mayaState.clearExplainHistory}
                />
            )}
        </div>
    );
};
