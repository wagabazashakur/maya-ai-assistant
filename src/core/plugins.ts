import React from 'react';
import type { Session } from '../types';

export type CommandSafety = 'safe' | 'risky';

export type PluginCommandHandlerContext = {
  argv: string[];
  subCmd: string;
  session: Session | undefined;
};

export type PluginCommand = {
  name: string; // subcommand after 'maya '
  classify: CommandSafety;
  handler: (ctx: PluginCommandHandlerContext) => Promise<{ stdout: string; stderr?: string; success: boolean }>;
};

export type Plugin = {
  name: string;
  commands: PluginCommand[];
  uiPanels?: Array<(props: { currentSession: Session }) => React.ReactNode>;
};

const registry: Plugin[] = [];

export const registerPlugin = (plugin: Plugin) => {
  // Avoid duplicate registration by name
  if (registry.find(p => p.name === plugin.name)) return;
  registry.push(plugin);
};

export const getPlugins = (): Plugin[] => registry.slice();

export const findPluginCommand = (subCmd: string): { plugin: Plugin; command: PluginCommand } | null => {
  for (const plugin of registry) {
    const cmd = plugin.commands.find(c => c.name === subCmd);
    if (cmd) return { plugin, command: cmd };
  }
  return null;
};
