-- =============================================================================
-- Phase 1→2 Bridge: Drop Legacy user_roles Table
-- APPLY ORDER: Run AFTER 00_auth_foundation.sql, BEFORE 01_rbac_schema.sql
--
-- Drops the Phase 1 user_roles table (which used the app_role enum column)
-- so Phase 2 can recreate it with the role_id FK design.
-- =============================================================================

DROP TABLE IF EXISTS public.user_roles CASCADE;
