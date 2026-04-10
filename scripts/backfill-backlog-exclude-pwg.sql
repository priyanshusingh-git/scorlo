WITH semester_carry_subjects AS (
  SELECT DISTINCT
    rs.student_id,
    rs.id AS result_session_id,
    sr.id AS semester_result_id,
    sr.semester_no,
    UPPER(TRIM(carry.subject_code)) AS subject_code
  FROM semester_results sr
  JOIN result_sessions rs ON rs.id = sr.result_session_id
  CROSS JOIN LATERAL UNNEST(rs.cop_subjects) AS carry(subject_code)
  WHERE TRIM(COALESCE(carry.subject_code, '')) <> ''
    AND EXISTS (
      SELECT 1
      FROM subject_results sub
      WHERE sub.semester_result_id = sr.id
        AND sub.code IS NOT NULL
        AND TRIM(sub.code) <> ''
        AND UPPER(TRIM(sub.code)) = UPPER(TRIM(carry.subject_code))
    )
    AND NOT EXISTS (
      SELECT 1
      FROM subject_results sub
      WHERE sub.semester_result_id = sr.id
        AND sub.code IS NOT NULL
        AND TRIM(sub.code) <> ''
        AND UPPER(TRIM(sub.code)) = UPPER(TRIM(carry.subject_code))
        AND UPPER(COALESCE(sub.grade, '')) = 'E#'
    )
),
latest_semesters AS (
  SELECT DISTINCT ON (rs.student_id, sr.semester_no)
    rs.student_id,
    sr.id AS semester_result_id,
    sr.semester_no
  FROM semester_results sr
  JOIN result_sessions rs ON rs.id = sr.result_session_id
  ORDER BY
    rs.student_id,
    sr.semester_no,
    rs.session_id DESC NULLS LAST,
    CASE WHEN UPPER(COALESCE(rs.session_type, '')) = 'BACK' THEN 1 ELSE 0 END DESC,
    sr.date_of_declaration DESC NULLS LAST,
    sr.id DESC
),
current_codes AS (
  SELECT DISTINCT
    ls.student_id,
    scs.subject_code
  FROM latest_semesters ls
  LEFT JOIN semester_carry_subjects scs
    ON scs.semester_result_id = ls.semester_result_id
),
historical_codes AS (
  SELECT DISTINCT
    student_id,
    subject_code
  FROM semester_carry_subjects
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
