-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('FINANCIAL', 'DEBTS', 'INVENTORY', 'SALARY', 'BRANCHES', 'CUSTOM');

-- CreateTable
CREATE TABLE "report_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "reportType" "report_type" NOT NULL,
    "config" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_field_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dataSource" VARCHAR(50) NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "data_type" VARCHAR(20) NOT NULL,
    "filterable" BOOLEAN NOT NULL DEFAULT true,
    "sortable" BOOLEAN NOT NULL DEFAULT true,
    "aggregatable" BOOLEAN NOT NULL DEFAULT false,
    "groupable" BOOLEAN NOT NULL DEFAULT false,
    "default_visible" BOOLEAN NOT NULL DEFAULT false,
    "default_order" INTEGER NOT NULL DEFAULT 999,
    "category" VARCHAR(100),
    "format" VARCHAR(50),
    "enum_values" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "report_field_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID,
    "config" JSONB NOT NULL,
    "applied_filters" JSONB NOT NULL,
    "result_count" INTEGER NOT NULL,
    "execution_time" INTEGER NOT NULL,
    "export_format" VARCHAR(20),
    "file_size" INTEGER,
    "executed_by_id" UUID NOT NULL,
    "executed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_templates_created_by_id_idx" ON "report_templates"("created_by_id");

-- CreateIndex
CREATE INDEX "report_templates_reportType_idx" ON "report_templates"("reportType");

-- CreateIndex
CREATE INDEX "report_templates_is_public_idx" ON "report_templates"("is_public");

-- CreateIndex
CREATE INDEX "report_templates_is_default_idx" ON "report_templates"("is_default");

-- CreateIndex
CREATE INDEX "report_templates_deleted_at_idx" ON "report_templates"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "report_field_metadata_dataSource_field_name_key" ON "report_field_metadata"("dataSource", "field_name");

-- CreateIndex
CREATE INDEX "report_field_metadata_dataSource_idx" ON "report_field_metadata"("dataSource");

-- CreateIndex
CREATE INDEX "report_executions_template_id_idx" ON "report_executions"("template_id");

-- CreateIndex
CREATE INDEX "report_executions_executed_by_id_idx" ON "report_executions"("executed_by_id");

-- CreateIndex
CREATE INDEX "report_executions_executed_at_idx" ON "report_executions"("executed_at");

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_executed_by_id_fkey" FOREIGN KEY ("executed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
