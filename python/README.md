<h1 align="center">LLMPrice</h1>
<p align="center"><em>A Python Library for LLM Pricing Lookup</em></p>

<p align="center">
  <a href="https://pypi.org/project/llmprice-kit/"><img src="https://img.shields.io/pypi/v/llmprice-kit" alt="PyPI"></a>
  <a href="https://pepy.tech/project/llmprice-kit"><img src="https://img.shields.io/pepy/dt/llmprice-kit?label=downloads" alt="Downloads"></a>
  <a href="https://github.com/TechyNilesh/LLMPrice/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/python-3.10+-blue?logo=python&logoColor=white" alt="Python 3.10+"></a>
  <a href="https://github.com/BerriAI/litellm"><img src="https://img.shields.io/badge/data%20source-LiteLLM-blue" alt="Data Source: LiteLLM"></a>
</p>

Fast, offline-first LLM pricing lookup for **2500+ models** across all major providers. Returns both **Python objects** and **JSON**.

Data synced daily from [LiteLLM](https://github.com/BerriAI/litellm) via GitHub Actions. Published weekly to PyPI with date-based versioning.

Also available as a [TypeScript/npm package](https://www.npmjs.com/package/llmprice-kit).

## Install

```bash
pip install llmprice-kit
```

## Quick Start

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
# {"name": "gpt-4o", "provider": "openai", "input_cost_per_1m": 2.5, ...}

# Compare models
models = lp.compare(["gpt-4o", "claude-opus-4-20250514", "gemini/gemini-2.0-flash"])
for m in models:
    print(f"{m.name}: ${m.input_cost_per_1m}/1M in, ${m.output_cost_per_1m}/1M out")

# Search by capabilities
cheap_vision = lp.search(supports_vision=True, max_input_price=1.0)
reasoning = lp.search(supports_reasoning=True, provider="anthropic")

# List providers
lp.providers()  # ['anthropic', 'openai', 'gemini', ...]

# Auto-update mode (fetches fresh data if >1 day old)
lp = LLMPrice(auto_update=True)
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
- **Weekly PyPI releases** — Published every Monday with date-based version
- **Auto-update mode** — `LLMPrice(auto_update=True)` fetches fresh data when local copy is >1 day old
- **Dual output** — Every query returns Python dataclass objects or JSON dicts

## Demo Notebook

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/TechyNilesh/LLMPrice/blob/main/notebooks/llmprice_demo.ipynb)

## Data Source

Pricing data from [LiteLLM](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) — **2500+ models** from **100+ providers** including OpenAI, Anthropic, Google, AWS Bedrock, Azure, DeepSeek, Mistral, and more.

## License

MIT
