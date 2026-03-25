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

CREATE INDEX IF NOT EXISTS ix_student_rankings_lookup
    ON student_rankings(scope_key, metric_key, semester_no, institute_name, branch_name, course_name, passing_year, rank);
