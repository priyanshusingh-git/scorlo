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

CREATE INDEX IF NOT EXISTS ix_app_users_firebase_uid ON app_users(firebase_uid);
CREATE INDEX IF NOT EXISTS ix_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS ix_student_links_student_id ON student_links(student_id);
CREATE INDEX IF NOT EXISTS ix_student_links_status ON student_links(status);
CREATE INDEX IF NOT EXISTS ix_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS ix_data_requests_roll_no ON data_requests(roll_no);
CREATE INDEX IF NOT EXISTS ix_student_rankings_lookup
    ON student_rankings(scope_key, metric_key, semester_no, institute_name, branch_name, course_name, passing_year, rank);
CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_target_table ON admin_audit_logs(target_table);
