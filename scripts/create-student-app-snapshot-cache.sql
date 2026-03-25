CREATE TABLE IF NOT EXISTS student_app_snapshot_cache (
    student_id BIGINT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_student_app_snapshot_cache_updated_at
    ON student_app_snapshot_cache(updated_at DESC);
