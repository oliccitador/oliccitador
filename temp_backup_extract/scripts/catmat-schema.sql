-- CATMAT Table Schema for Supabase
-- Run this in Supabase SQL Editor

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_catmat_classe ON catmat(classe);
CREATE INDEX IF NOT EXISTS idx_catmat_nome ON catmat USING GIN (to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_catmat_descricao ON catmat USING GIN (to_tsvector('portuguese', descricao));

-- Enable RLS (Row Level Security) but allow public read
ALTER TABLE catmat ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access (no authentication required for reads)
CREATE POLICY "Allow public read access" ON catmat
    FOR SELECT
    USING (true);

-- Create policy to prevent writes from client (only server can write)
CREATE POLICY "Prevent client writes" ON catmat
    FOR INSERT
    USING (false);

COMMENT ON TABLE catmat IS 'CATMAT (Catálogo de Materiais) database - 162k+ items from Brazilian government catalog';
