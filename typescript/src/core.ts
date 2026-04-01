import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ModelPrice, RawModelEntry, fromLiteLLM } from "./models";

const BUNDLED_DATA = join(__dirname, "..", "data", "model_prices.json");
const CACHE_DIR =
  process.env.LLMPRICE_CACHE_DIR ?? join(homedir(), ".cache", "llmprice");
const CACHED_DATA = join(CACHE_DIR, "model_prices.json");
const REMOTE_URL =
  process.env.LLMPRICE_DATA_URL ??
  "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
const STALE_SECONDS = 86400; // 1 day

function tryLoadJson(path: string): Record<string, unknown> | null {
  try {
    const content = readFileSync(path, "utf-8");
    const data = JSON.parse(content);
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
  } catch {
    // invalid or missing
  }
  return null;
}

export interface LLMPriceOptions {
  autoUpdate?: boolean;
  dataPath?: string;
}

export interface SearchOptions {
  provider?: string;
  mode?: string;
  supportsVision?: boolean;
  supportsFunctionCalling?: boolean;
  supportsReasoning?: boolean;
  maxInputPrice?: number;
  maxOutputPrice?: number;
  minContext?: number;
}

/** Fast, offline-first LLM pricing lookup. */
export class LLMPrice {
  private _autoUpdate: boolean;
  private _dataPath: string | null;
  private _models: Map<string, ModelPrice> = new Map();

  constructor(options: LLMPriceOptions = {}) {
    this._autoUpdate = options.autoUpdate ?? false;
    this._dataPath = options.dataPath ?? null;
    this._load();
  }

  private _resolveDataFile(): string {
    if (this._dataPath && existsSync(this._dataPath)) {
      return this._dataPath;
    }
    if (existsSync(CACHED_DATA)) {
      return CACHED_DATA;
    }
    return BUNDLED_DATA;
  }

  private _isStale(): boolean {
    const path = this._resolveDataFile();
    if (!existsSync(path)) return true;
    const age = (Date.now() - statSync(path).mtimeMs) / 1000;
    return age > STALE_SECONDS;
  }

  private _load(): void {
    if (this._autoUpdate && this._isStale()) {
      try {
        this.updateSync();
        return;
      } catch {
        // fall back to local data
      }
    }

    const path = this._resolveDataFile();
    let data = tryLoadJson(path);

    // If cache is corrupt, delete it and fall back to bundled
    if (data === null && path === CACHED_DATA) {
      try { unlinkSync(CACHED_DATA); } catch { /* ignore */ }
      data = tryLoadJson(BUNDLED_DATA);
    }

    if (data === null) {
      data = tryLoadJson(BUNDLED_DATA);
    }

    if (data === null) {
      throw new Error("Failed to load any pricing data.");
    }

    this._parseData(data);
  }

  private _parseData(data: Record<string, unknown>): void {
    this._models = new Map();
    for (const [key, val] of Object.entries(data)) {
      if (key === "sample_spec" || typeof val !== "object" || val === null) {
        continue;
      }
      this._models.set(key, fromLiteLLM(key, val as RawModelEntry));
    }
  }

  /** Fetch latest pricing data (async). */
  async update(): Promise<void> {
    const resp = await fetch(REMOTE_URL);
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const text = await resp.text();
    const data = JSON.parse(text);
    if (typeof data !== "object" || data === null) {
      throw new Error("Remote data is not a valid JSON object.");
    }
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHED_DATA, text, "utf-8");
    this._parseData(data);
  }

  /** Fetch latest pricing data (sync, for constructor use). */
  updateSync(): void {
    // Node 18+ has global fetch but it's async-only.
    // For sync update in constructor, use bundled data and let user call update() async.
    // This is a no-op; use update() for actual refresh.
    throw new Error("Use await lp.update() for async refresh.");
  }

  /** Get pricing info for a specific model. */
  get(model: string): ModelPrice {
    if (this._models.has(model)) {
      return this._models.get(model)!;
    }
    // Fuzzy partial match
    const matches = [...this._models.keys()].filter((k) =>
      k.toLowerCase().includes(model.toLowerCase())
    );
    if (matches.length === 1) {
      return this._models.get(matches[0])!;
    }
    if (matches.length > 0) {
      throw new Error(
        `Model '${model}' not found. Did you mean: ${matches.slice(0, 5).join(", ")}`
      );
    }
    throw new Error(`Model '${model}' not found.`);
  }

  /** Get pricing info as a plain JSON object. */
  getJson(model: string): ModelPrice {
    return { ...this.get(model) };
  }

  /** Compare multiple models side by side. */
  compare(models: string[]): ModelPrice[] {
    return models.map((m) => this.get(m));
  }

  /** Compare multiple models, return as plain objects. */
  compareJson(models: string[]): ModelPrice[] {
    return models.map((m) => ({ ...this.get(m) }));
  }

  /** Get all models from a specific provider. */
  byProvider(provider: string): ModelPrice[] {
    const lower = provider.toLowerCase();
    return [...this._models.values()].filter(
      (m) => m.provider.toLowerCase() === lower
    );
  }

  /** Search models by capabilities and price filters. */
  search(options: SearchOptions = {}): ModelPrice[] {
    let results = [...this._models.values()];

    if (options.provider) {
      const lower = options.provider.toLowerCase();
      results = results.filter((m) => m.provider.toLowerCase() === lower);
    }
    if (options.mode) {
      results = results.filter((m) => m.mode === options.mode);
    }
    if (options.supportsVision !== undefined) {
      results = results.filter((m) => m.supportsVision === options.supportsVision);
    }
    if (options.supportsFunctionCalling !== undefined) {
      results = results.filter(
        (m) => m.supportsFunctionCalling === options.supportsFunctionCalling
      );
    }
    if (options.supportsReasoning !== undefined) {
      results = results.filter(
        (m) => m.supportsReasoning === options.supportsReasoning
      );
    }
    if (options.maxInputPrice !== undefined) {
      results = results.filter(
        (m) => m.inputCostPer1m <= options.maxInputPrice!
      );
    }
    if (options.maxOutputPrice !== undefined) {
      results = results.filter(
        (m) => m.outputCostPer1m <= options.maxOutputPrice!
      );
    }
    if (options.minContext !== undefined) {
      results = results.filter(
        (m) => m.maxInputTokens >= options.minContext!
      );
    }

    return results;
  }

  /** List all available providers. */
  providers(): string[] {
    const set = new Set<string>();
    for (const m of this._models.values()) {
      if (m.provider) set.add(m.provider);
    }
    return [...set].sort();
  }

  /** List all model names. */
  allModels(): string[] {
    return [...this._models.keys()];
  }

  /** Total number of models. */
  get totalModels(): number {
    return this._models.size;
  }

  /** Human-readable age of local data. */
  dataAge(): string {
    const path = this._resolveDataFile();
    if (!existsSync(path)) return "No data file found.";
    const ageSeconds = (Date.now() - statSync(path).mtimeMs) / 1000;
    const days = Math.floor(ageSeconds / 86400);
    const hours = Math.floor((ageSeconds % 86400) / 3600);
    if (days > 0) return `Data is ${days}d ${hours}h old.`;
    return `Data is ${hours}h old.`;
  }
}
