CREATE UNIQUE INDEX IF NOT EXISTS role_system_name_unique
  ON "Role" (name)
  WHERE "tenantId" IS NULL;