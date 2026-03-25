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

CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_admin_user_id
    ON admin_audit_logs(admin_user_id);

CREATE INDEX IF NOT EXISTS ix_admin_audit_logs_target_table
    ON admin_audit_logs(target_table);
