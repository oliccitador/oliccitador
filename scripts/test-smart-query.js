
// Script para testar a extração inteligente de keywords para busca de preços
const descricaoCA40377 = "Calçado ocupacional de uso profissional, tipo botina, fechamento em cadarço, confeccionado em couro nobuck, palmilha de montagem em material sintético montada pelo sistema strobel, biqueira de conformação, solado de poliuretano bidensidade antiderrapante injetado diretamente no cabedal, sistema de absorção de energia na região do salto, resistente ao óleo combustível.";

const fabricante = "ESTIVAL";
const nome = "BOTINA DE SEGURANÇA NOBUCK";

function buildSmartQuery(nome, fabricante, descricao) {
    let queryParts = [];

    // 1. Base: Nome Simplificado + Fabricante
    // Remover termos genéricos do nome ("de segurança", "com", "tipo")
    const cleanName = nome
        .replace(/\bDE\b/gi, '')
        .replace(/\bSEGURANÇA\b/gi, '') // Segurança é genérico demais, a descrição já implica
        .replace(/\s+/g, ' ')
        .trim();

    queryParts.push(cleanName);
    queryParts.push(fabricante.split(' ')[0]); // Só a primeira palavra do fabricante (ESTIVAL)

    if (!descricao) return queryParts.join(' ');

    const descUpper = descricao.toUpperCase();

    // 2. Extratores de Valor (Keywords que mudam preço)

    // Materiais
    if (descUpper.includes("NOBUCK")) queryParts.push("Nobuck");
    if (descUpper.includes("VAQUETA")) queryParts.push("Vaqueta");
    if (descUpper.includes("RASPA")) queryParts.push("Raspa");
    if (descUpper.includes("COMPOSITE")) queryParts.push("Composite");
    if (descUpper.includes("FIBRA DE VIDRO")) queryParts.push("Fibra");

    // Fechamento
    if (descUpper.includes("ELASTICO") || descUpper.includes("ELÁSTICO")) queryParts.push("Elástico");
    if (descUpper.includes("CADARCO") || descUpper.includes("CADARÇO")) queryParts.push("Cadarço");
    if (descUpper.includes("VELCRO")) queryParts.push("Velcro");
    if (descUpper.includes("ZIPER") || descUpper.includes("ZÍPER")) queryParts.push("Zíper");

    // Construção / Solado
    if (descUpper.includes("BIDENSIDADE")) queryParts.push("Bidensidade");
    if (descUpper.includes("MONODENSIDADE")) queryParts.push("Monodensidade");

    // Biqueira (Crítico)
    if (descUpper.includes("BIQUEIRA DE AÇO") || descUpper.includes("BIQUEIRA DE ACO")) queryParts.push("Bico Aço");
    if (descUpper.includes("BIQUEIRA DE COMPOSITE")) queryParts.push("Bico Composite");
    if (descUpper.includes("BIQUEIRA DE PLASTICO") || descUpper.includes("CONFORMACAO") || descUpper.includes("CONFORMAÇÃO")) queryParts.push("Bico Plástico");

    return queryParts.join(' ');
}

console.log("--- TESTE DE EXTRAÇÃO INTELIGENTE ---");
const result = buildSmartQuery(nome, fabricante, descricaoCA40377);
console.log("Entrada:", { nome, fabricante, descricao: "..." });
console.log("Query Gerada:", result);

// Teste 2: Luva
const descLuva = "Luva de segurança confeccionada em látex natural, revestida internamente com flocos de algodão, antiderrapante na palma e dedos.";
const result2 = buildSmartQuery("LUVA DE SEGURANÇA", "MUCAMBO", descLuva);
console.log("\nTeste 2 (Luva):", result2);
