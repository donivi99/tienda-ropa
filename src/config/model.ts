export type ModelTier = 'cheap' | 'balanced' | 'premium';

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  tier: ModelTier;
}

export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  cheap: {
    provider: import.meta.env.VITE_MODEL_PROVIDER as 'openai' | 'anthropic' | 'local' || 'openai',
    model: import.meta.env.VITE_MODEL_NAME || 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 500,
    tier: 'cheap',
  },
  balanced: {
    provider: import.meta.env.VITE_MODEL_PROVIDER as 'openai' | 'anthropic' | 'local' || 'openai',
    model: import.meta.env.VITE_MODEL_NAME || 'gpt-4o',
    temperature: 0.5,
    maxTokens: 1000,
    tier: 'balanced',
  },
  premium: {
    provider: import.meta.env.VITE_MODEL_PROVIDER as 'openai' | 'anthropic' | 'local' || 'anthropic',
    model: import.meta.env.VITE_MODEL_NAME || 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 2000,
    tier: 'premium',
  },
};

export const DEFAULT_TIER: ModelTier =
  (import.meta.env.VITE_MODEL_TIER as ModelTier) || 'cheap';
