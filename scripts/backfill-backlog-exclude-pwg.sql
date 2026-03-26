WITH grace_subjects AS (
  SELECT DISTINCT
    rs.id AS result_session_id,
    UPPER(TRIM(sub.code)) AS subject_code
  FROM result_sessions rs
  JOIN semester_results sr ON sr.result_session_id = rs.id
  JOIN subject_results sub ON sub.semester_result_id = sr.id
  WHERE sub.code IS NOT NULL
    AND TRIM(sub.code) <> ''
    AND UPPER(COALESCE(sub.grade, '')) = 'E#'
),
effective_carry_subjects AS (
  SELECT
    rs.student_id,
    rs.id AS result_session_id,
    UPPER(TRIM(carry.subject_code)) AS subject_code
  FROM result_sessions rs
  CROSS JOIN LATERAL UNNEST(rs.cop_subjects) AS carry(subject_code)
  LEFT JOIN grace_subjects gs
    ON gs.result_session_id = rs.id
   AND gs.subject_code = UPPER(TRIM(carry.subject_code))
  WHERE TRIM(COALESCE(carry.subject_code, '')) <> ''
    AND gs.subject_code IS NULL
),
latest_sessions AS (
  SELECT DISTINCT ON (rs.student_id)
    rs.student_id,
    rs.id AS result_session_id
  FROM result_sessions rs
  ORDER BY
    rs.student_id,
    rs.session_id DESC NULLS LAST,
    CASE WHEN UPPER(COALESCE(rs.session_type, '')) = 'BACK' THEN 1 ELSE 0 END DESC,
    rs.id DESC
),
current_codes AS (
  SELECT DISTINCT
    ls.student_id,
    ecs.subject_code
  FROM latest_sessions ls
  LEFT JOIN effective_carry_subjects ecs
    ON ecs.result_session_id = ls.result_session_id
),
historical_codes AS (
  SELECT DISTINCT
    student_id,
    subject_code
  FROM effective_carry_subjects
),
current_counts AS (
  SELECT
    student_id,
    COUNT(DISTINCT subject_code)::int AS active_backs
  FROM current_codes
  WHERE subject_code IS NOT NULL
  GROUP BY student_id
),
cleared_counts AS (
  SELECT
    hc.student_id,
    COUNT(DISTINCT hc.subject_code)::int AS cleared_backs
  FROM historical_codes hc
  LEFT JOIN current_codes cc
    ON cc.student_id = hc.student_id
   AND cc.subject_code = hc.subject_code
  WHERE cc.subject_code IS NULL
  GROUP BY hc.student_id
),
backlog_counts AS (
  SELECT
    s.id AS student_id,
    COALESCE(cc.active_backs, 0) AS active_backs,
    COALESCE(cl.cleared_backs, 0) AS cleared_backs
  FROM students s
  LEFT JOIN current_counts cc ON cc.student_id = s.id
  LEFT JOIN cleared_counts cl ON cl.student_id = s.id
),
updated AS (
  UPDATE student_metrics sm
  SET
    active_backs = bc.active_backs,
    cleared_backs = bc.cleared_backs,
    updated_at = NOW()
  FROM backlog_counts bc
  WHERE sm.student_id = bc.student_id
    AND (
      sm.active_backs IS DISTINCT FROM bc.active_backs OR
      sm.cleared_backs IS DISTINCT FROM bc.cleared_backs
    )
  RETURNING sm.student_id
)
SELECT COUNT(*)::int AS updated_rows
FROM updated;
