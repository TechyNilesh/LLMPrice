<h1 align="center">LLMPrice</h1>
<p align="center"><em>A TypeScript Library for LLM Pricing Lookup</em></p>

<p align="center">
  <a href="https://www.npmjs.com/package/llmprice-kit"><img src="https://img.shields.io/npm/v/llmprice-kit" alt="npm"></a>
  <a href="https://www.npmjs.com/package/llmprice-kit"><img src="https://img.shields.io/npm/dt/llmprice-kit?label=downloads" alt="Downloads"></a>
  <a href="https://github.com/TechyNilesh/LLMPrice/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript&logoColor=white" alt="TypeScript 5.0+"></a>
  <a href="https://github.com/BerriAI/litellm"><img src="https://img.shields.io/badge/data%20source-LiteLLM-blue" alt="Data Source: LiteLLM"></a>
</p>

Fast, offline-first LLM pricing lookup for **2500+ models** across all major providers. Fully typed with ESM and CJS support.

Data synced daily from [LiteLLM](https://github.com/BerriAI/litellm) via GitHub Actions. Published weekly to npm with date-based versioning.

Also available as a [Python/PyPI package](https://pypi.org/project/llmprice-kit/).

## Install

```bash
npm install llmprice-kit
```

## Quick Start

```typescript
import { LLMPrice } from "llmprice-kit";

const lp = new LLMPrice();

// Get pricing as typed object
const model = lp.get("gpt-4o");
console.log(model.inputCostPer1m);   // 2.5
console.log(model.outputCostPer1m);  // 10.0
console.log(model.maxInputTokens);   // 128000
console.log(model.supportsVision);   // true

// Get as plain JSON
const data = lp.getJson("gpt-4o");

// Compare models
const models = lp.compare(["gpt-4o", "claude-opus-4-20250514", "gemini/gemini-2.0-flash"]);
models.forEach(m => {
  console.log(`${m.name}: $${m.inputCostPer1m}/1M in, $${m.outputCostPer1m}/1M out`);
});

// Search by capabilities
const cheapVision = lp.search({ supportsVision: true, maxInputPrice: 1.0 });
const reasoning = lp.search({ supportsReasoning: true, provider: "anthropic" });

// List providers
lp.providers(); // ['anthropic', 'openai', 'gemini', ...]

// Async update (fetches fresh data)
await lp.update();
```

## CLI

```bash
llmprice get gpt-4o
llmprice compare gpt-4o claude-opus-4-20250514
llmprice search --provider openai --vision
llmprice search --reasoning --max-input-price 5.0
llmprice providers
llmprice update
llmprice info
```

## How It Works

- **Bundled data** — Ships with a pricing snapshot, works offline with zero latency
- **Auto-sync** — GitHub repo updated daily from LiteLLM upstream
- **Weekly npm releases** — Published every Monday with date-based version
- **Fully typed** — Complete TypeScript definitions with ESM and CJS exports
- **Dual output** — Returns typed `ModelPrice` objects or plain JSON

## Data Source

Pricing data from [LiteLLM](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) — **2500+ models** from **100+ providers** including OpenAI, Anthropic, Google, AWS Bedrock, Azure, DeepSeek, Mistral, and more.

## License

MIT
