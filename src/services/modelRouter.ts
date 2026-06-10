import type { IModelProvider, GenerateOptions, GenerateResult } from '../domain/IModelProvider';
import { MODEL_CONFIGS, DEFAULT_TIER, type ModelTier } from '../config/model';
import { OpenAIProvider } from '../providers/openai/provider';
import { AnthropicProvider } from '../providers/anthropic/provider';
import { LocalProvider } from '../providers/local/provider';

class ModelRouter {
  private providers: Map<string, IModelProvider> = new Map();
  private cache: Map<string, GenerateResult> = new Map();
  private cacheMaxSize = 100;

  constructor() {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('local', new LocalProvider());
  }

  private getCacheKey(options: GenerateOptions, tier: ModelTier): string {
    return `${tier}:${options.systemPrompt || ''}:${options.prompt}`;
  }

  async generate(
    options: GenerateOptions,
    tier: ModelTier = DEFAULT_TIER
  ): Promise<GenerateResult> {
    const cacheKey = this.getCacheKey(options, tier);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const config = MODEL_CONFIGS[tier];
    const provider = this.providers.get(config.provider);

    if (!provider) {
      throw new Error(`Provider ${config.provider} not found`);
    }

    const available = await provider.isAvailable();
    if (!available) {
      return this.fallbackToCheaper(options, tier);
    }

    const result = await provider.generate({
      ...options,
      temperature: options.temperature ?? config.temperature,
      maxTokens: options.maxTokens ?? config.maxTokens,
    });

    this.addToCache(cacheKey, result);
    return result;
  }

  private async fallbackToCheaper(
    options: GenerateOptions,
    currentTier: ModelTier
  ): Promise<GenerateResult> {
    const tiers: ModelTier[] = ['balanced', 'cheap'];
    const currentIndex = tiers.indexOf(currentTier);

    for (let i = currentIndex + 1; i < tiers.length; i++) {
      const fallbackTier = tiers[i];
      const config = MODEL_CONFIGS[fallbackTier];
      const provider = this.providers.get(config.provider);

      if (provider && await provider.isAvailable()) {
        return provider.generate({
          ...options,
          temperature: options.temperature ?? config.temperature,
          maxTokens: options.maxTokens ?? config.maxTokens,
        });
      }
    }

    throw new Error('No model provider available');
  }

  private addToCache(key: string, result: GenerateResult): void {
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, result);
  }

  getCostEstimate(result: GenerateResult): number {
    return (result.tokensUsed / 1000) * 0.0015;
  }
}

export const modelRouter = new ModelRouter();
