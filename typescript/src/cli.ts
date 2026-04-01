#!/usr/bin/env node

import { LLMPrice } from "./core";

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`llmprice - Fast LLM pricing lookup for 2500+ models.

Commands:
  get <model>                  Get pricing for a model
  compare <m1> <m2> ...        Compare models side by side
  search [--provider X]        Search models by filters
         [--vision]
         [--reasoning]
         [--max-input-price N]
         [--limit N]
  providers                    List all providers
  update                       Fetch latest pricing data
  info                         Show data age and stats`);
}

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

const lp = new LLMPrice();

switch (command) {
  case "get": {
    const model = args[1];
    if (!model) {
      console.error("Usage: llmprice get <model>");
      process.exit(1);
    }
    try {
      console.log(JSON.stringify(lp.getJson(model), null, 2));
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
    break;
  }

  case "compare": {
    const models = args.slice(1);
    if (models.length === 0) {
      console.error("Usage: llmprice compare <model1> <model2> ...");
      process.exit(1);
    }
    try {
      console.log(JSON.stringify(lp.compareJson(models), null, 2));
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
    break;
  }

  case "search": {
    const opts: Record<string, any> = {};
    let limit = 20;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--provider" && args[i + 1]) opts.provider = args[++i];
      else if (args[i] === "--vision") opts.supportsVision = true;
      else if (args[i] === "--reasoning") opts.supportsReasoning = true;
      else if (args[i] === "--max-input-price" && args[i + 1])
        opts.maxInputPrice = parseFloat(args[++i]);
      else if (args[i] === "--limit" && args[i + 1])
        limit = parseInt(args[++i]);
    }
    const results = lp.search(opts);
    for (const m of results.slice(0, limit)) {
      const inp = m.inputCostPer1m.toFixed(2).padStart(8);
      const out = m.outputCostPer1m.toFixed(2).padStart(8);
      console.log(`${m.name.padEnd(50)} $${inp} / $${out}  [${m.provider}]`);
    }
    console.log(
      `\n${results.length} models found (showing ${Math.min(results.length, limit)})`
    );
    break;
  }

  case "providers": {
    for (const p of lp.providers()) {
      const count = lp.byProvider(p).length;
      console.log(`${p.padEnd(30)} ${String(count).padStart(4)} models`);
    }
    break;
  }

  case "update": {
    console.log("Fetching latest pricing data...");
    lp.update().then(() => {
      console.log(`Done. ${lp.totalModels} models loaded.`);
    }).catch((e: any) => {
      console.error(`Failed: ${e.message}`);
      process.exit(1);
    });
    break;
  }

  case "info": {
    console.log(`Total models: ${lp.totalModels}`);
    console.log(`Providers: ${lp.providers().length}`);
    console.log(lp.dataAge());
    break;
  }

  default:
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
}
