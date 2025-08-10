import { UserConfiguration } from '../types';
import { getConfig as getPersisted, setConfig as setPersisted } from './memory';

const DEFAULTS: UserConfiguration = {
  theme: 'dark',
  secondary_display_visible: true,
  gemini_enabled: true,
  llm_provider: 'gemini',
  llm_model: 'gemini-2.5-flash',
};

export const getAppConfig = (): UserConfiguration => {
  const persisted = getPersisted() || {};
  return { ...DEFAULTS, ...(persisted as any) } as UserConfiguration;
};

export const setAppConfig = (partial: Partial<UserConfiguration>) => {
  const current = getAppConfig();
  const next: UserConfiguration = { ...current, ...partial } as UserConfiguration;
  setPersisted(next);
  return next;
};

export const DEFAULT_CONFIG = DEFAULTS;
