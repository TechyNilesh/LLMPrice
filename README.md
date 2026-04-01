# LLMPrice

Fast, offline-first LLM pricing lookup for **2500+ models** across all major providers. Returns both Python objects and JSON.

Auto-synced daily from [LiteLLM](https://github.com/BerriAI/litellm) pricing data via GitHub Actions. Date-based versioning (`2026.4.2`).

## Install

```bash
pip install llmprice
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
# Get model pricing
llmprice get gpt-4o

# Compare models
llmprice compare gpt-4o claude-opus-4-20250514

# Search with filters
llmprice search --provider openai --vision
llmprice search --reasoning --max-input-price 5.0

# List providers
llmprice providers

# Update data
llmprice update

# Check data freshness
llmprice info
```

## How It Works

- **Bundled data**: Ships with a snapshot of pricing data — works offline, zero latency
- **Auto-sync**: Optional background refresh from LiteLLM's upstream JSON
- **Date versioning**: Each release is tagged by date (e.g., `2026.4.2`), so `pip install llmprice==2026.4.2` gives you that exact day's pricing
- **GitHub Actions**: Runs daily, checks for upstream changes, auto-publishes to PyPI

## Data Source

Pricing data sourced from [LiteLLM's model_prices_and_context_window.json](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json), which covers 2500+ models from 15+ providers including OpenAI, Anthropic, Google, AWS Bedrock, Azure, DeepSeek, Mistral, and more.

## License

MIT
