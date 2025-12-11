import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wranglerPath = path.resolve(__dirname, "../wrangler.jsonc");

const varNames = process.argv.slice(2);

if (varNames.length === 0) {
  console.error("Usage: npx tsx scripts/set-wrangler-var.ts <VAR_NAME_1> [VAR_NAME_2 ...]");
  process.exit(1);
}

try {
  let content = fs.readFileSync(wranglerPath, "utf8");
  let updatedCount = 0;

  for (const varName of varNames) {
    const varValue = process.env[varName];
    if (!varValue) {
      console.warn(`Warning: Environment variable "${varName}" is not set. Skipping.`);
      continue;
    }

    const placeholder = `<${varName}_HERE>`;
    if (!content.includes(placeholder)) {
      console.warn(`Warning: Placeholder "${placeholder}" not found in wrangler.jsonc`);
      continue;
    }

    content = content.replaceAll(placeholder, varValue);
    updatedCount++;
    console.log(`Updated ${varName}`);
  }

  if (updatedCount > 0) {
    fs.writeFileSync(wranglerPath, content, "utf8");
    console.log(`Successfully updated ${updatedCount} variables in wrangler.jsonc`);
  } else {
    console.log("No variables updated.");
  }
} catch (error) {
  console.error("Error updating wrangler.jsonc:", error);
  process.exit(1);
}
