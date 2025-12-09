import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wranglerPath = path.resolve(__dirname, '../wrangler.jsonc');

const varName = process.argv[2];
const varValue = process.argv[3];

if (!varName || !varValue) {
    console.error('Usage: npx tsx scripts/update-wrangler.ts <VAR_NAME> <VAR_VALUE>');
    process.exit(1);
}

try {
    let content = fs.readFileSync(wranglerPath, 'utf8');
    const placeholder = `<${varName}_HERE>`;

    if (!content.includes(placeholder)) {
        console.warn(`Warning: Placeholder "${placeholder}" not found in wrangler.jsonc`);
        // Depending on requirement, we might exit or just continue. 
        // The user said "find ... and replace". If not found, nothing to replace.
        process.exit(0);
    }

    // Replace all occurrences
    content = content.replaceAll(placeholder, varValue);

    fs.writeFileSync(wranglerPath, content, 'utf8');
    console.log(`Successfully updated ${varName} in wrangler.jsonc`);

} catch (error) {
    console.error('Error updating wrangler.jsonc:', error);
    process.exit(1);
}
