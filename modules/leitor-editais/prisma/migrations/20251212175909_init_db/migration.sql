-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cnaes" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_duration_seconds" REAL NOT NULL,
    "pipeline_summary" TEXT NOT NULL,
    "pipeline_warnings" TEXT NOT NULL,
    "pre_analise" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "agents" TEXT NOT NULL,
    "black_box" TEXT NOT NULL,
    "ocr_quality_avg" REAL NOT NULL,
    "documents_total" INTEGER NOT NULL,
    "documents_processed" INTEGER NOT NULL,
    "pipeline_version" TEXT,
    "input_fingerprint" TEXT,
    CONSTRAINT "analysis_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_batches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "uploaded_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "filename_original" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocr_quality" REAL,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "uploaded_documents_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "analysis_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integrated_corpus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "texto_completo" TEXT,
    "storage_url_texto" TEXT,
    "global_lines" TEXT,
    "storage_url_global_lines" TEXT,
    "segments" TEXT,
    "storage_url_segments" TEXT,
    "line_map" TEXT,
    "storage_url_line_map" TEXT,
    "metadata" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integrated_corpus_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "analysis_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_questions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "analysis_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "alerts" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "user_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_answers_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "analysis_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_artifacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size_bytes" INTEGER NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    CONSTRAINT "generated_artifacts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "analysis_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "organizations_user_id_idx" ON "organizations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_user_id_cnpj_key" ON "organizations"("user_id", "cnpj");

-- CreateIndex
CREATE INDEX "analysis_batches_user_id_created_at_idx" ON "analysis_batches"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "analysis_batches_status_idx" ON "analysis_batches"("status");

-- CreateIndex
CREATE INDEX "analysis_batches_organization_id_created_at_idx" ON "analysis_batches"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "uploaded_documents_batch_id_doc_type_idx" ON "uploaded_documents"("batch_id", "doc_type");

-- CreateIndex
CREATE INDEX "uploaded_documents_sha256_idx" ON "uploaded_documents"("sha256");

-- CreateIndex
CREATE INDEX "uploaded_documents_uploaded_at_idx" ON "uploaded_documents"("uploaded_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "integrated_corpus_batch_id_key" ON "integrated_corpus"("batch_id");

-- CreateIndex
CREATE INDEX "user_questions_batch_id_mode_created_at_idx" ON "user_questions"("batch_id", "mode", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_answers_batch_id_created_at_idx" ON "user_answers"("batch_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "generated_artifacts_batch_id_type_created_at_idx" ON "generated_artifacts"("batch_id", "type", "created_at" DESC);
