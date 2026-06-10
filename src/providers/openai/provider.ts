import type { IModelProvider, GenerateOptions, GenerateResult } from '../../domain/IModelProvider';

export class OpenAIProvider implements IModelProvider {
  readonly name = 'openai';
  readonly costPer1kTokens = 0.0015;

  private apiKey: string;
  private model: string;

  constructor(model: string = 'gpt-4o-mini') {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const start = performance.now();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(options.systemPrompt
            ? [{ role: 'system', content: options.systemPrompt }]
            : []),
          { role: 'user', content: options.prompt },
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 500,
      }),
    });

    const data = await response.json();
    const latencyMs = performance.now() - start;

    return {
      text: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
      model: this.model,
      latencyMs,
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
