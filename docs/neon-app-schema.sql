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

CREATE INDEX IF NOT EXISTS ix_app_users_firebase_uid ON app_users(firebase_uid);
CREATE INDEX IF NOT EXISTS ix_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS ix_student_links_student_id ON student_links(student_id);
CREATE INDEX IF NOT EXISTS ix_student_links_status ON student_links(status);
CREATE INDEX IF NOT EXISTS ix_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS ix_data_requests_roll_no ON data_requests(roll_no);
