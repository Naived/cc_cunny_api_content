-- Sql command for PostgreSQL
SET TIME ZONE '+00:00';

BEGIN;

CREATE TABLE "learning_materials" (
  "id" BIGSERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL UNIQUE,
  "description" VARCHAR(255) NOT NULL,
  "sub_materials" JSONB DEFAULT  NULL, 
  "sub_body_materials" JSONB DEFAULT  NULL,
  "learning_image_path" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NULL,
  "updated_at" TIMESTAMP DEFAULT NULL
);

COMMIT;