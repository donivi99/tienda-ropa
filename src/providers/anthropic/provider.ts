import type { IModelProvider, GenerateOptions, GenerateResult } from '../../domain/IModelProvider';

export class AnthropicProvider implements IModelProvider {
  readonly name = 'anthropic';
  readonly costPer1kTokens = 0.003;

  private apiKey: string;
  private model: string;

  constructor(model: string = 'claude-sonnet-4-20250514') {
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const start = performance.now();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens ?? 500,
        temperature: options.temperature ?? 0.3,
        system: options.systemPrompt,
        messages: [{ role: 'user', content: options.prompt }],
      }),
    });

    const data = await response.json();
    const latencyMs = performance.now() - start;

    return {
      text: data.content[0].text,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      model: this.model,
      latencyMs,
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
