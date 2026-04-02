/**
 * LLMPrice — Advanced Usage Examples
 *
 * Run: npx tsx advanced.ts
 */

import { LLMPrice } from "llmprice-kit";

const lp = new LLMPrice();

// ============================================================
// 1. Search: cheap vision models (input < $2/1M tokens)
// ============================================================
console.log("=== 1. Cheap Vision Models (< $2/1M input) ===");
const cheapVision = lp.search({
  supportsVision: true,
  maxInputPrice: 2.0,
  mode: "chat",
});

for (const m of cheapVision.slice(0, 10)) {
  console.log(`${m.name.padEnd(50)} $${m.inputCostPer1m.toFixed(2).padStart(6)} [${m.provider}]`);
}
console.log(`Total found: ${cheapVision.length}\n`);

// ============================================================
// 2. Search: reasoning models from Anthropic
// ============================================================
console.log("=== 2. Anthropic Reasoning Models ===");
const reasoning = lp.search({
  supportsReasoning: true,
  provider: "anthropic",
});

for (const m of reasoning) {
  const inp = m.inputCostPer1m.toFixed(2).padStart(6);
  const out = m.outputCostPer1m.toFixed(2).padStart(6);
  console.log(`${m.name.padEnd(50)} $${inp} / $${out}`);
}
console.log();

// ============================================================
// 3. Search: large context models (>500K tokens)
// ============================================================
console.log("=== 3. Large Context Models (>500K tokens) ===");
const largeCtx = lp.search({ minContext: 500_000, mode: "chat" });

for (const m of largeCtx.slice(0, 10)) {
  const ctx = m.maxInputTokens.toLocaleString().padStart(12);
  console.log(`${m.name.padEnd(50)} ${ctx} tokens [${m.provider}]`);
}
console.log(`Total found: ${largeCtx.length}\n`);

// ============================================================
// 4. Search: free models (input cost = $0)
// ============================================================
console.log("=== 4. Free Chat Models ===");
const freeModels = lp.search({ maxInputPrice: 0, mode: "chat" });
console.log(`Total free chat models: ${freeModels.length}`);
for (const m of freeModels.slice(0, 10)) {
  console.log(`  ${m.name.padEnd(50)} [${m.provider}]`);
}
console.log();

// ============================================================
// 5. Search: models with function calling + vision
// ============================================================
console.log("=== 5. Models with Vision + Function Calling ===");
const multiCapability = lp.search({
  supportsVision: true,
  supportsFunctionCalling: true,
  maxInputPrice: 5.0,
});

for (const m of multiCapability.slice(0, 10)) {
  console.log(`${m.name.padEnd(50)} $${m.inputCostPer1m.toFixed(2).padStart(6)} [${m.provider}]`);
}
console.log(`Total found: ${multiCapability.length}\n`);

// ============================================================
// 6. Async update — fetch latest data
// ============================================================
console.log("=== 6. Async Update ===");
console.log(`Before: ${lp.dataAge()}`);
await lp.update();
console.log(`After:  ${lp.dataAge()}`);
console.log(`Models: ${lp.totalModels}`);
