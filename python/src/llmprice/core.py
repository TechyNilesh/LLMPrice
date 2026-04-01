"""Core LLMPrice class — offline-first pricing lookup with optional auto-sync."""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any, Optional

from .models import ModelPrice

_BUNDLED_DATA = Path(__file__).parent / "data" / "model_prices.json"
_CACHE_DIR = Path(os.environ.get("LLMPRICE_CACHE_DIR", Path.home() / ".cache" / "llmprice"))
_CACHED_DATA = _CACHE_DIR / "model_prices.json"
_REMOTE_URL = (
    os.environ.get("LLMPRICE_DATA_URL")
    or "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
)
_STALE_SECONDS = 86400  # 1 day


def _try_load_json(path: Path) -> dict | None:
    """Try to load JSON from a file. Returns None if invalid or missing."""
    try:
        with open(path, "r") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
    except (json.JSONDecodeError, OSError):
        pass
    return None


class LLMPrice:
    """Fast, offline-first LLM pricing lookup.

    Args:
        auto_update: If True, fetches fresh data when local copy is stale (>1 day).
        data_path: Override the data file path. Uses bundled data by default.
    """

    def __init__(self, auto_update: bool = False, data_path: Optional[str] = None) -> None:
        self._auto_update = auto_update
        self._data_path = Path(data_path) if data_path else None
        self._raw: dict[str, Any] = {}
        self._models: dict[str, ModelPrice] = {}
        self._load()

    def _resolve_data_file(self) -> Path:
        """Determine which data file to load.

        When data_path is set, it takes priority only for loading —
        auto_update still writes to the cache independently.
        """
        if self._data_path and self._data_path.exists():
            return self._data_path
        if _CACHED_DATA.exists():
            return _CACHED_DATA
        return _BUNDLED_DATA

    def _load(self) -> None:
        """Load model data from the best available source."""
        if self._auto_update and self._is_stale():
            try:
                self.update()
                return  # update already loaded the data
            except Exception:
                pass  # fall back to local data

        path = self._resolve_data_file()
        data = _try_load_json(path)

        # If cache is corrupt, delete it and fall back to bundled data
        if data is None and path == _CACHED_DATA:
            _CACHED_DATA.unlink(missing_ok=True)
            data = _try_load_json(_BUNDLED_DATA)

        # Last resort: bundled data
        if data is None:
            data = _try_load_json(_BUNDLED_DATA)

        if data is None:
            raise RuntimeError("Failed to load any pricing data.")

        self._raw = data
        self._models = {}
        for key, val in self._raw.items():
            if key == "sample_spec" or not isinstance(val, dict):
                continue
            self._models[key] = ModelPrice.from_litellm(key, val)

    def _is_stale(self) -> bool:
        """Check if local data is older than the stale threshold."""
        path = self._resolve_data_file()
        if not path.exists():
            return True
        age = time.time() - path.stat().st_mtime
        return age > _STALE_SECONDS

    def update(self) -> None:
        """Fetch the latest pricing data from upstream."""
        import httpx

        resp = httpx.get(_REMOTE_URL, timeout=30, follow_redirects=True)
        resp.raise_for_status()

        # Validate JSON before writing to cache
        data = resp.json()
        if not isinstance(data, dict):
            raise ValueError("Remote data is not a valid JSON object.")

        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        _CACHED_DATA.write_bytes(resp.content)

        self._raw = data
        self._models = {}
        for key, val in self._raw.items():
            if key == "sample_spec" or not isinstance(val, dict):
                continue
            self._models[key] = ModelPrice.from_litellm(key, val)

    # --- Query methods ---

    def get(self, model: str) -> ModelPrice:
        """Get pricing info for a specific model.

        Args:
            model: Model name (e.g., 'gpt-4o', 'claude-opus-4-20250514').

        Returns:
            ModelPrice object with pricing and capability data.

        Raises:
            KeyError: If model is not found.
        """
        if model in self._models:
            return self._models[model]
        # Fuzzy: try partial match
        matches = [k for k in self._models if model.lower() in k.lower()]
        if len(matches) == 1:
            return self._models[matches[0]]
        if matches:
            raise KeyError(
                f"Model '{model}' not found. Did you mean: {matches[:5]}"
            )
        raise KeyError(f"Model '{model}' not found.")

    def get_json(self, model: str) -> dict[str, Any]:
        """Get pricing info as a JSON-serializable dict."""
        return self.get(model).to_dict()

    def compare(self, models: list[str]) -> list[ModelPrice]:
        """Compare multiple models side by side.

        Returns:
            List of ModelPrice objects.
        """
        return [self.get(m) for m in models]

    def compare_json(self, models: list[str]) -> list[dict[str, Any]]:
        """Compare multiple models, return as list of dicts."""
        return [self.get(m).to_dict() for m in models]

    def by_provider(self, provider: str) -> list[ModelPrice]:
        """Get all models from a specific provider.

        Args:
            provider: Provider name (e.g., 'openai', 'anthropic', 'gemini').
        """
        return [
            m for m in self._models.values()
            if m.provider.lower() == provider.lower()
        ]

    def search(
        self,
        provider: Optional[str] = None,
        mode: Optional[str] = None,
        supports_vision: Optional[bool] = None,
        supports_function_calling: Optional[bool] = None,
        supports_reasoning: Optional[bool] = None,
        max_input_price: Optional[float] = None,
        max_output_price: Optional[float] = None,
        min_context: Optional[int] = None,
    ) -> list[ModelPrice]:
        """Search models by capabilities and price filters.

        All prices are per 1M tokens. Context is in tokens.
        """
        results = list(self._models.values())

        if provider:
            results = [m for m in results if m.provider.lower() == provider.lower()]
        if mode:
            results = [m for m in results if m.mode == mode]
        if supports_vision is not None:
            results = [m for m in results if m.supports_vision == supports_vision]
        if supports_function_calling is not None:
            results = [m for m in results if m.supports_function_calling == supports_function_calling]
        if supports_reasoning is not None:
            results = [m for m in results if m.supports_reasoning == supports_reasoning]
        if max_input_price is not None:
            results = [m for m in results if m.input_cost_per_1m <= max_input_price]
        if max_output_price is not None:
            results = [m for m in results if m.output_cost_per_1m <= max_output_price]
        if min_context is not None:
            results = [m for m in results if m.max_input_tokens >= min_context]

        return results

    def providers(self) -> list[str]:
        """List all available providers."""
        return sorted(set(m.provider for m in self._models.values() if m.provider))

    def all_models(self) -> list[str]:
        """List all model names."""
        return list(self._models.keys())

    def data_age(self) -> str:
        """Return human-readable age of the local data."""
        path = self._resolve_data_file()
        if not path.exists():
            return "No data file found."
        age_seconds = time.time() - path.stat().st_mtime
        days = int(age_seconds // 86400)
        hours = int((age_seconds % 86400) // 3600)
        if days > 0:
            return f"Data is {days}d {hours}h old."
        return f"Data is {hours}h old."

    @property
    def total_models(self) -> int:
        """Total number of models in the dataset."""
        return len(self._models)

    def __repr__(self) -> str:
        return f"LLMPrice(models={self.total_models}, auto_update={self._auto_update})"
