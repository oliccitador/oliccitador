// Test Global Fallback
import { intelligentProductSearch } from '../lib/intelligent-search.js';

console.log('Testing Global Fallback for Intelligent Search...');

// Description of a product NOT in the internal map (e.g. "Caneta")
const desc = "Caneta Esferográfica Azul Ponta 1.0mm Corpo Sextavado Caixa com 50 Unidades";
const fallback = "Caneta Esferográfica";

const result = await intelligentProductSearch(desc, fallback);

console.log('Category detected:', result.specs.category);
console.log('Query generated:', result.query);

const success = result.specs.category === fallback && result.query.includes(fallback);

const output = {
    categoryDetected: result.specs.category,
    queryGenerated: result.query,
    fallbackUsed: fallback,
    success: success
};

import fs from 'fs';
fs.writeFileSync('test-global-fallback-result.json', JSON.stringify(output, null, 2));
console.log('Result saved to test-global-fallback-result.json');
