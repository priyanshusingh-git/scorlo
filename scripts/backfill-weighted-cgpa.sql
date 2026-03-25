WITH semester_credits(semester_no, credit) AS (
  VALUES
    (1, 22::numeric),
    (2, 22::numeric),
    (3, 23::numeric),
    (4, 21::numeric),
    (5, 23::numeric),
    (6, 21::numeric),
    (7, 19::numeric),
    (8, 16::numeric)
),
latest_semesters AS (
  SELECT
    rs.student_id,
    sr.semester_no,
    sr.sgpa::numeric AS sgpa,
    ROW_NUMBER() OVER (
      PARTITION BY rs.student_id, sr.semester_no
      ORDER BY
        rs.session_id DESC NULLS LAST,
        CASE WHEN UPPER(COALESCE(rs.session_type, '')) = 'BACK' THEN 1 ELSE 0 END DESC,
        sr.date_of_declaration DESC NULLS LAST,
        sr.id DESC
    ) AS row_no
  FROM semester_results sr
  JOIN result_sessions rs ON rs.id = sr.result_session_id
  WHERE sr.sgpa IS NOT NULL
),
weighted_cgpa AS (
  SELECT
    ls.student_id,
    ROUND(SUM(ls.sgpa * sc.credit) / SUM(sc.credit), 2) AS cgpa
  FROM latest_semesters ls
  JOIN semester_credits sc ON sc.semester_no = ls.semester_no
  WHERE ls.row_no = 1
  GROUP BY ls.student_id
)
UPDATE student_metrics sm
SET
  cgpa = wc.cgpa,
  updated_at = NOW()
FROM weighted_cgpa wc
WHERE sm.student_id = wc.student_id;
