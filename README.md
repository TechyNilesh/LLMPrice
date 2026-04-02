<p align="center">
  <img src="https://raw.githubusercontent.com/TechyNilesh/LLMPrice/main/llmprice_hero_universal.png" alt="LLMPrice Hero" width="100%">
</p>

<h1 align="center">LLMPrice</h1>
<p align="center"><em>A Universal Library for LLM Pricing Lookup in Python & TypeScript</em></p>

<p align="center">
  <a href="https://pypi.org/project/llmprice-kit/"><img src="https://img.shields.io/pypi/v/llmprice-kit?label=pypi" alt="PyPI"></a>
  <a href="https://www.npmjs.com/package/llmprice-kit"><img src="https://img.shields.io/npm/v/llmprice-kit?label=npm" alt="npm"></a>
  <a href="https://pepy.tech/project/llmprice-kit"><img src="https://img.shields.io/pepy/dt/llmprice-kit?label=pypi%20downloads" alt="PyPI Downloads"></a>
  <a href="https://www.npmjs.com/package/llmprice-kit"><img src="https://img.shields.io/npm/dt/llmprice-kit?label=npm%20downloads" alt="npm Downloads"></a>
  <a href="https://github.com/TechyNilesh/LLMPrice/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://github.com/BerriAI/litellm"><img src="https://img.shields.io/badge/data%20source-LiteLLM-blue" alt="Data Source: LiteLLM"></a>
  <a href="https://github.com/TechyNilesh/LLMPrice/actions/workflows/auto-sync.yml"><img src="https://img.shields.io/github/actions/workflow/status/TechyNilesh/LLMPrice/auto-sync.yml?label=daily%20sync" alt="Auto Sync"></a>
</p>

Fast, offline-first LLM pricing lookup for **2500+ models** across all major providers. Available for both **Python** and **TypeScript/Node.js**.

Data synced daily from [LiteLLM](https://github.com/BerriAI/litellm) via GitHub Actions. Published weekly with date-based versioning.

## Install

```bash
# Python
pip install llmprice-kit

# TypeScript / Node.js
npm install llmprice-kit
```

## Python Usage

```python
from llmprice import LLMPrice

lp = LLMPrice()

# Get pricing as Python object
model = lp.get("gpt-4o")
print(model.input_cost_per_1m)   # 2.5
print(model.output_cost_per_1m)  # 10.0
print(model.max_input_tokens)    # 128000
print(model.supports_vision)     # True

# Get as JSON dict
data = lp.get_json("gpt-4o")

# Compare models
models = lp.compare(["gpt-4o", "claude-opus-4-20250514", "gemini/gemini-2.0-flash"])
for m in models:
    print(f"{m.name}: ${m.input_cost_per_1m}/1M in, ${m.output_cost_per_1m}/1M out")

# Search by capabilities
cheap_vision = lp.search(supports_vision=True, max_input_price=1.0)
reasoning = lp.search(supports_reasoning=True, provider="anthropic")

# Auto-update mode (fetches fresh data if >1 day old)
lp = LLMPrice(auto_update=True)
```

## TypeScript Usage

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

// Async update
await lp.update();
```

## CLI

Works with both `pip install` and `npm install`:

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
- **Weekly releases** — Published every Monday to both PyPI and npm with date-based version
- **Auto-update mode** — Fetches fresh data when local copy is >1 day old
- **Dual output** — Returns typed objects or JSON dicts in both languages

## Examples

**Python** — Interactive Colab notebook with all features:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/TechyNilesh/LLMPrice/blob/main/examples/python/llmprice_demo.ipynb)

**TypeScript** — Runnable examples:

```bash
cd examples/typescript
npm install && npx tsx basic.ts
```

See [`examples/python/`](examples/python/) and [`examples/typescript/`](examples/typescript/) for full code.

## Data Source

Pricing data sourced from [LiteLLM's model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json), covering **2500+ models** from **100+ providers** including OpenAI, Anthropic, Google, AWS Bedrock, Azure, DeepSeek, Mistral, and more.

## FAQ

**Why LLMPrice instead of using LiteLLM directly?**

LiteLLM is an excellent LLM routing library, but it's a **heavy dependency** (~50+ sub-dependencies) designed for proxying API calls. If you just need pricing data, you're pulling in an entire LLM gateway. LLMPrice gives you the same pricing data in a **lightweight, zero-dependency package** (only `httpx` for optional auto-update).

**Why not just download the JSON myself?**

You could! But then you'd need to handle: parsing raw per-token floats into human-readable per-1M costs, keeping it updated, building search/filter logic, and supporting both Python and TypeScript. LLMPrice does all of that out of the box.

**How fresh is the data?**

The GitHub repo syncs from LiteLLM **daily**. New PyPI/npm releases go out **weekly** (every Monday). If you need same-day freshness, use `auto_update=True` (Python) or `await lp.update()` (TypeScript) to pull directly from GitHub.

**What if LiteLLM changes their JSON format?**

LLMPrice parses LiteLLM's format with safe defaults — unknown fields are ignored, missing fields default to `0` or `false`. If they make breaking changes, we'll adapt. You can also pin a specific version (e.g., `llmprice-kit==2026.4.2`) to lock pricing to a known date.

**Can I use this offline?**

Yes. Every release ships with bundled pricing data. No network calls are made unless you explicitly enable `auto_update` or call `update()`.

## Core Contributor

<a href="https://github.com/TechyNilesh">
  <img src="https://github.com/TechyNilesh.png" width="80" style="border-radius:50%" alt="Nilesh Verma">
  <br>
  <sub><b>Nilesh Verma</b></sub>
</a>

## License

MIT
