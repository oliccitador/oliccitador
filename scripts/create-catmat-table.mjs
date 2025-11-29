/**
 * Create CATMAT table in Supabase programmatically
 * Since SQL Editor had issues, we'll create via API
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcqusrvpyfirnzsoctvt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
    console.log('🚀 Creating CATMAT table via SQL...\n');

    const sql = `
-- Create table
CREATE TABLE IF NOT EXISTS catmat (
    codigo VARCHAR(10) PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    classe TEXT,
    pdm TEXT,
    unidade_padrao VARCHAR(10) DEFAULT 'UN',
    dados_completos JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catmat_classe ON catmat(classe);
CREATE INDEX IF NOT EXISTS idx_catmat_nome ON catmat USING GIN (to_tsvector('portuguese', nome));

-- Enable RLS
ALTER TABLE catmat ENABLE ROW LEVEL SECURITY;

-- Allow public read
DROP POLICY IF EXISTS "Allow public read access" ON catmat;
CREATE POLICY "Allow public read access" ON catmat FOR SELECT USING (true);
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

        if (error) {
            console.error('❌ Error:', error.message);
            console.log('\n📋 Manual Fix Required:');
            console.log('1. Go to: https://supabase.com/dashboard/project/bcqusrvpyfirnzsoctvt/editor');
            console.log('2. Click "Table Editor" → "New table"');
            console.log('3. Name: catmat');
            console.log('4. Add columns:');
            console.log('   - codigo (varchar, primary key)');
            console.log('   - nome (text)');
            console.log('   - descricao (text)');
            console.log('   - classe (text)');
            console.log('   - pdm (text)');
            console.log('   - unidade_padrao (varchar)');
            console.log('   - dados_completos (jsonb)');
            process.exit(1);
        }

        console.log('✅ Table created successfully!');

    } catch (error) {
        console.error('💥 Failed:', error.message);
    }
}

createTable();
