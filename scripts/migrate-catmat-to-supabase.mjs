/**
 * Migrate CATMAT data from local JSON to Supabase
 * This script reads lib/catmat-db.json and inserts all records into Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcqusrvpyfirnzsoctvt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateCATMAT() {
    console.log('🚀 Starting CATMAT migration to Supabase...\n');

    // 1. Read JSON file
    console.log('📖 Reading catmat-db.json...');
    const dbPath = path.join(__dirname, '..', 'lib', 'catmat-db.json');
    const fileContent = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(fileContent);

    const codes = Object.keys(db);
    console.log(`   Found ${codes.length} records\n`);

    // 2. Prepare records for insertion
    console.log('🔄 Preparing records...');
    const records = codes.map(codigo => {
        const item = db[codigo];
        return {
            codigo,
            nome: item.n || item.d || 'Sem nome',
            descricao: item.d || null,
            classe: item.c || null,
            pdm: item.n || null,
            unidade_padrao: 'UN',
            dados_completos: item
        };
    });
    console.log(`   Prepared ${records.length} records\n`);

    // 3. Insert in batches (Supabase has limit of ~1000 per batch)
    const batchSize = 1000;
    const totalBatches = Math.ceil(records.length / batchSize);

    console.log(`📊 Inserting in ${totalBatches} batches of ${batchSize}...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, records.length);
        const batch = records.slice(start, end);

        console.log(`   Batch ${i + 1}/${totalBatches}: Inserting records ${start + 1}-${end}...`);

        const { data, error } = await supabase
            .from('catmat')
            .upsert(batch, { onConflict: 'codigo' });

        if (error) {
            console.error(`   ❌ Error in batch ${i + 1}:`, error.message);
            errorCount += batch.length;
        } else {
            console.log(`   ✅ Batch ${i + 1} complete`);
            successCount += batch.length;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Success: ${successCount} records`);
    console.log(`   ❌ Errors: ${errorCount} records`);
    console.log(`   📊 Total: ${records.length} records`);

    // 4. Verify a sample record
    console.log('\n🔍 Verifying sample record (628378)...');
    const { data: testData, error: testError } = await supabase
        .from('catmat')
        .select('*')
        .eq('codigo', '628378')
        .single();

    if (testError) {
        console.error('   ❌ Verification failed:', testError.message);
    } else {
        console.log('   ✅ Verification passed!');
        console.log('   Sample record:', {
            codigo: testData.codigo,
            nome: testData.nome,
            classe: testData.classe
        });
    }

    console.log('\n✨ Migration complete!');
}

// Run migration
migrateCATMAT().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});
