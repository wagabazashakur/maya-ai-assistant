import { Content } from '@google/genai';
import { GoogleGenAI, Type } from '@google/genai';
import { getConfig } from './memory';

export type LLMProviderName = 'gemini' | 'openai';

export type JSONSchemaLike = any; // For Gemini we pass @google/genai Type schema. Others may ignore/translate.

export interface GenerateJSONRequest {
  model?: string;
  prompt: string | Content[];
  schema: JSONSchemaLike;
  systemInstruction?: Content;
}

export interface GenerateTextRequest {
  model?: string;
  prompt: string | Content[];
  systemInstruction?: Content;
}

export interface LLMProvider {
  name: LLMProviderName;
  generateContentJSON(req: GenerateJSONRequest): Promise<string>;
  generateText(req: GenerateTextRequest): Promise<string>;
}

// --- Gemini Provider ---
let _gemini: GoogleGenAI | null = null;
const getGemini = () => {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (!_gemini && key) _gemini = new GoogleGenAI({ apiKey: key });
  if (!_gemini) throw new Error('VITE_GEMINI_API_KEY not set. Create .env.local with VITE_GEMINI_API_KEY=YOUR_KEY.');
  return _gemini;
};

const geminiProvider: LLMProvider = {
  name: 'gemini',
  async generateContentJSON(req: GenerateJSONRequest): Promise<string> {
    try {
      const contents = Array.isArray(req.prompt)
        ? (req.systemInstruction ? [req.systemInstruction, ...req.prompt] : req.prompt)
        : [{ role: 'user', parts: [{ text: req.prompt }]}];
      const response = await getGemini().models.generateContent({
        model: req.model || (getConfig().llm_model as string) || 'gemini-2.5-flash',
        contents,
        config: { responseMimeType: 'application/json', responseSchema: req.schema },
      } as any);
      return (response as any).text;
    } catch (e: any) {
      console.error('Gemini JSON generation failed:', e);
      return JSON.stringify({ error: e?.message || 'Gemini error' });
    }
  },
  async generateText(req: GenerateTextRequest): Promise<string> {
    try {
      const contents = Array.isArray(req.prompt)
        ? (req.systemInstruction ? [req.systemInstruction, ...req.prompt] : req.prompt)
        : [{ role: 'user', parts: [{ text: req.prompt }]}];
      const response = await getGemini().models.generateContent({
        model: req.model || (getConfig().llm_model as string) || 'gemini-2.5-flash',
        contents,
      } as any);
      return (response as any).text;
    } catch (e: any) {
      console.error('Gemini text generation failed:', e);
      return 'Error: Could not connect to the Gemini API.';
    }
  }
};

// --- OpenAI Provider (stub) ---
const openaiProvider: LLMProvider = {
  name: 'openai',
  async generateContentJSON(req: GenerateJSONRequest): Promise<string> {
    const payload = {
      provider: 'openai-stub',
      model: req.model || (getConfig().llm_model as string) || 'gpt-4o-mini',
      note: 'OpenAI provider is stubbed. Replace with real SDK integration.',
    };
    return JSON.stringify(payload);
  },
  async generateText(req: GenerateTextRequest): Promise<string> {
    return '[openai-stub] This is a placeholder response. Configure real OpenAI integration to enable.';
  }
};

let _active: LLMProvider | null = null;
let _activeKey = '';

export const getProvider = (name: string): LLMProvider => {
  return name === 'openai' ? openaiProvider : geminiProvider;
};

export const getLLM = (): LLMProvider => {
  const cfg = getConfig();
  const provider = (cfg.llm_provider as LLMProviderName) || 'gemini';
  const model = (cfg.llm_model as string) || (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
  const key = `${provider}|${model}`;
  if (_active && _activeKey === key) return _active;
  _activeKey = key;
  _active = provider === 'openai' ? openaiProvider : geminiProvider;
  return _active;
};

// Convenience functions matching requested signatures
export const generateContentJSON = async (schemaReq: any): Promise<any> => {
  return getLLM().generateContentJSON(schemaReq);
};
export const generateText = async (prompt: string): Promise<string> => {
  return getLLM().generateText({ prompt });
};

export const LLMType = { Type };
