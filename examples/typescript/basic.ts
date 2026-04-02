/**
 * LLMPrice — Basic Usage Examples
 *
 * Run: npx tsx basic.ts
 */

import { LLMPrice } from "llmprice-kit";

const lp = new LLMPrice();

// ============================================================
// 1. Initialize and check stats
// ============================================================
console.log("=== 1. Initialize ===");
console.log(`Total models: ${lp.totalModels}`);
console.log(`Providers: ${lp.providers().length}`);
console.log(`${lp.dataAge()}\n`);

// ============================================================
// 2. Get pricing as a typed object
// ============================================================
console.log("=== 2. Get Model (Object) ===");
const model = lp.get("gpt-4o");
console.log(`Model:       ${model.name}`);
console.log(`Provider:    ${model.provider}`);
console.log(`Input:       $${model.inputCostPer1m}/1M tokens`);
console.log(`Output:      $${model.outputCostPer1m}/1M tokens`);
console.log(`Max input:   ${model.maxInputTokens.toLocaleString()} tokens`);
console.log(`Max output:  ${model.maxOutputTokens.toLocaleString()} tokens`);
console.log(`Vision:      ${model.supportsVision}`);
console.log(`Functions:   ${model.supportsFunctionCalling}\n`);

// ============================================================
// 3. Get pricing as JSON
// ============================================================
console.log("=== 3. Get Model (JSON) ===");
const json = lp.getJson("gpt-4o");
console.log(JSON.stringify(json, null, 2));
console.log();

// ============================================================
// 4. Compare models side by side
// ============================================================
console.log("=== 4. Compare Models ===");
const models = lp.compare([
  "gpt-4o",
  "claude-opus-4-20250514",
  "gemini/gemini-2.0-flash",
  "deepseek/deepseek-chat",
]);

for (const m of models) {
  const inp = m.inputCostPer1m.toFixed(2).padStart(8);
  const out = m.outputCostPer1m.toFixed(2).padStart(8);
  const ctx = m.maxInputTokens.toLocaleString().padStart(12);
  console.log(`${m.name.padEnd(40)} $${inp} in / $${out} out | ${ctx} ctx`);
}
console.log();

// ============================================================
// 5. Compare as JSON
// ============================================================
console.log("=== 5. Compare as JSON ===");
const comparison = lp.compareJson(["gpt-4o-mini", "claude-haiku-4-5"]);
console.log(JSON.stringify(comparison, null, 2));
console.log();

// ============================================================
// 6. List all providers
// ============================================================
console.log("=== 6. Providers ===");
const providers = lp.providers();
console.log(`Total: ${providers.length}`);
console.log(providers.slice(0, 20).join(", "));
console.log();

// ============================================================
// 7. Browse by provider
// ============================================================
console.log("=== 7. Browse by Provider (OpenAI) ===");
const openaiModels = lp.byProvider("openai");
console.log(`OpenAI models: ${openaiModels.length}`);
for (const m of openaiModels.slice(0, 5)) {
  console.log(`  ${m.name.padEnd(40)} $${m.inputCostPer1m.toFixed(2)} / $${m.outputCostPer1m.toFixed(2)}`);
}
console.log();

// ============================================================
// 8. List all model names
// ============================================================
console.log("=== 8. All Models ===");
const allModels = lp.allModels();
console.log(`Total: ${allModels.length}`);
console.log(`First 5: ${allModels.slice(0, 5).join(", ")}`);
