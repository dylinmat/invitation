# Database Migrations

This directory contains database migrations for the EIOS (Event Invitation Operating System) platform.

## Migration Files

| # | File | Description | Status |
|---|------|-------------|--------|
| 001 | `001_add_critical_indexes.sql` | Initial performance indexes | ✅ Applied |
| 002 | `002_add_soft_delete_columns.sql` | Soft delete support | 📝 Ready |
| 003 | `003_add_audit_columns.sql` | Created_by/updated_by tracking | 📝 Ready |
| 004 | `004_add_missing_constraints.sql` | Unique/check constraints | 📝 Ready |
| 005 | `005_add_performance_indexes.sql` | GIN, composite, partial indexes | 📝 Ready |
| 006 | `006_create_admin_audit_log.sql` | Audit logging infrastructure | 📝 Ready |
| 007 | `007_create_audit_triggers.sql` | Automatic audit triggers | 📝 Ready |
| 008 | `008_create_api_keys_table.sql` | API key management | 📝 Ready |
| 009 | `009_create_webhooks_tables.sql` | Webhook configuration | 📝 Ready |
| 010 | `010_create_custom_fields.sql` | Extensible custom fields | 📝 Ready |
| 011 | `011_create_analytics_tables.sql` | Analytics & stats tables | 📝 Ready |
| 012 | `012_create_data_retention.sql` | GDPR compliance tables | 📝 Ready |
| 013 | `013_enable_rls.sql` | Row Level Security policies | 📝 Ready |
| 014 | `014_partition_large_tables.sql` | Table partitioning setup | 📝 Ready |
| 015 | `015_materialized_views.sql` | Analytics materialized views | 📝 Ready |

## Running Migrations

### Apply Single Migration
```bash
psql $DATABASE_URL -f db/migrations/002_add_soft_delete_columns.sql
```

### Apply All Migrations
```bash
for f in db/migrations/*.sql; do
  echo "Applying: $f"
  psql $DATABASE_URL -f "$f"
done
```

### Check Migration Status
```sql
-- Query to track applied migrations (requires migrations table)
SELECT * FROM schema_migrations ORDER BY applied_at;
```

## Migration Safety Guidelines

1. **Always use `IF EXISTS` / `IF NOT EXISTS`** - Makes migrations idempotent
2. **Use `CONCURRENTLY` for indexes** - Prevents table locks
3. **Test on staging first** - Never run untested migrations on production
4. **Have rollback scripts ready** - Know how to reverse each change
5. **Run during low-traffic periods** - Minimize user impact

## Pre-deployment Checklist

- [ ] Review migration in staging environment
- [ ] Verify rollback procedure
- [ ] Check disk space (indexes take space)
- [ ] Schedule maintenance window if needed
- [ ] Backup database before running
- [ ] Have monitoring dashboards ready

## Post-deployment Verification

```sql
-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Verify constraints
SELECT conname, contype, conrelid::regclass as table_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

-- Verify triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## Rollback Procedures

Each migration should be reversible. Example rollback for soft delete:

```sql
-- Rollback 002_add_soft_delete_columns.sql
ALTER TABLE organizations DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE organizations DROP COLUMN IF EXISTS deleted_by;
-- ... repeat for each table
```
