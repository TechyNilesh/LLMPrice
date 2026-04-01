"""CLI for llmprice — lookup LLM pricing from the terminal."""

from __future__ import annotations

import argparse
import json
import sys

from .core import LLMPrice


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="llmprice",
        description="Fast LLM pricing lookup for 2500+ models.",
    )
    sub = parser.add_subparsers(dest="command")

    # llmprice get <model>
    get_p = sub.add_parser("get", help="Get pricing for a model")
    get_p.add_argument("model", help="Model name (e.g., gpt-4o)")

    # llmprice compare <model1> <model2> ...
    cmp_p = sub.add_parser("compare", help="Compare models side by side")
    cmp_p.add_argument("models", nargs="+", help="Model names to compare")

    # llmprice search --provider openai --vision
    search_p = sub.add_parser("search", help="Search models by filters")
    search_p.add_argument("--provider", help="Filter by provider")
    search_p.add_argument("--mode", help="Filter by mode (chat, embedding, etc.)")
    search_p.add_argument("--vision", action="store_true", help="Supports vision")
    search_p.add_argument("--reasoning", action="store_true", help="Supports reasoning")
    search_p.add_argument("--max-input-price", type=float, help="Max input price per 1M tokens")
    search_p.add_argument("--limit", type=int, default=20, help="Max results (default: 20)")

    # llmprice providers
    sub.add_parser("providers", help="List all providers")

    # llmprice update
    sub.add_parser("update", help="Fetch latest pricing data")

    # llmprice info
    sub.add_parser("info", help="Show data age and stats")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    lp = LLMPrice()

    if args.command == "get":
        try:
            result = lp.get_json(args.model)
            print(json.dumps(result, indent=2))
        except KeyError as e:
            print(str(e), file=sys.stderr)
            sys.exit(1)

    elif args.command == "compare":
        try:
            results = lp.compare_json(args.models)
            print(json.dumps(results, indent=2))
        except KeyError as e:
            print(str(e), file=sys.stderr)
            sys.exit(1)

    elif args.command == "search":
        results = lp.search(
            provider=args.provider,
            mode=args.mode,
            supports_vision=True if args.vision else None,
            supports_reasoning=True if args.reasoning else None,
            max_input_price=args.max_input_price,
        )
        for m in results[: args.limit]:
            print(f"{m.name:50s} ${m.input_cost_per_1m:>8.2f} / ${m.output_cost_per_1m:>8.2f}  [{m.provider}]")
        print(f"\n{len(results)} models found (showing {min(len(results), args.limit)})")

    elif args.command == "providers":
        for p in lp.providers():
            count = len(lp.by_provider(p))
            print(f"{p:30s} {count:>4} models")

    elif args.command == "update":
        print("Fetching latest pricing data...")
        lp.update()
        print(f"Done. {lp.total_models} models loaded.")

    elif args.command == "info":
        print(f"Total models: {lp.total_models}")
        print(f"Providers: {len(lp.providers())}")
        print(f"{lp.data_age()}")
