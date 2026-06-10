export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  tokensUsed: number;
  model: string;
  latencyMs: number;
}

export interface IModelProvider {
  readonly name: string;
  readonly costPer1kTokens: number;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  isAvailable(): Promise<boolean>;
}
