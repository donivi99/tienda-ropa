import type { IModelProvider, GenerateOptions, GenerateResult } from '../../domain/IModelProvider';

export class LocalProvider implements IModelProvider {
  readonly name = 'local';
  readonly costPer1kTokens = 0;

  private baseUrl: string;
  private model: string;

  constructor(model: string = 'llama3') {
    this.baseUrl = import.meta.env.VITE_LOCAL_MODEL_URL || 'http://localhost:11434';
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const start = performance.now();

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: options.prompt,
        system: options.systemPrompt,
        options: {
          temperature: options.temperature ?? 0.3,
          num_predict: options.maxTokens ?? 500,
        },
      }),
    });

    const data = await response.json();
    const latencyMs = performance.now() - start;

    return {
      text: data.response,
      tokensUsed: data.eval_count || 0,
      model: this.model,
      latencyMs,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
