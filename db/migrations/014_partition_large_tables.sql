-- Migration: Partition Large Tables
-- Created: 2026-02-17
-- Description: Table partitioning for high-volume tables

-- =====================================================
-- Partitioning Strategy Overview
-- =====================================================
-- 
-- Tables to partition when they grow large:
-- 1. admin_audit_log - by month (high write volume)
-- 2. webhook_deliveries - by month
-- 3. api_key_usage - by month
-- 4. event_timeline - by month
-- 5. message_events - by month
-- 6. invite_access_logs - by month
--
-- Partitioning Method: Range partitioning on date/timestamp

-- =====================================================
-- Partition Audit Log by Month
-- =====================================================

-- Note: Native partitioning requires creating a new table and migrating data
-- This is a template for when tables grow > 10M rows

-- Create partitioned audit log table (template for future migration)
--
-- CREATE TABLE admin_audit_log_partitioned (
--   LIKE admin_audit_log INCLUDING ALL
-- ) PARTITION BY RANGE (created_at);

-- Create monthly partitions (example)
-- CREATE TABLE admin_audit_log_y2026m01 PARTITION OF admin_audit_log_partitioned
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- CREATE TABLE admin_audit_log_y2026m02 PARTITION OF admin_audit_log_partitioned
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ...etc

-- =====================================================
-- Automated Partition Management Function
-- =====================================================

CREATE OR REPLACE FUNCTION create_monthly_partition(
  p_table_name TEXT,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_partition_name TEXT;
  v_start_date DATE;
  v_end_date DATE;
  v_sql TEXT;
BEGIN
  v_partition_name := p_table_name || '_y' || p_year || 'm' || LPAD(p_month::text, 2, '0');
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := v_start_date + INTERVAL '1 month';
  
  v_sql := format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
     FOR VALUES FROM (%L) TO (%L)',
    v_partition_name,
    p_table_name,
    v_start_date,
    v_end_date
  );
  
  EXECUTE v_sql;
  
  RETURN v_partition_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create Future Partitions Automatically
-- =====================================================

CREATE OR REPLACE FUNCTION ensure_audit_log_partitions()
RETURNS void AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
  v_months_ahead INTEGER := 3;
  v_i INTEGER;
  v_target_date DATE;
BEGIN
  FOR v_i IN 0..v_months_ahead LOOP
    v_target_date := v_current_date + (v_i || ' months')::INTERVAL;
    PERFORM create_monthly_partition(
      'admin_audit_log_partitioned',
      EXTRACT(YEAR FROM v_target_date)::INTEGER,
      EXTRACT(MONTH FROM v_target_date)::INTEGER
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Archive Old Partitions
-- =====================================================

CREATE OR REPLACE FUNCTION archive_old_partition(
  p_partition_name TEXT,
  p_archive_table_name TEXT
)
RETURNS void AS $$
DECLARE
  v_sql TEXT;
BEGIN
  -- Move data to archive
  v_sql := format(
    'INSERT INTO %I SELECT * FROM %I',
    p_archive_table_name,
    p_partition_name
  );
  EXECUTE v_sql;
  
  -- Drop partition
  v_sql := format('DROP TABLE %I', p_partition_name);
  EXECUTE v_sql;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Table Size Monitoring View
-- =====================================================

CREATE OR REPLACE VIEW table_size_monitoring AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
  pg_relation_size(schemaname||'.'||tablename) as table_bytes,
  pg_indexes_size(schemaname||'.'||tablename) as indexes_bytes,
  (SELECT COUNT(*) FROM pg_stat_user_tables t WHERE t.relname = tablename) as has_stats
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- Partition Recommendations View
-- =====================================================

CREATE OR REPLACE VIEW partition_recommendations AS
SELECT 
  tablename,
  pg_total_relation_size('public.'||tablename) as size_bytes,
  CASE 
    WHEN pg_total_relation_size('public.'||tablename) > 10 * 1024 * 1024 * 1024 THEN 'CRITICAL: >10GB - Partition immediately'
    WHEN pg_total_relation_size('public.'||tablename) > 1024 * 1024 * 1024 THEN 'WARNING: >1GB - Consider partitioning'
    WHEN pg_total_relation_size('public.'||tablename) > 100 * 1024 * 1024 THEN 'INFO: >100MB - Monitor growth'
    ELSE 'OK'
  END as recommendation
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_audit_log',
    'webhook_deliveries',
    'api_key_usage',
    'event_timeline',
    'message_events',
    'invite_access_logs',
    'photo_uploads',
    'guests',
    'rsvp_submissions'
  )
ORDER BY size_bytes DESC;

-- =====================================================
-- Index Maintenance for Large Tables
-- =====================================================

-- Function to rebuild indexes concurrently
CREATE OR REPLACE FUNCTION rebuild_table_indexes(p_table_name TEXT)
RETURNS TABLE(index_name TEXT, status TEXT) AS $$
DECLARE
  v_index RECORD;
BEGIN
  FOR v_index IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = p_table_name AND schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE format('REINDEX INDEX CONCURRENTLY %I', v_index.indexname);
      RETURN QUERY SELECT v_index.indexname, 'SUCCESS'::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_index.indexname, 'FAILED: ' || SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Cleanup Old Data (based on retention policy)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Move to archive first
  INSERT INTO admin_audit_log_archive
  SELECT *, NOW() as archived_at
  FROM admin_audit_log
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Delete from main table
  DELETE FROM admin_audit_log
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_webhook_deliveries(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM webhook_deliveries
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
    AND is_success = TRUE; -- Only delete successful deliveries
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
