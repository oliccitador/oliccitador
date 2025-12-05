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
        model: null,        // Product model (T7, HRV2020, etc.)
        brand: null,        // Brand/Manufacturer (Amoul, Philips, etc.)
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

    // === MODEL EXTRACTION ===
    // Extract product model identifiers (T7, T5, HRV2020, etc.)
    const modelPatterns = [
        /\bT\d+\b/gi,           // T7, T5, T10
        /\b[A-Z]{2,}\s*\d{3,}\b/gi, // HRV2020, PT70BM
        /modelo\s+([A-Z0-9-]+)/gi,   // modelo XYZ-123
    ];

    modelPatterns.forEach(pattern => {
        const matches = description.match(pattern);
        if (matches && !specs.model) {
            specs.model = matches[0].trim().toUpperCase();
        }
    });

    // === BRAND EXTRACTION ===
    // Extract brand/manufacturer (prioritize medical brands)
    const knownBrands = [
        'Amoul', 'Philips', 'Respironics', 'GE', 'Siemens', 'Dräger', 'Mindray',
        'Dell', 'HP', 'Lenovo', 'Samsung', 'LG', 'Brastemp', 'Electrolux',
        'Makita', 'DeWalt', 'Bosch', 'Black+Decker', 'Brother', 'Epson', 'Canon'
    ];

    const brandPattern = new RegExp(`\\b(${knownBrands.join('|')})\\b`, 'gi');
    const brandMatch = description.match(brandPattern);
    if (brandMatch && !specs.brand) {
        specs.brand = brandMatch[0].trim();
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
 * NO BRAND to avoid restricting to single manufacturer
 * @param {Object} specs - Extracted specifications
 * @param {string} description - Original description (for fallback)
 * @returns {string} - Optimized search query
 */
export function buildSearchQuery(specs, description) {
    const queryParts = [];

    // PRIORITY 1: Model (most specific identifier) - NO BRAND
    if (specs.model) {
        queryParts.push(specs.model);
    }

    // PRIORITY 2: Category
    if (specs.category) {
        queryParts.push(specs.category);
    }

    // If we have model, use minimal specs (more results, better competition)
    if (specs.model) {
        // Add 2 most distinctive specs
        const numericalUnique = [...new Set(specs.numerical)].slice(0, 2);
        numericalUnique.forEach(n => queryParts.push(n));

        // Add 1 certification
        const certsUnique = [...new Set(specs.certifications)].slice(0, 1);
        certsUnique.forEach(c => queryParts.push(c));
    } else {
        // Without model, use more specs for precision
        const numericalUnique = [...new Set(specs.numerical)].slice(0, 3);
        numericalUnique.forEach(n => queryParts.push(n));

        const certsUnique = [...new Set(specs.certifications)].slice(0, 2);
        certsUnique.forEach(c => queryParts.push(c));

        const compatUnique = [...new Set(specs.compatibility)].slice(0, 2);
        compatUnique.forEach(c => queryParts.push(c));
    }

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
    console.log('[INTELLIGENT-SEARCH] Product name (ca_nome_comercial):', fallbackCategory);

    // Step 1: Extract key specifications from description
    const specs = extractKeySpecs(description);

    // Step 2: Also extract from product name (ca_nome_comercial) if provided
    if (fallbackCategory) {
        const nameSpecs = extractKeySpecs(fallbackCategory);

        // Prioritize model/brand from product name if not found in description
        if (nameSpecs.model && !specs.model) {
            specs.model = nameSpecs.model;
            console.log(`[INTELLIGENT-SEARCH] Model extracted from product name: ${specs.model}`);
        }
        if (nameSpecs.brand && !specs.brand) {
            specs.brand = nameSpecs.brand;
            console.log(`[INTELLIGENT-SEARCH] Brand extracted from product name: ${specs.brand}`);
        }

        // Use category from name as fallback
        if (!specs.category && nameSpecs.category) {
            specs.category = nameSpecs.category;
        } else if (!specs.category) {
            // Last resort: use raw product name as category
            specs.category = fallbackCategory;
        }
    }

    console.log('[INTELLIGENT-SEARCH] Extracted specs:', JSON.stringify(specs, null, 2));

    // Step 3: Build optimized search query
    const searchQuery = buildSearchQuery(specs, description);
    console.log('[INTELLIGENT-SEARCH] Search query:', searchQuery);

    // Step 4: Return query and specs for external search
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
