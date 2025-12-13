/*
  Warnings:

  - You are about to drop the `user_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_questions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_answers";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "user_questions";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT,
    "cnaes" TEXT,
    "porte" TEXT,
    "situacao_cadastral" TEXT,
    "source" TEXT NOT NULL DEFAULT 'receita',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "batch_company_contexts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "company_profile_id" TEXT NOT NULL,
    "estoque" TEXT NOT NULL,
    "alcance_logistico_km" INTEGER,
    "apetite_risco" TEXT NOT NULL,
    "observacoes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_company_contexts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "analysis_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "batch_company_contexts_company_profile_id_fkey" FOREIGN KEY ("company_profile_id") REFERENCES "company_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "answer_format" TEXT,
    "evidence" TEXT,
    "status" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batch_questions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "analysis_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_cnpj_key" ON "company_profiles"("cnpj");

-- CreateIndex
CREATE INDEX "company_profiles_cnpj_idx" ON "company_profiles"("cnpj");

-- CreateIndex
CREATE INDEX "batch_company_contexts_batch_id_idx" ON "batch_company_contexts"("batch_id");

-- CreateIndex
CREATE INDEX "batch_company_contexts_company_profile_id_idx" ON "batch_company_contexts"("company_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_company_contexts_batch_id_key" ON "batch_company_contexts"("batch_id");

-- CreateIndex
CREATE INDEX "batch_questions_batch_id_mode_created_at_idx" ON "batch_questions"("batch_id", "mode", "created_at" DESC);
