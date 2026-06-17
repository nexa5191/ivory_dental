-- System roles (platform-level: tenantId NULL, isSystem true, undeletable).
INSERT INTO "Role" ("tenantId", name, description, "isSystem")
VALUES
  (NULL, 'superadmin', 'Platform superadmin — full access', true),
  (NULL, 'admin', 'Tenant administrator', true)
ON CONFLICT (name) WHERE "tenantId" IS NULL DO NOTHING;

-- Minimal permission set for SUPER_ADMIN.
INSERT INTO "Permission" ("roleId", permission)
SELECT r.id, p.perm
FROM "Role" r
CROSS JOIN (
  VALUES ('tenants:read'), ('tenants:write'), ('tenants:invite'), ('platform:admin')
) AS p(perm)
WHERE r.name = 'superadmin' AND r."tenantId" IS NULL
ON CONFLICT ("roleId", permission) DO NOTHING;
