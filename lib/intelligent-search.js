/**
 * Intelligent Product Search Module
 * Uses AI-powered spec extraction + structured web search
 * For complex technical products (medical equipment, electronics, etc.)
 */

/**
 * Extract key specifications from product description
 * @param {string} description - Full product description
 * @returns {Object} - Extracted specs by category
 */
export function extractKeySpecs(description) {
    const specs = {
        numerical: [],      // Weight, dimensions, capacity, power
        certifications: [], // IPX4, ISO, ANVISA, etc.
        compatibility: [],  // Brands, standards, protocols
        category: null,     // Product category
        model: null,        // Extracted model if present
    };

    const text = description.toUpperCase();

    // === NUMERICAL SPECS ===

    // Weight patterns: 5,5 kg, 5.5kg, 5,5kg
    const weightMatch = description.match(/(\d+[,\.]\d+)\s*kg/gi);
    if (weightMatch) {
        weightMatch.forEach(w => specs.numerical.push(w.trim()));
    }

    // Modes/Programs: 17 modos, 12 programas
    const modesMatch = description.match(/(\d+)\s*(modos?|programas?|funções|ciclos)/gi);
    if (modesMatch) {
        modesMatch.forEach(m => specs.numerical.push(m.trim()));
    }

    // Volume: 20 ml, 400L, 30L
    const volumeMatch = description.match(/(\d+)\s*(ml|litros?|l)\b/gi);
    if (volumeMatch) {
        volumeMatch.forEach(v => specs.numerical.push(v.trim()));
    }

    // Percentage ranges: 40% a 100%, 40-100%
    const percentMatch = description.match(/(\d+%?\s*(?:a|até|-)\s*\d+%)/gi);
    if (percentMatch) {
        percentMatch.forEach(p => specs.numerical.push(p.trim()));
    }

    // BTU: 12000 BTU
    const btuMatch = description.match(/(\d+)\s*BTU/gi);
    if (btuMatch) {
        btuMatch.forEach(b => specs.numerical.push(b.trim()));
    }

    // Screen size: 7 polegadas, 15.6"
    const screenMatch = description.match(/(\d+[,\.]?\d*)\s*(polegadas?|")/gi);
    if (screenMatch) {
        screenMatch.forEach(s => specs.numerical.push(s.trim()));
    }

    // === CERTIFICATIONS ===

    const certPatterns = [
        /IPX\d/gi,
        /ISO\s*\d+/gi,
        /ANVISA/gi,
        /INMETRO/gi,
        /CE\b/gi,
        /FDA/gi,
        /RoHS/gi,
    ];

    certPatterns.forEach(pattern => {
        const matches = description.match(pattern);
        if (matches) {
            matches.forEach(m => specs.certifications.push(m.trim().toUpperCase()));
        }
    });

    // Medical standards
    if (text.includes('AHA') || text.includes('AMERICAN HEART')) {
        specs.certifications.push('AHA');
    }
    if (text.includes('ERC') || text.includes('EUROPEAN RESUSCITATION')) {
        specs.certifications.push('ERC');
    }

    // === COMPATIBILITY / BRANDS ===

    const brandPatterns = [
        /Respironics/gi,
        /Philips/gi,
        /GE\b/gi,
        /Siemens/gi,
        /Dräger/gi,
        /Mindray/gi,
        /Intel\s*Core/gi,
        /AMD\s*Ryzen/gi,
        /NVIDIA/gi,
        /Windows/gi,
        /Android/gi,
        /iOS/gi,
    ];

    brandPatterns.forEach(pattern => {
        const matches = description.match(pattern);
        if (matches) {
            matches.forEach(m => specs.compatibility.push(m.trim()));
        }
    });

    // Compatibility keywords
    if (text.includes('AMBULÂNCIA AÉREA') || text.includes('AMBULANCIA AEREA')) {
        specs.compatibility.push('ambulância aérea');
    }
    if (text.includes('UTI') || text.includes('UNIDADE TERAPIA')) {
        specs.compatibility.push('UTI');
    }

    // === CATEGORY DETECTION ===

    const categoryMap = {
        'VENTILADOR': 'ventilador pulmonar',
        'RESPIRADOR': 'ventilador pulmonar',
        'PULMONAR': 'ventilador pulmonar',
        'GELADEIRA': 'geladeira',
        'REFRIGERADOR': 'geladeira',
        'AR CONDICIONADO': 'ar condicionado',
        'NOTEBOOK': 'notebook',
        'COMPUTADOR PORTÁTIL': 'notebook',
        'IMPRESSORA': 'impressora',
        'MULTIFUNCIONAL': 'impressora multifuncional',
        'MICROONDAS': 'microondas',
        'MÁQUINA DE LAVAR': 'máquina lavar',
        'LAVADORA': 'máquina lavar',
        'MONITOR': 'monitor',
        'DESFIBRILADOR': 'desfibrilador',
        'OXÍMETRO': 'oxímetro',
        'AUTOCLAVE': 'autoclave',
        'CADEIRA DE RODAS': 'cadeira rodas',
        'MACA': 'maca hospitalar',
        'CAMA HOSPITALAR': 'cama hospitalar',
    };

    for (const [keyword, category] of Object.entries(categoryMap)) {
        if (text.includes(keyword)) {
            specs.category = category;
            break;
        }
    }

    return specs;
}

/**
 * Build structured search query from extracted specs
 * @param {Object} specs - Extracted specifications
 * @param {string} description - Original description (for fallback)
 * @returns {string} - Optimized search query
 */
export function buildSearchQuery(specs, description) {
    const queryParts = [];

    // Add category first
    if (specs.category) {
        queryParts.push(specs.category);
    }

    // Add most distinctive numerical specs (limit to 3)
    const numericalUnique = [...new Set(specs.numerical)].slice(0, 3);
    numericalUnique.forEach(n => queryParts.push(n));

    // Add certifications (limit to 2)
    const certsUnique = [...new Set(specs.certifications)].slice(0, 2);
    certsUnique.forEach(c => queryParts.push(c));

    // Add compatibility/brands (limit to 2)
    const compatUnique = [...new Set(specs.compatibility)].slice(0, 2);
    compatUnique.forEach(c => queryParts.push(c));

    // Add "preço Brasil" for local results
    queryParts.push('preço Brasil');

    return queryParts.join(' ');
}

/**
 * Parse web search results to extract product info
 * @param {string} searchSummary - Summary from web search
 * @returns {Object|null} - Extracted product info
 */
export function parseSearchResults(searchSummary) {
    if (!searchSummary) return null;

    const result = {
        productName: null,
        manufacturer: null,
        price: null,
        priceFormatted: null,
        confidence: 0,
        sources: [],
    };

    // Extract price (R$ format)
    const priceMatch = searchSummary.match(/R\$\s*([\d.,]+)/);
    if (priceMatch) {
        result.priceFormatted = `R$ ${priceMatch[1]}`;
        // Parse to number
        const numStr = priceMatch[1].replace(/\./g, '').replace(',', '.');
        result.price = parseFloat(numStr);
    }

    // Extract product name patterns
    // Common patterns: "O [Product] é...", "[Product] da [Manufacturer]"
    const productPatterns = [
        /(?:O|A)\s+([A-Z][a-zA-Z0-9\s]+(?:T\d+|[A-Z]\d+))\s+(?:é|da|possui)/i,
        /(?:Ventilador|Equipamento|Produto)\s+(?:Pulmonar\s+)?([A-Z][a-zA-Z0-9\s]+)\s+(?:é|da)/i,
        /modelo\s+([A-Z][a-zA-Z0-9\s]+)/i,
    ];

    for (const pattern of productPatterns) {
        const match = searchSummary.match(pattern);
        if (match) {
            result.productName = match[1].trim();
            break;
        }
    }

    // Extract manufacturer
    const manufacturerPatterns = [
        /(?:da|fabricante|marca)\s+([A-Z][a-zA-Z]+)/i,
        /([A-Z][a-zA-Z]+)\s+(?:T\d+|[A-Z]\d+)/i,
    ];

    for (const pattern of manufacturerPatterns) {
        const match = searchSummary.match(pattern);
        if (match && match[1].length > 2) {
            result.manufacturer = match[1].trim();
            break;
        }
    }

    // Calculate confidence based on what we found
    if (result.productName) result.confidence += 40;
    if (result.manufacturer) result.confidence += 20;
    if (result.price) result.confidence += 30;
    if (searchSummary.length > 500) result.confidence += 10;

    return result;
}

/**
 * Main intelligent search function
 * Combines spec extraction, query building, and result parsing
 * @param {string} description - Full product description
 * @param {string} [fallbackCategory] - Product name to use if category detection fails
 * @returns {Object} - Search result with product info
 */
export async function intelligentProductSearch(description, fallbackCategory = null) {
    console.log('[INTELLIGENT-SEARCH] Starting analysis...');

    // Step 1: Extract key specifications
    const specs = extractKeySpecs(description);

    // Fallback: If no category detected, use the provided product name
    if (!specs.category && fallbackCategory) {
        console.log(`[INTELLIGENT-SEARCH] Category not detected, using fallback: "${fallbackCategory}"`);
        specs.category = fallbackCategory;
    }

    console.log('[INTELLIGENT-SEARCH] Extracted specs:', JSON.stringify(specs, null, 2));

    // Step 2: Build optimized search query
    const searchQuery = buildSearchQuery(specs, description);
    console.log('[INTELLIGENT-SEARCH] Search query:', searchQuery);

    // Step 3: Return query and specs for external search
    return {
        query: searchQuery,
        specs: specs,
        description: description.substring(0, 200) + '...',
    };
}

// Export all functions
export default {
    extractKeySpecs,
    buildSearchQuery,
    parseSearchResults,
    intelligentProductSearch,
};
