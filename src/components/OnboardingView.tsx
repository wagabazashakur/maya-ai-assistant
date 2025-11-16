import React, { useState } from 'react';
import { OnboardingStatus, UserConfiguration } from '../types';

interface OnboardingViewProps {
    onFinish: () => void;
    config: UserConfiguration;
    updateConfig: (key: keyof UserConfiguration, value: any) => void;
}

const OnboardingStep: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="onboarding-step">{children}</div>
);

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onFinish, config, updateConfig }) => {
    const [step, setStep] = useState<OnboardingStatus>('welcome');

    const handleThemeChange = (newTheme: 'dark' | 'light') => {
        updateConfig('theme', newTheme);
    };

    const handleFinish = () => {
        onFinish();
    }

    const renderStep = () => {
        switch (step) {
            case 'welcome':
                return (
                    <OnboardingStep>
                        <h1>Welcome to Maya V.1</h1>
                        <p>I am an intelligent command-line assistant designed to learn and evolve. I can help you with a variety of tasks, from managing files to generating code and searching the web.</p>
                        <p>Let's take a moment to personalize your experience.</p>
                         <div className="onboarding-nav">
                            <button onClick={handleFinish}>Skip</button>
                            <button className="primary" onClick={() => setStep('theme')}>Next</button>
                        </div>
                    </OnboardingStep>
                );
            case 'theme':
                return (
                     <OnboardingStep>
                        <h2>Choose a Theme</h2>
                        <p>Select the visual style that's easiest on your eyes.</p>
                         <div className="theme-selector">
                             <button className={config.theme === 'dark' ? 'active' : ''} onClick={() => handleThemeChange('dark')}>Dark</button>
                             <button className={config.theme === 'light' ? 'active' : ''} onClick={() => handleThemeChange('light')}>Light</button>
                         </div>
                         <div className="onboarding-nav">
                            <button onClick={() => setStep('welcome')}>Back</button>
                            <button className="primary" onClick={handleFinish}>Finish Setup</button>
                        </div>
                    </OnboardingStep>
                )
            default:
                return null;
        }
    }

    return (
        <div className="onboarding-view">
            <div className="onboarding-modal" data-theme={config.theme}>
                {renderStep()}
            </div>
        </div>
    );
};