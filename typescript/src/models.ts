/** Pricing and capability info for a single LLM model. */
export interface ModelPrice {
  name: string;
  provider: string;
  mode: string;
  inputCostPer1m: number;
  outputCostPer1m: number;
  cacheReadCostPer1m: number;
  cacheWriteCostPer1m: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsReasoning: boolean;
  supportsAudioInput: boolean;
  supportsAudioOutput: boolean;
  supportsWebSearch: boolean;
  supportsPromptCaching: boolean;
  supportsResponseSchema: boolean;
  deprecationDate: string | null;
}

/** Raw LiteLLM model entry. */
export interface RawModelEntry {
  litellm_provider?: string;
  mode?: string;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  cache_read_input_token_cost?: number;
  cache_creation_input_token_cost?: number;
  max_input_tokens?: number;
  max_output_tokens?: number;
  supports_vision?: boolean;
  supports_function_calling?: boolean;
  supports_reasoning?: boolean;
  supports_audio_input?: boolean;
  supports_audio_output?: boolean;
  supports_web_search?: boolean;
  supports_prompt_caching?: boolean;
  supports_response_schema?: boolean;
  deprecation_date?: string;
  [key: string]: unknown;
}

/** Parse a raw LiteLLM entry into a ModelPrice object. */
export function fromLiteLLM(name: string, data: RawModelEntry): ModelPrice {
  return {
    name,
    provider: data.litellm_provider ?? "",
    mode: data.mode ?? "chat",
    inputCostPer1m: (data.input_cost_per_token ?? 0) * 1_000_000,
    outputCostPer1m: (data.output_cost_per_token ?? 0) * 1_000_000,
    cacheReadCostPer1m: (data.cache_read_input_token_cost ?? 0) * 1_000_000,
    cacheWriteCostPer1m: (data.cache_creation_input_token_cost ?? 0) * 1_000_000,
    maxInputTokens: data.max_input_tokens ?? 0,
    maxOutputTokens: data.max_output_tokens ?? 0,
    supportsVision: data.supports_vision ?? false,
    supportsFunctionCalling: data.supports_function_calling ?? false,
    supportsReasoning: data.supports_reasoning ?? false,
    supportsAudioInput: data.supports_audio_input ?? false,
    supportsAudioOutput: data.supports_audio_output ?? false,
    supportsWebSearch: data.supports_web_search ?? false,
    supportsPromptCaching: data.supports_prompt_caching ?? false,
    supportsResponseSchema: data.supports_response_schema ?? false,
    deprecationDate: data.deprecation_date ?? null,
  };
}
