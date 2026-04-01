"""Data models for LLM pricing information."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Optional


@dataclass
class ModelPrice:
    """Represents pricing and capability info for a single LLM model."""

    name: str
    provider: str = ""
    mode: str = "chat"

    # Pricing (per 1M tokens)
    input_cost_per_1m: float = 0.0
    output_cost_per_1m: float = 0.0
    cache_read_cost_per_1m: float = 0.0
    cache_write_cost_per_1m: float = 0.0

    # Context window
    max_input_tokens: int = 0
    max_output_tokens: int = 0

    # Capabilities
    supports_vision: bool = False
    supports_function_calling: bool = False
    supports_reasoning: bool = False
    supports_audio_input: bool = False
    supports_audio_output: bool = False
    supports_web_search: bool = False
    supports_prompt_caching: bool = False
    supports_response_schema: bool = False

    # Metadata
    deprecation_date: Optional[str] = None
    raw: dict = field(default_factory=dict, repr=False)

    def to_dict(self) -> dict[str, Any]:
        """Return as a clean dictionary."""
        d = asdict(self)
        d.pop("raw", None)
        return d

    def to_json(self) -> dict[str, Any]:
        """Alias for to_dict, returns JSON-serializable dict."""
        return self.to_dict()

    @classmethod
    def from_litellm(cls, name: str, data: dict) -> ModelPrice:
        """Parse a LiteLLM model entry into a ModelPrice object."""
        return cls(
            name=name,
            provider=data.get("litellm_provider", ""),
            mode=data.get("mode", "chat"),
            input_cost_per_1m=data.get("input_cost_per_token", 0) * 1_000_000,
            output_cost_per_1m=data.get("output_cost_per_token", 0) * 1_000_000,
            cache_read_cost_per_1m=data.get("cache_read_input_token_cost", 0) * 1_000_000,
            cache_write_cost_per_1m=data.get("cache_creation_input_token_cost", 0) * 1_000_000,
            max_input_tokens=int(data.get("max_input_tokens", 0) or 0),
            max_output_tokens=int(data.get("max_output_tokens", 0) or 0),
            supports_vision=data.get("supports_vision", False) or False,
            supports_function_calling=data.get("supports_function_calling", False) or False,
            supports_reasoning=data.get("supports_reasoning", False) or False,
            supports_audio_input=data.get("supports_audio_input", False) or False,
            supports_audio_output=data.get("supports_audio_output", False) or False,
            supports_web_search=data.get("supports_web_search", False) or False,
            supports_prompt_caching=data.get("supports_prompt_caching", False) or False,
            supports_response_schema=data.get("supports_response_schema", False) or False,
            deprecation_date=data.get("deprecation_date"),
            raw=data,
        )
