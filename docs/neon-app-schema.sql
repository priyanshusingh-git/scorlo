-- Scorlo app-managed Neon schema
--
-- This document covers the tables created or managed by the Scorlo app layer.
-- It does not define the upstream academic source tables such as:
--   students
--   semester_results
--   subject_results
--   student_metrics
--
-- Notes:
-- - student routes read from student_app_snapshot_cache for speed
-- - rankings are stored in student_rankings
-- - support issues are stored in support_issues
-- - auth session rate limiting is stored in auth_rate_limits

CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    firebase_uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    display_name TEXT,
    role VARCHAR(16) NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Global admin-controlled app gates.
CREATE TABLE IF NOT EXISTS app_runtime_settings (
    id INTEGER PRIMARY KEY,
    signups_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    linking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_runtime_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Per-user dashboard access override for student accounts.
CREATE TABLE IF NOT EXISTS app_user_access (
    app_user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    dashboard_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff access model for admin-side RBAC and branch scoping.
CREATE TABLE IF NOT EXISTS staff_profiles (
    app_user_id BIGINT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    staff_type VARCHAR(32) NOT NULL,
    branch_name TEXT,
    status VARCHAR(24) NOT NULL DEFAULT 'active',
    created_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One app account can have one current student link state.
CREATE TABLE IF NOT EXISTS student_links (
    id BIGSERIAL PRIMARY KEY,
    app_user_id BIGINT NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
    student_id BIGINT UNIQUE REFERENCES students(id) ON DELETE SET NULL,
    roll_no VARCHAR(32) NOT NULL UNIQUE,
    dob TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending_data',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores reviewable student linking requests and corrections.
CREATE TABLE IF NOT EXISTS data_requests (
    id BIGSERIAL PRIMARY KEY,
    app_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    roll_no VARCHAR(32) NOT NULL,
    dob TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores precomputed ranking rows used by student "My Ranks" and admin rank views.
--
-- Current ranking model:
-- - branch scope remains cohort-specific
-- - batch scope is currently based on passing_year
-- - rank values are stored from the ranking rebuild pipeline
CREATE TABLE IF NOT EXISTS student_rankings (
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    scope_key VARCHAR(16) NOT NULL,
    metric_key VARCHAR(32) NOT NULL,
    semester_no SMALLINT NOT NULL DEFAULT 0,
    institute_name TEXT,
    branch_name TEXT,
    course_name TEXT,
    passing_year INTEGER,
    score NUMERIC(8, 2) NOT NULL,
    rank INTEGER NOT NULL,
    total_students INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, scope_key, metric_key, semester_no)
);

-- Stores the snapshot payload served to linked students.
CREATE TABLE IF NOT EXISTS student_app_snapshot_cache (
    student_id BIGINT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student-submitted support records and admin responses.
CREATE TABLE IF NOT EXISTS support_issues (
    id BIGSERIAL PRIMARY KEY,
    app_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
    roll_no VARCHAR(32),
    link_status VARCHAR(32),
    issue_type VARCHAR(32) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'open',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Admin action audit trail.
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    action_key VARCHAR(64) NOT NULL,
    target_table VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    before_json JSONB,
    after_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared auth/session rate limit store used by the app API.
-- Identifiers are stored as SHA-256 hashes, not raw values.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    scope_key VARCHAR(64) NOT NULL,
    identifier_hash CHAR(64) NOT NULL,
    request_count INTEGER NOT NULL,
    reset_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scope_key, identifier_hash)
);

CREATE INDEX IF NOT EXISTS ix_app_users_firebase_uid ON app_users(firebase_uid);
CREATE INDEX IF NOT EXISTS ix_app_users_role ON app_users(role);

CREATE INDEX IF NOT EXISTS ix_student_links_student_id ON student_links(student_id);
CREATE INDEX IF NOT EXISTS ix_student_links_status ON student_links(status);

CREATE INDEX IF NOT EXISTS ix_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS ix_data_requests_roll_no ON data_requests(roll_no);

CREATE INDEX IF NOT EXISTS ix_student_rankings_lookup
    ON student_rankings(scope_key, metric_key, semester_no, institute_name, branch_name, course_name, passing_year, rank);

CREATE INDEX IF NOT EXISTS ix_student_app_snapshot_cache_updated_at
    ON student_app_snapshot_cache(updated_at DESC);

CREATE INDEX IF NOT EXISTS ix_support_issues_app_user_id
    ON support_issues(app_user_id);
CREATE INDEX IF NOT EXISTS ix_support_issues_status
    ON support_issues(status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_support_issues_student_id
    ON support_issues(student_id);

CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_admin_user_id
    ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_target_table
    ON admin_audit_logs(target_table);

CREATE INDEX IF NOT EXISTS ix_auth_rate_limits_reset_at
    ON auth_rate_limits(reset_at);

CREATE INDEX IF NOT EXISTS ix_staff_profiles_branch_name
    ON staff_profiles(branch_name);
CREATE INDEX IF NOT EXISTS ix_staff_profiles_staff_type
    ON staff_profiles(staff_type);
